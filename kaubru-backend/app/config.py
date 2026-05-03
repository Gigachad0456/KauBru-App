from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "KauBru AI Translator"
    SECRET_KEY: str = "kaubru-super-secret-key-2024-prod" # Should be set in .env or environment
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    DATABASE_URL: str = "sqlite:///./kaubru.db"

    # Email (SMTP) — set in .env for real email delivery
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = "noreply@kaubru.app"
    FRONTEND_URL: str = "http://localhost:5173"   # admin panel URL
    ALLOWED_ORIGINS: str = "*"
    
    # Google OAuth Client IDs
    GOOGLE_ANDROID_CLIENT_ID: str = ""
    GOOGLE_IOS_CLIENT_ID: str = ""
    GOOGLE_WEB_CLIENT_ID: str = ""


    # Rate limiting (requests per window)
    RATE_LIMIT_TRANSLATE: str = "30/minute"
    RATE_LIMIT_AUTH: str = "10/minute"
    RATE_LIMIT_DEFAULT: str = "60/minute"

    class Config:
        env_file = ".env"


settings = Settings()
