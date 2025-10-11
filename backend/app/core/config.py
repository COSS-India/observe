from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    # Database settings
    DATABASE_URL: str ="postgresql://postgres:postgres123@localhost:5433/AI4Voicedb"
    
    # JWT settings
    SECRET_KEY: str = "your-secret-key-here-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Captcha settings
    CAPTCHA_EXPIRE_MINUTES: int = 5
    
    # Email settings (for signup notifications)
    SMTP_SERVER: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: Optional[str] = "shesj70@gmail.com"
    SMTP_PASSWORD: Optional[str] = "cqnqawitfbyqvkwr"
    SMTP_TLS: bool = True
    SMTP_SSL: bool = False
    FROM_EMAIL: str = "noreply@adopter.gov.in"
    FROM_NAME: str = "Adopter Platform"
    FRONTEND_URL: str = "http://localhost:3000"  # Update this to your actual frontend URL
    
    # App settings
    APP_NAME: str = "Adopter Login API"
    DEBUG: bool = True
    
    class Config:
        env_file = ".env"


settings = Settings()
