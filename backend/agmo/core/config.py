"""Configuration settings."""

import os
from pathlib import Path
from typing import Optional, List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings."""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore",
        validate_default=False,
        env_ignore_empty=True
    )
    
    # Server Configuration
    HOST: str = Field(default="0.0.0.0", env="HOST")
    PORT: int = Field(default=8000, env="PORT")
    DEBUG: bool = Field(default=True, env="DEBUG")
    
    # CORS settings - use comma-separated string for easier .env configuration
    ALLOWED_ORIGINS: str = Field(default="http://localhost:3000,http://localhost:5173", env="ALLOWED_ORIGINS")
    
    # Database settings
    DATABASE_URL: str = Field(default="postgresql://agmo_user:agmo_password@localhost:5432/agmo_farm", env="DATABASE_URL")
    
    # Authentication settings
    SECRET_KEY: str = Field(default="your-secret-key-change-in-production", env="SECRET_KEY")
    ALGORITHM: str = Field(default="HS256", env="ALGORITHM")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    
    # OpenAI settings
    OPENAI_API_KEY: str = Field(default="", env="OPENAI_API_KEY")
    OPENAI_MAX_TOKENS: int = Field(default=100, env="OPENAI_MAX_TOKENS")  # Maximum tokens for chat responses (cost optimization)
    OPENAI_TEMPERATURE: float = Field(default=0.3, env="OPENAI_TEMPERATURE")  # Lower temperature for more focused responses
    
    # Simulation Connection (Currently Unavailable)
    SIMULATION_WS_URL: str = "ws://localhost:3001"
    
    # CNN WebSocket Configuration (Currently Unavailable)
    # CNN_WS_HOST: str = "localhost"
    # CNN_WS_PORT: int = 8001
    
    # Model Configuration (Legacy - kept for compatibility)
    MODEL_NAME: str = "PPO"
    LEARNING_RATE: float = 3e-4
    BATCH_SIZE: int = 64
    N_STEPS: int = 2048
    N_EPOCHS: int = 10
    GAMMA: float = 0.99
    GAE_LAMBDA: float = 0.95
    
    # Maize Disease Model Configuration
    MAIZE_MODEL_PATH: str = "./models/maize_leaf_cnn_model.keras"
    
    # Training Configuration (Legacy - kept for compatibility)
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
    SMTP_HOST: str = Field(default="smtp.gmail.com", env="SMTP_HOST")
    SMTP_PORT: int = Field(default=587, env="SMTP_PORT")
    SMTP_USER: str = Field(default="", env="SMTP_USER")
    SMTP_PASSWORD: str = Field(default="", env="SMTP_PASSWORD")
    
    # Weather API settings
    WEATHER_API_KEY: str = Field(default="", env="WEATHER_API_KEY")
    GOOGLE_MAPS_API_KEY: str = Field(default="", env="GOOGLE_MAPS_API_KEY")
    OPENWEATHER_API_KEY: str = Field(default="", env="OPENWEATHER_API_KEY")
    
    # Legacy API key names for compatibility
    GOOGLE_API_KEY: str = Field(default="", env="GOOGLE_API_KEY")
    OPEN_WEATHER_KEY: str = Field(default="", env="OPEN_WEATHER_KEY")

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