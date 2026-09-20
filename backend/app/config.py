import os
from typing import List

try:
    from pydantic_settings import BaseSettings
    class Settings(BaseSettings):
        PROJECT_NAME: str = "SAATHI - AI-Powered Urban Traffic Intelligence & Decision Support"
        VERSION: str = "1.0.0"
        ENVIRONMENT: str = "development"
        DEBUG: bool = True

        CITY_NAME: str = "Hyderabad"
        CITY_CENTER_LAT: float = 17.3850
        CITY_CENTER_LON: float = 78.4867

        DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./saathi.db")

        SECRET_KEY: str = os.getenv("SECRET_KEY", "saathi-super-secret-key-neurax-hackathon-2026")
        ALGORITHM: str = "HS256"
        ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

        SIMULATION_DEFAULT_SPEED: float = 1.0
        SIMULATION_STEP_SECONDS: int = 5
        DATA_DIR: str = os.getenv("DATA_DIR", "./data")
        MODELS_DIR: str = os.getenv("MODELS_DIR", "./data/models")

        CORS_ORIGINS: List[str] = [
            "http://localhost:5173",
            "http://localhost:3000",
            "http://127.0.0.1:5173",
            "*"
        ]

        class Config:
            env_file = ".env"
            extra = "ignore"
except ImportError:
    from pydantic import BaseModel
    class Settings(BaseModel):
        PROJECT_NAME: str = "SAATHI - AI-Powered Urban Traffic Intelligence & Decision Support"
        VERSION: str = "1.0.0"
        ENVIRONMENT: str = "development"
        DEBUG: bool = True
        CITY_NAME: str = "Hyderabad"
        CITY_CENTER_LAT: float = 17.3850
        CITY_CENTER_LON: float = 78.4867
        DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./saathi.db")
        SECRET_KEY: str = os.getenv("SECRET_KEY", "saathi-super-secret-key-neurax-hackathon-2026")
        ALGORITHM: str = "HS256"
        ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
        SIMULATION_DEFAULT_SPEED: float = 1.0
        SIMULATION_STEP_SECONDS: int = 5
        DATA_DIR: str = os.getenv("DATA_DIR", "./data")
        MODELS_DIR: str = os.getenv("MODELS_DIR", "./data/models")
        CORS_ORIGINS: List[str] = ["*"]

settings = Settings()
