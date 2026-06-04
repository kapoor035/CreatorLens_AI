import os
import logging

logger = logging.getLogger(__name__)
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    PROJECT_NAME: str = "CreatorLens AI"
    API_V1_STR: str = "/api/v1"
    
    # Environment
    ENVIRONMENT: str = Field(default="development")
    
    # Security / CORS
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000"]
    
    # Database
    DATABASE_URL: str = Field(default="sqlite:///./creatorlens.db")
    CHROMADB_DIR: str = Field(default="./chroma_db")
    
    # LLM Settings
    GEMINI_API_KEY: str = Field(default="")
    GEMINI_MODEL: str = "gemini-2.5-flash"
    
    # Scraping / Third-party APIs
    APIFY_TOKEN: str = Field(default="")
    
    # Rate Limiting
    LIMIT_PER_MINUTE: str = "20"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

if settings.APIFY_TOKEN:
    logger.info("APIFY_TOKEN successfully detected in environment configuration.")
else:
    logger.warning("APIFY_TOKEN was NOT detected in environment configuration (empty or missing).")
