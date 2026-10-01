from typing import List, Union
from pydantic import field_validator, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Application configuration
    APP_ENV: str = "development"
    CORS_ORIGINS: Union[List[str], str] = ["http://localhost:5173", "http://localhost:3000"]
    
    @field_validator("CORS_ORIGINS", mode="before")
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            # Parse comma-separated string into a list
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    # Database Configuration
    DATABASE_URL: SecretStr

    # Supabase Configuration
    SUPABASE_URL: str
    SUPABASE_SERVICE_ROLE_KEY: SecretStr

    # Gemini AI integration
    GEMINI_API_KEY: Union[SecretStr, None] = None
    GEMINI_MODEL: str = "gemini-1.5-flash"

    # Pydantic v2 configuration to load from .env file
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()
