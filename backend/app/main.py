from __future__ import annotations

import json
import logging
import time
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Callable

from flask import Flask, abort, jsonify, make_response, request, send_file
from flask_cors import CORS
from pydantic import ValidationError
from werkzeug.utils import secure_filename
from sqlmodel import select

from .config import get_settings
from .database import get_session, init_db
from .models import OCRJob
from .schemas import (
    FolderCreate,
    FolderUpdate,
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
from .services.folder import (
    create_folder as create_folder_service,
    create_folder_zip,
    delete_folder as delete_folder_service,
    get_folder,
    list_folders,
    serialize_folder,
    update_folder as update_folder_service,
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


@dataclass(frozen=True)
class RouteDefinition:
    rule: str
    methods: tuple[str, ...]
    view_func: Callable[..., Any]


ROUTES: list[RouteDefinition] = []


def _normalize_rule(rule: str) -> str:
    if not rule:
        return "/"
    normalized = rule if rule.startswith("/") else f"/{rule}"
    if normalized != "/":
        normalized = normalized.rstrip("/")
    return normalized or "/"


def route(rule: str, *, methods: list[str]):
    """Register a route definition for later attachment to the Flask app."""

    normalized_rule = _normalize_rule(rule)

    def decorator(func: Callable[..., Any]):
        ROUTES.append(RouteDefinition(normalized_rule, tuple(methods), func))
        return func

    return decorator


def _register_routes(app: Flask, prefix: str) -> None:
    for definition in ROUTES:
        endpoint_base = definition.view_func.__name__
        root_endpoint = f"{endpoint_base}_root_{id(app)}"
        app.add_url_rule(
            definition.rule,
            endpoint=root_endpoint,
            view_func=definition.view_func,
            methods=list(definition.methods),
            strict_slashes=False,
        )

        if prefix:
            prefixed_rule = prefix if definition.rule == "/" else f"{prefix}{definition.rule}"
            prefixed_endpoint = f"{endpoint_base}_prefixed_{id(app)}"
            app.add_url_rule(
                prefixed_rule,
                endpoint=prefixed_endpoint,
                view_func=definition.view_func,
                methods=list(definition.methods),
                strict_slashes=False,
            )


@route("/health", methods=["GET"])
def health() -> Any:
    return json_response({"status": "ok"})


@route("/settings/ocr-engine", methods=["GET"])
def get_ocr_engine() -> Any:
    with get_session() as session:
        engine_value = get_default_engine(session)
    response = SettingResponse(engine=engine_value)
    return json_response(response.model_dump())


@route("/settings/ocr-engine", methods=["POST"])
def update_ocr_engine() -> Any:
    payload = request.get_json(silent=True) or {}
    data = parse_model(SettingUpdate, payload)
    if data.engine not in {"docling", "ocrmypdf"}:
        abort(json_response({"detail": "Engine invalid"}, 400))
    with get_session() as session:
        set_default_engine(session, data.engine)
    return json_response(SettingResponse(engine=data.engine).model_dump())


@route("/ocr/jobs", methods=["GET"])
def list_ocr_jobs() -> Any:
    with get_session() as session:
        statement = select(OCRJob).order_by(OCRJob.created_at.desc())
        jobs = session.exec(statement).all()
        serialized = [serialize_job(job, settings.api_prefix).model_dump() for job in jobs]
    return json_response(serialized)


@route("/ocr/jobs", methods=["POST"])
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


@route("/ocr/jobs/<int:job_id>", methods=["GET"])
def get_job(job_id: int) -> Any:
    with get_session() as session:
        job = session.get(OCRJob, job_id)
        if not job:
            abort(json_response({"detail": "Job inexistent"}, 404))
        response = serialize_job_detail(job, settings.api_prefix)
    return json_response(response.model_dump())


@route("/ocr/jobs/<int:job_id>", methods=["PATCH"])
def update_job(job_id: int) -> Any:
    payload = request.get_json(silent=True) or {}
    data = parse_model(OCRJobUpdate, payload)
    with get_session() as session:
        job = session.get(OCRJob, job_id)
        if not job:
            abort(json_response({"detail": "Job inexistent"}, 404))
        if data.folder is not None:
            job.folder = data.folder if data.folder.lower() != "default" else None
        if data.folder_id is not None:
            job.folder_id = data.folder_id
        session.add(job)
        session.commit()
        session.refresh(job)
        response = serialize_job(job, settings.api_prefix)
    return json_response(response.model_dump())


@route("/ocr/jobs/<int:job_id>", methods=["DELETE"])
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


@route("/ocr/jobs/<int:job_id>/download", methods=["GET"])
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


@route("/word/generate", methods=["POST"])
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


@route("/word/convert", methods=["POST"])
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


@route("/word/documents", methods=["GET"])
def list_word_documents_route():
    with get_session() as session:
        documents = list_documents(session)
        serialized = [
            serialize_word_document(document, settings.api_prefix).model_dump()
            for document in documents
        ]
    return json_response(serialized)


@route("/word/documents/<int:document_id>/download", methods=["GET"])
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


@route("/folders", methods=["GET"])
def list_folders_route():
    with get_session() as session:
        folders = list_folders(session)
        serialized = [serialize_folder(session, folder).model_dump() for folder in folders]
    return json_response(serialized)


@route("/folders", methods=["POST"])
def create_folder_route():
    payload = request.get_json(silent=True) or {}
    data = parse_model(FolderCreate, payload)
    with get_session() as session:
        folder = create_folder_service(
            session,
            name=data.name,
            description=data.description,
            color=data.color,
            parent_id=data.parent_id,
        )
        response = serialize_folder(session, folder)
    return json_response(response.model_dump(), 201)


@route("/folders/<int:folder_id>", methods=["GET"])
def get_folder_route(folder_id: int):
    with get_session() as session:
        folder = get_folder(session, folder_id)
        if not folder:
            abort(json_response({"detail": "Folder inexistent"}, 404))
        response = serialize_folder(session, folder)
    return json_response(response.model_dump())


@route("/folders/<int:folder_id>", methods=["PATCH"])
def update_folder_route(folder_id: int):
    payload = request.get_json(silent=True) or {}
    data = parse_model(FolderUpdate, payload)
    with get_session() as session:
        folder = update_folder_service(
            session,
            folder_id,
            name=data.name,
            description=data.description,
            color=data.color,
            parent_id=data.parent_id,
        )
        if not folder:
            abort(json_response({"detail": "Folder inexistent"}, 404))
        response = serialize_folder(session, folder)
    return json_response(response.model_dump())


@route("/folders/<int:folder_id>", methods=["DELETE"])
def delete_folder_route(folder_id: int):
    with get_session() as session:
        success = delete_folder_service(session, folder_id)
        if not success:
            abort(json_response({"detail": "Folder inexistent"}, 404))
    return ("", 204)


@route("/folders/<int:folder_id>/download", methods=["GET"])
def download_folder_route(folder_id: int):
    with get_session() as session:
        folder = get_folder(session, folder_id)
        if not folder:
            abort(json_response({"detail": "Folder inexistent"}, 404))
        
        zip_buffer = create_folder_zip(session, folder_id)
        if not zip_buffer:
            abort(json_response({"detail": "Nu s-a putut crea arhiva"}, 500))
    
    return send_file(
        zip_buffer,
        mimetype="application/zip",
        as_attachment=True,
        download_name=f"{folder.name}.zip",
    )


def create_app() -> Flask:
    app = Flask(__name__)
    app.url_map.strict_slashes = False
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

    _register_routes(app, settings.api_prefix)

    return app


app = create_app()


if __name__ == "__main__":  # pragma: no cover - manual execution helper
    app.run(host="0.0.0.0", port=8000)

