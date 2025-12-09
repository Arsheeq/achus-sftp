import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/enlitedu")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    
    # Oracle Cloud Object Storage Configuration
    ORACLE_ACCESS_KEY: str = os.getenv("ORACLE_ACCESS_KEY", "")
    ORACLE_SECRET_KEY: str = os.getenv("ORACLE_SECRET_KEY", "")
    ORACLE_NAMESPACE: str = os.getenv("ORACLE_NAMESPACE", "")
    ORACLE_REGION: str = os.getenv("ORACLE_REGION", "us-phoenix-1")
    ORACLE_BUCKET_NAME: str = os.getenv("ORACLE_BUCKET_NAME", "")
    
    class Config:
        env_file = ".env"

settings = Settings()
