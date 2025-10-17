from contextlib import contextmanager
from typing import Iterator

from sqlalchemy.exc import OperationalError
from sqlmodel import Session, SQLModel, create_engine

from .config import get_settings


settings = get_settings()
connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
engine = create_engine(str(settings.database_url), connect_args=connect_args, echo=False)


def init_db() -> None:
    try:
        SQLModel.metadata.create_all(engine, checkfirst=True)
    except OperationalError as exc:  # pragma: no cover - defensive branch
        if "already exists" not in str(exc).lower():
            raise


@contextmanager
def get_session() -> Iterator[Session]:
    session = Session(engine)
    try:
        yield session
    finally:
        session.close()
