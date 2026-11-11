"""Configuração operacional do produto seguindo o padrão Pydantic Settings do HUB."""

from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(extra="ignore", case_sensitive=False)
    product_id: Literal["meusite"] = "meusite"
    app_name: Literal["MeuSite"] = "MeuSite"
    app_env: Literal["development", "test", "production"] = Field(
        default="development", validation_alias="APP_ENV"
    )
    version: str = "0.1.0"
    build: str = Field(default="meusite-0.1.0-20261111", validation_alias="BUILD_SHA")


@lru_cache
def get_settings():
    return Settings()
