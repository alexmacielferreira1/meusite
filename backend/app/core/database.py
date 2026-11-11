"""Ponto estável para módulos novos; preserva o contrato SQLAlchemy da base já validada."""

from app.db import database_url, engine, normalize_url

__all__ = ["database_url", "engine", "normalize_url"]
