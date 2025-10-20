from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class SettingResponse(BaseModel):
    engine: str


class SettingUpdate(BaseModel):
    engine: str


class OCRJobRead(BaseModel):
    id: int
    original_filename: str
    engine: str
    auto_detect: bool
    language: Optional[str]
    folder: Optional[str]
    folder_id: Optional[int]
    status: str
    progress: int
    error: Optional[str]
    output_filename: Optional[str]
    output_mime_type: Optional[str]
    text_excerpt: Optional[str]
    summary: Optional[str]
    created_at: datetime
    updated_at: datetime
    download_url: Optional[str]


class OCRJobDetail(OCRJobRead):
    options: Optional[dict]


class OCRJobUpdate(BaseModel):
    folder: Optional[str] = None
    folder_id: Optional[int] = None


class WordDocumentRead(BaseModel):
    id: int
    title: str
    source: str
    original_filename: Optional[str]
    file_name: str
    mime_type: str
    summary: Optional[str]
    created_at: datetime
    download_url: str
    folder_id: Optional[int] = None


class WordGenerateRequest(BaseModel):
    title: str
    content: str


class WordGenerateResponse(BaseModel):
    document: WordDocumentRead


class WordConvertResponse(BaseModel):
    document: WordDocumentRead


class FolderCreate(BaseModel):
    name: str
    description: Optional[str] = None
    color: str = "green"
    parent_id: Optional[int] = None


class FolderUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    parent_id: Optional[int] = None


class FolderRead(BaseModel):
    id: int
    name: str
    description: Optional[str]
    color: str
    parent_id: Optional[int]
    created_at: datetime
    updated_at: datetime
    document_count: int = 0
