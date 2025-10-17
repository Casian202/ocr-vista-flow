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


class WordGenerateRequest(BaseModel):
    title: str
    content: str


class WordGenerateResponse(BaseModel):
    document: WordDocumentRead


class WordConvertResponse(BaseModel):
    document: WordDocumentRead
