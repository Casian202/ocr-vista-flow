from __future__ import annotations

import json
import logging
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Any

from flask import Blueprint, Flask, abort, jsonify, make_response, request, send_file
from flask_cors import CORS
from pydantic import ValidationError
from werkzeug.utils import secure_filename
from sqlmodel import select

from .config import get_settings
from .database import get_session, init_db
from .models import OCRJob
from .schemas import (
    OCRJobDetail,
    OCRJobUpdate,
    SettingResponse,
    SettingUpdate,
    WordConvertResponse,
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
executor = ThreadPoolExecutor(max_workers=4)


def json_response(data: Any, status_code: int = 200):
    response = make_response(jsonify(data), status_code)
    response.headers["Content-Type"] = "application/json"
    return response


def parse_model(model_cls, payload: dict[str, Any]):
    try:
        return model_cls(**payload)
    except ValidationError as exc:  # pragma: no cover - defensive branch
        logger.warning("Validation error for %s: %s", model_cls.__name__, exc)
        abort(json_response({"detail": exc.errors()}, 400))


api_router = Blueprint("api", __name__)


@api_router.get("/health")
def health() -> Any:
    return json_response({"status": "ok"})


@api_router.get("/settings/ocr-engine")
def get_ocr_engine() -> Any:
    with get_session() as session:
        engine_value = get_default_engine(session)
    response = SettingResponse(engine=engine_value)
    return json_response(response.model_dump())


@api_router.post("/settings/ocr-engine")
def update_ocr_engine() -> Any:
    payload = request.get_json(silent=True) or {}
    data = parse_model(SettingUpdate, payload)
    if data.engine not in {"docling", "ocrmypdf"}:
        abort(json_response({"detail": "Engine invalid"}, 400))
    with get_session() as session:
        set_default_engine(session, data.engine)
    return json_response(SettingResponse(engine=data.engine).model_dump())


@api_router.get("/ocr/jobs")
def list_ocr_jobs() -> Any:
    with get_session() as session:
        statement = select(OCRJob).order_by(OCRJob.created_at.desc())
        jobs = session.exec(statement).all()
        serialized = [serialize_job(job, settings.api_prefix).model_dump() for job in jobs]
    return json_response(serialized)


@api_router.post("/ocr/jobs")
def create_ocr_job() -> Any:
    file = request.files.get("file")
    if file is None or not file.filename:
        abort(json_response({"detail": "Fișier invalid"}, 400))

    auto_detect = request.form.get("auto_detect", "true").lower() in {"true", "1", "yes", "on"}
    language = request.form.get("language") or None
    folder = request.form.get("folder") or None
    engine_override = request.form.get("engine_override") or None
    options_raw = request.form.get("options")

    try:
        options_payload = json.loads(options_raw) if options_raw else None
    except json.JSONDecodeError as exc:
        logger.warning("Invalid options payload: %s", exc)
        return json_response({"detail": "Opțiuni invalide"}, 400)

    sanitized_filename = secure_filename(Path(file.filename).name) or "upload"
    stored_filename = f"{time.time_ns()}_{sanitized_filename}"

    with get_session() as session:
        selected_engine = engine_override or get_default_engine(session)
        if selected_engine not in {"docling", "ocrmypdf"}:
            abort(json_response({"detail": "Motor OCR necunoscut"}, 400))

        dirs = ensure_storage_dirs(settings.data_dir)
        upload_path = dirs["uploads"] / stored_filename
        file.save(upload_path)

        folder_value = folder if folder and folder.lower() != "default" else None

        job = OCRJob(
            original_filename=Path(file.filename).name,
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

        executor.submit(process_job, job.id)

        response = serialize_job(job, settings.api_prefix)
        return json_response(response.model_dump(), 201)


@api_router.get("/ocr/jobs/<int:job_id>")
def get_job(job_id: int) -> Any:
    with get_session() as session:
        job = session.get(OCRJob, job_id)
        if not job:
            abort(json_response({"detail": "Job inexistent"}, 404))
        response = serialize_job_detail(job, settings.api_prefix)
    return json_response(response.model_dump())


@api_router.patch("/ocr/jobs/<int:job_id>")
def update_job(job_id: int) -> Any:
    payload = request.get_json(silent=True) or {}
    data = parse_model(OCRJobUpdate, payload)
    with get_session() as session:
        job = session.get(OCRJob, job_id)
        if not job:
            abort(json_response({"detail": "Job inexistent"}, 404))
        if data.folder is not None:
            job.folder = data.folder if data.folder.lower() != "default" else None
        session.add(job)
        session.commit()
        session.refresh(job)
        response = serialize_job(job, settings.api_prefix)
    return json_response(response.model_dump())


@api_router.delete("/ocr/jobs/<int:job_id>")
def delete_job(job_id: int):
    with get_session() as session:
        job = session.get(OCRJob, job_id)
        if not job:
            abort(json_response({"detail": "Job inexistent"}, 404))
        dirs = ensure_storage_dirs(settings.data_dir)
        (dirs["uploads"] / job.stored_filename).unlink(missing_ok=True)
        if job.output_filename:
            (dirs["results"] / job.output_filename).unlink(missing_ok=True)
        session.delete(job)
        session.commit()
    return ("", 204)


@api_router.get("/ocr/jobs/<int:job_id>/download")
def download_job(job_id: int):
    with get_session() as session:
        job = session.get(OCRJob, job_id)
        if not job or not job.output_filename:
            abort(json_response({"detail": "Fișier inexistent"}, 404))
        results_dir = ensure_storage_dirs(settings.data_dir)["results"]
        file_path = results_dir / job.output_filename
        if not file_path.exists():
            abort(json_response({"detail": "Fișier lipsă"}, 404))
        media_type = job.output_mime_type or "application/octet-stream"
    return send_file(
        file_path,
        mimetype=media_type,
        as_attachment=True,
        download_name=file_path.name,
    )


@api_router.post("/word/generate")
def generate_word_document():
    payload = request.get_json(silent=True) or {}
    data = parse_model(WordGenerateRequest, payload)
    if not data.content.strip():
        abort(json_response({"detail": "Conținutul documentului este obligatoriu"}, 400))
    with get_session() as session:
        document = create_word_document_from_text(session, data.title, data.content)
        response = WordGenerateResponse(
            document=serialize_word_document(document, settings.api_prefix)
        )
    return json_response(response.model_dump(), 201)


@api_router.post("/word/convert")
def convert_pdf_to_word_document():
    file = request.files.get("file")
    if file is None or not file.filename:
        abort(json_response({"detail": "Fișier invalid"}, 400))

    title = request.form.get("title", "")
    job_id_raw = request.form.get("job_id")
    job_id = None
    if job_id_raw:
        try:
            job_id = int(job_id_raw)
        except ValueError:
            abort(json_response({"detail": "Identificator job invalid"}, 400))

    dirs = ensure_storage_dirs(settings.data_dir)
    temp_path = dirs["uploads"] / f"convert_{time.time_ns()}_{secure_filename(file.filename)}"
    file.save(temp_path)

    try:
        with get_session() as session:
            document = convert_pdf_to_word(
                session,
                title or file.filename,
                temp_path,
                file.filename,
            )
            if job_id:
                document.job_id = job_id
                session.add(document)
                session.commit()
                session.refresh(document)
            response = WordConvertResponse(
                document=serialize_word_document(document, settings.api_prefix)
            )
    finally:
        temp_path.unlink(missing_ok=True)

    return json_response(response.model_dump(), 201)


@api_router.get("/word/documents")
def list_word_documents_route():
    with get_session() as session:
        documents = list_documents(session)
        serialized = [
            serialize_word_document(document, settings.api_prefix).model_dump()
            for document in documents
        ]
    return json_response(serialized)


@api_router.get("/word/documents/<int:document_id>/download")
def download_word_document(document_id: int):
    with get_session() as session:
        document = get_document(session, document_id)
        if not document:
            abort(json_response({"detail": "Document inexistent"}, 404))
        file_path = documents_dir() / document.file_name
        if not file_path.exists():
            abort(json_response({"detail": "Fișier lipsă"}, 404))
    return send_file(
        file_path,
        mimetype=document.mime_type,
        as_attachment=True,
        download_name=document.file_name,
    )


def create_app() -> Flask:
    app = Flask(__name__)
    CORS(
        app,
        resources={r"*": {"origins": settings.frontend_origins + ["http://localhost", "http://127.0.0.1"]}},
        supports_credentials=True,
    )

    @app.errorhandler(404)
    def handle_not_found(error):  # pragma: no cover - framework integration
        return json_response({"detail": getattr(error, "description", "Resource not found")}, 404)

    @app.errorhandler(400)
    def handle_bad_request(error):  # pragma: no cover - framework integration
        description = getattr(error, "description", "Invalid request")
        if isinstance(description, dict):
            return json_response(description, 400)
        return json_response({"detail": description}, 400)

    init_db()
    ensure_storage_dirs(settings.data_dir)
    documents_dir()

    app.register_blueprint(api_router, url_prefix=settings.api_prefix)
    return app


app = create_app()


if __name__ == "__main__":  # pragma: no cover - manual execution helper
    app.run(host="0.0.0.0", port=8000)

