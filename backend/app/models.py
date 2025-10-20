from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlmodel import Column, DateTime, Field, SQLModel


class TimestampMixin(SQLModel):
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)


class Setting(SQLModel, table=True):
    key: str = Field(primary_key=True)
    value: str


class OCRJob(TimestampMixin, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    original_filename: str
    stored_filename: str
    engine: str
    auto_detect: bool = True
    language: Optional[str] = None
    folder: Optional[str] = None  # Legacy string-based folder (kept for compatibility)
    folder_id: Optional[int] = Field(default=None, foreign_key="folder.id")
    status: str = Field(default="queued")
    progress: int = Field(default=0)
    error: Optional[str] = None
    output_filename: Optional[str] = None
    output_mime_type: Optional[str] = None
    options: Optional[str] = None
    text_excerpt: Optional[str] = None
    summary: Optional[str] = None


class WordDocument(TimestampMixin, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    source: str
    original_filename: Optional[str] = None
    file_name: str
    mime_type: str = Field(default="application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    summary: Optional[str] = None
    job_id: Optional[int] = Field(default=None, foreign_key="ocrjob.id")
    folder_id: Optional[int] = Field(default=None, foreign_key="folder.id")


class Folder(TimestampMixin, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    description: Optional[str] = None
    color: str = Field(default="green")
    parent_id: Optional[int] = Field(default=None, foreign_key="folder.id")
