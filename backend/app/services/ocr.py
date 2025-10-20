from __future__ import annotations

import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Optional

import ocrmypdf
from docling.document_converter import DocumentConverter
from sqlmodel import Session, select

from ..config import get_settings
from ..database import engine
from ..models import OCRJob, Setting
from ..schemas import OCRJobDetail, OCRJobRead
from .mistral_client import generate_summary

logger = logging.getLogger(__name__)

_converter: DocumentConverter | None = None


def get_converter() -> DocumentConverter:
    global _converter
    if _converter is None:
        _converter = DocumentConverter()
    return _converter


def ensure_storage_dirs(base_dir: Path) -> dict[str, Path]:
    uploads = base_dir / "uploads"
    results = base_dir / "results"
    for directory in (uploads, results):
        directory.mkdir(parents=True, exist_ok=True)
    return {"uploads": uploads, "results": results}


def get_default_engine(session: Session) -> str:
    statement = select(Setting).where(Setting.key == "ocr_engine")
    setting = session.exec(statement).first()
    return setting.value if setting else "docling"


def set_default_engine(session: Session, engine: str) -> None:
    statement = select(Setting).where(Setting.key == "ocr_engine")
    setting = session.exec(statement).first()
    if setting:
        setting.value = engine
    else:
        setting = Setting(key="ocr_engine", value=engine)
        session.add(setting)
    session.commit()


def serialize_job(job: OCRJob, prefix: str) -> OCRJobRead:
    return OCRJobRead(
        id=job.id,
        original_filename=job.original_filename,
        engine=job.engine,
        auto_detect=job.auto_detect,
        language=job.language,
        folder=job.folder,
        folder_id=job.folder_id,
        status=job.status,
        progress=job.progress,
        error=job.error,
        output_filename=job.output_filename,
        output_mime_type=job.output_mime_type,
        text_excerpt=job.text_excerpt,
        summary=job.summary,
        created_at=job.created_at,
        updated_at=job.updated_at,
        download_url=f"{prefix}/ocr/jobs/{job.id}/download" if job.output_filename else None,
    )


def serialize_job_detail(job: OCRJob, prefix: str) -> OCRJobDetail:
    options = json.loads(job.options) if job.options else None
    base = serialize_job(job, prefix).model_dump()
    base["options"] = options
    return OCRJobDetail(**base)


def update_job_status(
    session: Session,
    job: OCRJob,
    *,
    status: str,
    progress: int,
    error: Optional[str] = None,
) -> None:
    job.status = status
    job.progress = progress
    job.error = error
    job.updated_at = datetime.utcnow()
    session.add(job)
    session.commit()
    session.refresh(job)


def language_to_tesseract_code(language: Optional[str]) -> Optional[str]:
    if not language:
        return None
    mapping = {
        "romanian": "ron",
        "english": "eng",
        "german": "deu",
        "italian": "ita",
        "spanish": "spa",
        "hungarian": "hun",
        "french": "fra",
        "ukrainian": "ukr",
    }
    return mapping.get(language.lower())


def process_job(job_id: int) -> None:
    settings = get_settings()
    dirs = ensure_storage_dirs(settings.data_dir)

    with Session(engine) as session:
        job = session.get(OCRJob, job_id)
        if not job:
            logger.error("Job %s not found", job_id)
            return

        update_job_status(session, job, status="processing", progress=10)

        input_path = dirs["uploads"] / job.stored_filename
        options = json.loads(job.options) if job.options else {}

        try:
            if job.engine == "ocrmypdf":
                output_path = dirs["results"] / f"{job.id}_ocr.pdf"
                kwargs = {
                    "optimize": int(options.get("optimizationLevel", 1)),
                    "rotate_pages": bool(options.get("rotatePages", True)),
                    "remove_background": bool(options.get("removeBackground", False)),
                    "skip_text": bool(options.get("skipText", True)),
                    "redo_ocr": bool(options.get("redoOcr", False)),
                    "deskew": bool(options.get("deskew", False)),
                    "output_type": options.get("outputType", "pdfa"),
                }
                language = language_to_tesseract_code(job.language) if not job.auto_detect else None
                if language:
                    kwargs["language"] = language
                ocrmypdf.ocr(
                    str(input_path),
                    str(output_path),
                    **kwargs,
                )
                job.output_filename = output_path.name
                job.output_mime_type = "application/pdf"
                text_excerpt = None
            else:
                converter = get_converter()
                result = converter.convert(str(input_path))
                markdown = result.document.export_to_markdown()
                output_path = dirs["results"] / f"{job.id}_docling.md"
                output_path.write_text(markdown, encoding="utf-8")
                job.output_filename = output_path.name
                job.output_mime_type = "text/markdown"
                text_excerpt = markdown[:2000]

            job.text_excerpt = text_excerpt

            if text_excerpt:
                summary_prompt = (
                    "Rezuma textul extras dintr-un document scanat in 3-4 fraze in limba romana. "
                    "Textul este urmatorul:\n"
                    f"{text_excerpt[:4000]}"
                )
                summary = generate_summary(summary_prompt)
                if summary:
                    job.summary = summary

            update_job_status(session, job, status="completed", progress=100)
        except Exception as exc:  # pylint: disable=broad-except
            logger.exception("Failed to process job %s", job_id)
            update_job_status(session, job, status="failed", progress=100, error=str(exc))
