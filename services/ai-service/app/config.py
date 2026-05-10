from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL:    str = "postgresql://postgres:postgres@localhost:5432/emergency_db"
    KAFKA_BOOTSTRAP: str = "localhost:9092"
    AI_SERVICE_PORT: int = 8084
    MODEL_PATH:      str = "app/models"
    DEBUG:           bool = True

    class Config:
        env_file = ".env"

settings = Settings()