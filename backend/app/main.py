from __future__ import annotations

import json
import logging
import time
from pathlib import Path
from typing import Generator, Optional

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    FastAPI,
    File,
    Form,
    HTTPException,
    UploadFile,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlmodel import Session, select

from .config import get_settings
from .database import get_session, init_db
from .models import OCRJob
from .schemas import (
    OCRJobDetail,
    OCRJobRead,
    OCRJobUpdate,
    SettingResponse,
    SettingUpdate,
    WordConvertResponse,
    WordDocumentRead,
    WordGenerateRequest,
    WordGenerateResponse,
)
from .services.ocr import (
    ensure_storage_dirs,
    get_default_engine,
    process_job,
    serialize_job,
    serialize_job_detail,
    set_default_engine,
)
from .services.word import (
    convert_pdf_to_word,
    create_word_document_from_text,
    documents_dir,
    get_document,
    list_documents,
    serialize_word_document,
)

logger = logging.getLogger(__name__)
settings = get_settings()


app = FastAPI(title="OCR Vista Flow API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.frontend_origins + ["http://localhost", "http://127.0.0.1"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def db_session() -> Generator[Session, None, None]:
    with get_session() as session:
        yield session


@app.on_event("startup")
def startup_event() -> None:
    init_db()
    ensure_storage_dirs(settings.data_dir)
    documents_dir()


api_router = APIRouter(prefix=settings.api_prefix)


@api_router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@api_router.get("/settings/ocr-engine", response_model=SettingResponse)
def get_ocr_engine(session: Session = Depends(db_session)) -> SettingResponse:
    engine = get_default_engine(session)
    return SettingResponse(engine=engine)


@api_router.post("/settings/ocr-engine", response_model=SettingResponse)
def update_ocr_engine(
    payload: SettingUpdate,
    session: Session = Depends(db_session),
) -> SettingResponse:
    if payload.engine not in {"docling", "ocrmypdf"}:
        raise HTTPException(status_code=400, detail="Engine invalid")
    set_default_engine(session, payload.engine)
    return SettingResponse(engine=payload.engine)


@api_router.get("/ocr/jobs", response_model=list[OCRJobRead])
def list_ocr_jobs(session: Session = Depends(db_session)) -> list[OCRJobRead]:
    statement = select(OCRJob).order_by(OCRJob.created_at.desc())
    jobs = session.exec(statement).all()
    return [serialize_job(job, settings.api_prefix) for job in jobs]


@api_router.post("/ocr/jobs", response_model=OCRJobRead, status_code=201)
async def create_ocr_job(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    auto_detect: bool = Form(True),
    language: Optional[str] = Form(None),
    folder: Optional[str] = Form(None),
    engine_override: Optional[str] = Form(None),
    options: Optional[str] = Form(None),
    session: Session = Depends(db_session),
) -> OCRJobRead:
    if not file.filename:
        raise HTTPException(status_code=400, detail="Fișier invalid")

    dirs = ensure_storage_dirs(settings.data_dir)
    original_name = Path(file.filename).name
    stored_filename = f"{time.time_ns()}_{original_name.replace(' ', '_')}"
    upload_path = dirs["uploads"] / stored_filename
    upload_path.write_bytes(await file.read())

    selected_engine = engine_override or get_default_engine(session)
    if selected_engine not in {"docling", "ocrmypdf"}:
        raise HTTPException(status_code=400, detail="Motor OCR necunoscut")

    try:
        options_payload = json.loads(options) if options else None
    except json.JSONDecodeError as exc:  # pragma: no cover - invalid payload
        raise HTTPException(status_code=400, detail="Opțiuni invalide") from exc

    folder_value = folder if folder and folder.lower() != "default" else None

    job = OCRJob(
        original_filename=original_name,
        stored_filename=stored_filename,
        engine=selected_engine,
        auto_detect=auto_detect,
        language=language,
        folder=folder_value,
        options=json.dumps(options_payload) if options_payload else None,
    )
    session.add(job)
    session.commit()
    session.refresh(job)

    background_tasks.add_task(process_job, job.id)

    return serialize_job(job, settings.api_prefix)


@api_router.get("/ocr/jobs/{job_id}", response_model=OCRJobDetail)
def get_job(job_id: int, session: Session = Depends(db_session)) -> OCRJobDetail:
    job = session.get(OCRJob, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job inexistent")
    return serialize_job_detail(job, settings.api_prefix)


@api_router.patch("/ocr/jobs/{job_id}", response_model=OCRJobRead)
def update_job(job_id: int, payload: OCRJobUpdate, session: Session = Depends(db_session)) -> OCRJobRead:
    job = session.get(OCRJob, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job inexistent")
    if payload.folder is not None:
        job.folder = (payload.folder if payload.folder.lower() != "default" else None)
    session.add(job)
    session.commit()
    session.refresh(job)
    return serialize_job(job, settings.api_prefix)


@api_router.delete("/ocr/jobs/{job_id}", status_code=204)
def delete_job(job_id: int, session: Session = Depends(db_session)) -> None:
    job = session.get(OCRJob, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job inexistent")
    dirs = ensure_storage_dirs(settings.data_dir)
    (dirs["uploads"] / job.stored_filename).unlink(missing_ok=True)
    if job.output_filename:
        (dirs["results"] / job.output_filename).unlink(missing_ok=True)
    session.delete(job)
    session.commit()


@api_router.get("/ocr/jobs/{job_id}/download")
def download_job(job_id: int, session: Session = Depends(db_session)) -> FileResponse:
    job = session.get(OCRJob, job_id)
    if not job or not job.output_filename:
        raise HTTPException(status_code=404, detail="Fișier inexistent")
    results_dir = ensure_storage_dirs(settings.data_dir)["results"]
    file_path = results_dir / job.output_filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Fișier lipsă")
    media_type = job.output_mime_type or "application/octet-stream"
    return FileResponse(file_path, media_type=media_type, filename=file_path.name)


@api_router.post("/word/generate", response_model=WordGenerateResponse, status_code=201)
def generate_word_document(
    payload: WordGenerateRequest,
    session: Session = Depends(db_session),
) -> WordGenerateResponse:
    if not payload.content.strip():
        raise HTTPException(status_code=400, detail="Conținutul documentului este obligatoriu")
    document = create_word_document_from_text(session, payload.title, payload.content)
    return WordGenerateResponse(document=serialize_word_document(document, settings.api_prefix))


@api_router.post("/word/convert", response_model=WordConvertResponse, status_code=201)
async def convert_pdf_to_word_document(
    title: str = Form(""),
    job_id: Optional[int] = Form(None),
    file: UploadFile = File(...),
    session: Session = Depends(db_session),
) -> WordConvertResponse:
    if not file.filename:
        raise HTTPException(status_code=400, detail="Fișier invalid")
    upload_dir = ensure_storage_dirs(settings.data_dir)["uploads"]
    temp_path = upload_dir / f"convert_{time.time_ns()}_{file.filename}"
    temp_path.write_bytes(await file.read())
    try:
        document = convert_pdf_to_word(session, title or file.filename, temp_path, file.filename)
        if job_id:
            document.job_id = job_id
            session.add(document)
            session.commit()
            session.refresh(document)
    finally:
        temp_path.unlink(missing_ok=True)
    return WordConvertResponse(document=serialize_word_document(document, settings.api_prefix))


@api_router.get("/word/documents", response_model=list[WordDocumentRead])
def list_word_documents(session: Session = Depends(db_session)) -> list[WordDocumentRead]:
    documents = list_documents(session)
    return [serialize_word_document(doc, settings.api_prefix) for doc in documents]


@api_router.get("/word/documents/{document_id}/download")
def download_word_document(document_id: int, session: Session = Depends(db_session)) -> FileResponse:
    document = get_document(session, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document inexistent")
    file_path = documents_dir() / document.file_name
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Fișier lipsă")
    return FileResponse(
        file_path,
        media_type=document.mime_type,
        filename=document.file_name,
    )


app.include_router(api_router)
