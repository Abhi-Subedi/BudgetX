from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    project_name: str = "BudgetX API"
    environment: str = "development"
    database_url: str = "sqlite:///./budgetx.db"
    secret_key: str = "change-me-in-production-use-a-long-random-string"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 14
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://127.0.0.1:3000"]

    # Google OAuth
    google_client_id: str = ""
    google_client_secret: str = ""

    # Apple Sign In
    apple_client_id: str = ""
    apple_team_id: str = ""
    apple_key_id: str = ""
    apple_private_key: str = ""


@lru_cache
def get_settings() -> Settings:
    return Settings()
