from typing import List, Union, Optional
from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "NeuroFusion AI"
    PROJECT_DESCRIPTION: str = "Advanced AI Platform Backend API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Security
    SECRET_KEY: str = "neurofusion_secret_key_change_in_production_super_secret"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Google OAuth 2.0 Settings
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/v1/auth/google/callback"
    FRONTEND_URL: str = "http://localhost:5173"
    ADMIN_EMAIL_WHITELIST: Union[List[str], str] = []

    # Database (Default: MySQL on port 3306)
    DATABASE_URL: str = "mysql+aiomysql://root:Vineet%40123@127.0.0.1:3306/neurofusion"
    SYNC_DATABASE_URL: str = "mysql+pymysql://root:Vineet%40123@127.0.0.1:3306/neurofusion"

    # SMS Provider & OTP Delivery Settings
    SMS_PROVIDER: str = "development"  # 'development', 'fast2sms', 'twilio', 'msg91'
    SMS_MODE: str = "development"      # 'development' or 'production'
    SMS_API_KEY: str = ""
    SMS_API_SECRET: str = ""
    SMS_SENDER_ID: str = "NEUROFUSION"

    # Provider specific keys
    FAST2SMS_API_KEY: str = ""
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_PHONE_NUMBER: str = ""
    MSG91_AUTH_KEY: str = ""
    MSG91_TEMPLATE_ID: str = ""

    # OTP Security Timers
    OTP_EXPIRY_MINUTES: int = 10
    OTP_EXPIRY_SECONDS: int = 30  # Default 30s quick expiry if desired, or standard 10 mins
    OTP_COOLDOWN_SECONDS: int = 60

    # CORS
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, str) and v.startswith("["):
            import json
            try:
                return json.loads(v)
            except Exception:
                return [v]
        return v

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_database_url(cls, v: str) -> str:
        if isinstance(v, str):
            v_clean = v.strip()
            if v_clean.startswith("postgres://"):
                return v_clean.replace("postgres://", "postgresql+asyncpg://", 1)
            elif v_clean.startswith("postgresql://") and not v_clean.startswith("postgresql+"):
                return v_clean.replace("postgresql://", "postgresql+asyncpg://", 1)
            elif v_clean.startswith("mysql://") and not v_clean.startswith("mysql+"):
                return v_clean.replace("mysql://", "mysql+aiomysql://", 1)
            return v_clean
        return v

    @field_validator("SYNC_DATABASE_URL", mode="before")
    @classmethod
    def assemble_sync_database_url(cls, v: Union[str, None]) -> Optional[str]:
        if isinstance(v, str) and v.strip():
            v_clean = v.strip()
            if v_clean.startswith("postgres://"):
                return v_clean.replace("postgres://", "postgresql+psycopg2://", 1)
            elif v_clean.startswith("postgresql://") and not v_clean.startswith("postgresql+"):
                return v_clean.replace("postgresql://", "postgresql+psycopg2://", 1)
            elif v_clean.startswith("mysql://") and not v_clean.startswith("mysql+"):
                return v_clean.replace("mysql://", "mysql+pymysql://", 1)
            return v_clean
        return v

    @model_validator(mode="after")
    def sync_database_urls(self):
        if "postgresql" in self.DATABASE_URL:
            # If SYNC_DATABASE_URL is missing or still default mysql, align with postgresql
            if not self.SYNC_DATABASE_URL or "mysql" in self.SYNC_DATABASE_URL:
                self.SYNC_DATABASE_URL = self.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql+psycopg2://").replace("postgresql://", "postgresql+psycopg2://")
        return self

    @field_validator("ADMIN_EMAIL_WHITELIST", mode="before")
    @classmethod
    def assemble_admin_whitelist(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip().lower() for i in v.split(",") if i.strip()]
        elif isinstance(v, str) and v.startswith("["):
            import json
            try:
                res = json.loads(v)
                return [str(x).lower() for x in res]
            except Exception:
                return [v.lower()]
        elif isinstance(v, list):
            return [str(x).lower() for x in v]
        return v

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
