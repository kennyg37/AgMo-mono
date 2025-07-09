"""Configuration settings."""

import os
from pathlib import Path
from typing import Optional, List

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""
    
    # Server Configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True
    
    # CORS settings - use comma-separated string for easier .env configuration
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:5173"
    
    # Database settings
    DATABASE_URL: str = "postgresql://agmo_user:agmo_password@localhost:5432/agmo_farm"
    
    # Authentication settings
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # OpenAI settings
    OPENAI_API_KEY: str = ""
    
    # Simulation Connection
    SIMULATION_WS_URL: str = "ws://localhost:3001"
    
    # Model Configuration
    MODEL_NAME: str = "PPO"
    LEARNING_RATE: float = 3e-4
    BATCH_SIZE: int = 64
    N_STEPS: int = 2048
    N_EPOCHS: int = 10
    GAMMA: float = 0.99
    GAE_LAMBDA: float = 0.95
    
    # CNN Configuration
    CNN_MODEL_PATH: str = "./models/plant_classifier.pth"
    CNN_INPUT_SIZE: int = 224
    CNN_NUM_CLASSES: int = 2
    
    # Training Configuration
    TOTAL_TIMESTEPS: int = 1000000
    SAVE_FREQ: int = 10000
    LOG_INTERVAL: int = 100
    EVAL_FREQ: int = 5000
    EVAL_EPISODES: int = 10
    
    # Paths
    CHECKPOINTS_DIR: str = "./checkpoints"
    LOGS_DIR: str = "./logs"
    MODELS_DIR: str = "./models"
    DATA_DIR: str = "./data"
    
    # File upload settings
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    UPLOAD_DIR: str = "uploads"
    
    # Email settings (for notifications)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    
    # Weather API settings
    WEATHER_API_KEY: str = ""
    
    class Config:
        env_file = ".env"
        case_sensitive = True

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        
        # Create directories if they don't exist
        for dir_path in [
            self.CHECKPOINTS_DIR,
            self.LOGS_DIR,
            self.MODELS_DIR,
            self.DATA_DIR
        ]:
            Path(dir_path).mkdir(parents=True, exist_ok=True)
    
    @property
    def allowed_origins_list(self) -> List[str]:
        """Convert comma-separated ALLOWED_ORIGINS string to list."""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]


settings = Settings()