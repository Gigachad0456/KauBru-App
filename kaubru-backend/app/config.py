from pydantic_settings import BaseSettings
import os


class Settings(BaseSettings):
    APP_NAME: str = "KauBru AI Translator"
    SECRET_KEY: str = "kaubru-super-secret-key-2024-prod"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # DATABASE_URL must be set in Railway environment variables.
    # Falls back to SQLite only for local development.
    DATABASE_URL: str = os.environ.get("DATABASE_URL", "sqlite:///./kaubru.db")

    # Email (SMTP)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = "noreply@kaubru.app"
    FRONTEND_URL: str = "http://localhost:5173"
    ALLOWED_ORIGINS: str = "*"

    # Google OAuth Client IDs
    GOOGLE_ANDROID_CLIENT_ID: str = ""
    GOOGLE_IOS_CLIENT_ID: str = ""
    GOOGLE_WEB_CLIENT_ID: str = ""

    # Cloudinary (avatar storage)
    CLOUDINARY_CLOUD_NAME: str = os.environ.get("CLOUDINARY_CLOUD_NAME", "")
    CLOUDINARY_API_KEY: str = os.environ.get("CLOUDINARY_API_KEY", "")
    CLOUDINARY_API_SECRET: str = os.environ.get("CLOUDINARY_API_SECRET", "")

    # Rate limiting
    RATE_LIMIT_TRANSLATE: str = "30/minute"
    RATE_LIMIT_AUTH: str = "10/minute"
    RATE_LIMIT_DEFAULT: str = "60/minute"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
