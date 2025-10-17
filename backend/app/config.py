from functools import lru_cache
from pathlib import Path
from typing import List

from pydantic import model_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///data/app.db"
    data_dir: Path = Path("data")
    mistral_api_key: str | None = None
    frontend_origins: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8080",
    ]
    api_prefix: str = "/api"

    @model_validator(mode="after")
    def normalize_prefix(self) -> "Settings":
        prefix = (self.api_prefix or "").strip()
        if not prefix or prefix == "/":
            self.api_prefix = ""
            return self

        normalized = "/" + prefix.strip("/")
        self.api_prefix = normalized
        return self

    class Config:
        env_file = ".env"
        env_prefix = ""


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    settings = Settings()
    settings.data_dir.mkdir(parents=True, exist_ok=True)
    return settings
