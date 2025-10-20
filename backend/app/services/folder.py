from __future__ import annotations

import io
import logging
import zipfile
from pathlib import Path
from typing import Optional

from sqlmodel import Session, select

from ..config import get_settings
from ..models import Folder, OCRJob, WordDocument
from ..schemas import FolderRead
from .ocr import ensure_storage_dirs

logger = logging.getLogger(__name__)


def get_folder(session: Session, folder_id: int) -> Optional[Folder]:
    return session.get(Folder, folder_id)


def list_folders(session: Session) -> list[Folder]:
    statement = select(Folder).order_by(Folder.name)
    return list(session.exec(statement).all())


def create_folder(
    session: Session,
    name: str,
    description: Optional[str] = None,
    color: str = "green",
    parent_id: Optional[int] = None,
) -> Folder:
    folder = Folder(
        name=name,
        description=description,
        color=color,
        parent_id=parent_id,
    )
    session.add(folder)
    session.commit()
    session.refresh(folder)
    return folder


def update_folder(
    session: Session,
    folder_id: int,
    name: Optional[str] = None,
    description: Optional[str] = None,
    color: Optional[str] = None,
    parent_id: Optional[int] = None,
) -> Optional[Folder]:
    folder = get_folder(session, folder_id)
    if not folder:
        return None
    
    if name is not None:
        folder.name = name
    if description is not None:
        folder.description = description
    if color is not None:
        folder.color = color
    if parent_id is not None:
        folder.parent_id = parent_id
    
    session.add(folder)
    session.commit()
    session.refresh(folder)
    return folder


def delete_folder(session: Session, folder_id: int) -> bool:
    folder = get_folder(session, folder_id)
    if not folder:
        return False
    
    # Remove folder reference from OCR jobs
    ocr_jobs = session.exec(select(OCRJob).where(OCRJob.folder_id == folder_id)).all()
    for job in ocr_jobs:
        job.folder_id = None
        session.add(job)
    
    # Remove folder reference from Word documents
    word_docs = session.exec(select(WordDocument).where(WordDocument.folder_id == folder_id)).all()
    for doc in word_docs:
        doc.folder_id = None
        session.add(doc)
    
    session.delete(folder)
    session.commit()
    return True


def get_folder_document_count(session: Session, folder_id: int) -> int:
    ocr_count = len(list(session.exec(select(OCRJob).where(OCRJob.folder_id == folder_id)).all()))
    word_count = len(list(session.exec(select(WordDocument).where(WordDocument.folder_id == folder_id)).all()))
    return ocr_count + word_count


def serialize_folder(session: Session, folder: Folder) -> FolderRead:
    return FolderRead(
        id=folder.id,
        name=folder.name,
        description=folder.description,
        color=folder.color,
        parent_id=folder.parent_id,
        created_at=folder.created_at,
        updated_at=folder.updated_at,
        document_count=get_folder_document_count(session, folder.id),
    )


def create_folder_zip(session: Session, folder_id: int) -> Optional[io.BytesIO]:
    """Create a ZIP file containing all documents in a folder."""
    folder = get_folder(session, folder_id)
    if not folder:
        return None
    
    settings = get_settings()
    dirs = ensure_storage_dirs(settings.data_dir)
    results_dir = dirs["results"]
    
    # Get all documents in folder
    ocr_jobs = list(session.exec(select(OCRJob).where(OCRJob.folder_id == folder_id)).all())
    word_docs = list(session.exec(select(WordDocument).where(WordDocument.folder_id == folder_id)).all())
    
    # Create ZIP in memory
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        # Add OCR job outputs
        for job in ocr_jobs:
            if job.output_filename:
                file_path = results_dir / job.output_filename
                if file_path.exists():
                    zip_file.write(file_path, f"ocr/{job.original_filename}")
        
        # Add Word documents
        word_dir = results_dir / "word_documents"
        for doc in word_docs:
            file_path = word_dir / doc.file_name
            if file_path.exists():
                zip_file.write(file_path, f"word/{doc.file_name}")
    
    zip_buffer.seek(0)
    return zip_buffer
