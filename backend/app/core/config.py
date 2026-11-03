from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
import os
from pathlib import Path

# Base directory for backend
BASE_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    """Application configuration settings loaded from environment or .env file."""

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # General app settings
    APP_NAME: str = "VTU Faculty Workload & Timetable Management System"
    APP_VERSION: str = "0.1.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "127.0.0.1"

    # CORS settings
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

    # Firebase Admin SDK Configuration
    FIREBASE_CREDENTIALS_PATH: Optional[str] = Field(
        default=None,
        description="Path to serviceAccountKey.json relative to backend directory or absolute",
    )
    FIREBASE_PROJECT_ID: Optional[str] = Field(
        default=None,
        description="Firebase project ID from Firebase Console",
    )

    # Optional Gemini AI API key
    GEMINI_API_KEY: Optional[str] = None

    # Security: Dev auth bypass is strictly disabled by default and only functional in development
    ENABLE_DEV_AUTH_BYPASS: bool = False

    @property
    def resolved_firebase_credentials_path(self) -> Optional[Path]:
        """Resolves the credentials file path safely."""
        if not self.FIREBASE_CREDENTIALS_PATH:
            return None

        candidate = Path(self.FIREBASE_CREDENTIALS_PATH)
        if candidate.is_absolute():
            return candidate if candidate.exists() else None

        # Try relative to BASE_DIR
        relative_path = BASE_DIR / candidate
        if relative_path.exists():
            return relative_path

        return None


settings = Settings()
