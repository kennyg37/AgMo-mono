"""Configuration settings."""

import os
from pathlib import Path
from typing import Optional

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""
    
    # Server Configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True
    
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


settings = Settings()