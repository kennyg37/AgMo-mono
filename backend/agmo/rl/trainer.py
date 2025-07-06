"""Reinforcement learning trainer."""

import asyncio
import logging
import os
from typing import Dict, Any, Optional
import numpy as np

from stable_baselines3 import PPO, SAC
from stable_baselines3.common.callbacks import BaseCallback
from stable_baselines3.common.vec_env import DummyVecEnv
from stable_baselines3.common.monitor import Monitor

from agmo.core.config import settings
from agmo.rl.environment import DroneEnvironment

logger = logging.getLogger(__name__)


class TrainingCallback(BaseCallback):
    """Custom callback for training monitoring."""
    
    def __init__(self, trainer, verbose=0):
        super().__init__(verbose)
        self.trainer = trainer
        
    def _on_step(self) -> bool:
        """Called at each step."""
        self.trainer.current_timesteps = self.num_timesteps
        
        # Log progress
        if self.num_timesteps % settings.LOG_INTERVAL == 0:
            logger.info(f"Training step: {self.num_timesteps}/{self.trainer.total_timesteps}")
        
        # Save model periodically
        if self.num_timesteps % settings.SAVE_FREQ == 0:
            self.trainer.save_model(f"checkpoint_{self.num_timesteps}")
        
        return True


class RLTrainer:
    """Reinforcement learning trainer for drone control."""
    
    def __init__(
        self,
        model_name: str = "PPO",
        learning_rate: float = 3e-4,
        total_timesteps: int = 1000000,
        websocket_client=None
    ):
        self.model_name = model_name
        self.learning_rate = learning_rate
        self.total_timesteps = total_timesteps
        self.websocket_client = websocket_client
        
        # Training state
        self.is_training = False
        self.current_timesteps = 0
        self.episodes = 0
        self.mean_reward = 0.0
        
        # Environment and model
        self.env = None
        self.model = None
        self.training_task = None
        
        # Metrics
        self.training_metrics = {
            "episode_rewards": [],
            "episode_lengths": [],
            "timesteps": [],
        }
        
        self._initialize_environment()
    
    def _initialize_environment(self):
        """Initialize the training environment."""
        logger.info("🏗️ Initializing RL environment")
        
        # Create environment
        env = DroneEnvironment(websocket_client=self.websocket_client)
        
        # Wrap with Monitor for logging
        env = Monitor(env, filename=f"{settings.LOGS_DIR}/training_log")
        
        # Vectorize environment
        self.env = DummyVecEnv([lambda: env])
        
        # Initialize model
        self._initialize_model()
    
    def _initialize_model(self):
        """Initialize the RL model."""
        logger.info(f"🤖 Initializing {self.model_name} model")
        
        if self.model_name.upper() == "PPO":
            self.model = PPO(
                "MultiInputPolicy",
                self.env,
                learning_rate=self.learning_rate,
                n_steps=settings.N_STEPS,
                batch_size=settings.BATCH_SIZE,
                n_epochs=settings.N_EPOCHS,
                gamma=settings.GAMMA,
                gae_lambda=settings.GAE_LAMBDA,
                verbose=1,
                tensorboard_log=settings.LOGS_DIR,
            )
        elif self.model_name.upper() == "SAC":
            self.model = SAC(
                "MultiInputPolicy",
                self.env,
                learning_rate=self.learning_rate,
                batch_size=settings.BATCH_SIZE,
                gamma=settings.GAMMA,
                verbose=1,
                tensorboard_log=settings.LOGS_DIR,
            )
        else:
            raise ValueError(f"Unsupported model: {self.model_name}")
    
    async def start_training(self):
        """Start training the RL model."""
        if self.is_training:
            logger.warning("Training already in progress")
            return
        
        logger.info("🚀 Starting RL training")
        self.is_training = True
        
        # Create training callback
        callback = TrainingCallback(self)
        
        # Start training in background task
        self.training_task = asyncio.create_task(
            self._train_async(callback)
        )
    
    async def _train_async(self, callback):
        """Async wrapper for training."""
        try:
            # Run training in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(
                None,
                lambda: self.model.learn(
                    total_timesteps=self.total_timesteps,
                    callback=callback,
                    progress_bar=True
                )
            )
            
            logger.info("✅ Training completed successfully")
            
        except Exception as e:
            logger.error(f"❌ Training failed: {e}")
        finally:
            self.is_training = False
    
    async def stop_training(self):
        """Stop training."""
        if not self.is_training:
            logger.warning("No training in progress")
            return
        
        logger.info("⏹️ Stopping training")
        
        if self.training_task:
            self.training_task.cancel()
            try:
                await self.training_task
            except asyncio.CancelledError:
                pass
        
        self.is_training = False
        self.save_model("interrupted")
    
    def predict(self, observation: Dict[str, Any]) -> np.ndarray:
        """Predict action for given observation."""
        if not self.model:
            logger.warning("Model not initialized")
            return np.zeros(4)
        
        try:
            action, _ = self.model.predict(observation, deterministic=True)
            return action
        except Exception as e:
            logger.error(f"Prediction failed: {e}")
            return np.zeros(4)
    
    def save_model(self, name: Optional[str] = None):
        """Save the current model."""
        if not self.model:
            logger.warning("No model to save")
            return
        
        if name is None:
            name = f"{self.model_name.lower()}_final"
        
        model_path = f"{settings.CHECKPOINTS_DIR}/{name}"
        
        try:
            self.model.save(model_path)
            logger.info(f"💾 Model saved: {model_path}")
        except Exception as e:
            logger.error(f"Failed to save model: {e}")
    
    async def load_model(self, model_path: str):
        """Load a saved model."""
        try:
            if self.model_name.upper() == "PPO":
                self.model = PPO.load(model_path, env=self.env)
            elif self.model_name.upper() == "SAC":
                self.model = SAC.load(model_path, env=self.env)
            else:
                raise ValueError(f"Unsupported model: {self.model_name}")
            
            logger.info(f"📂 Model loaded: {model_path}")
            
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            raise
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get training metrics."""
        return {
            "is_training": self.is_training,
            "current_timesteps": self.current_timesteps,
            "total_timesteps": self.total_timesteps,
            "episodes": self.episodes,
            "mean_reward": self.mean_reward,
            "training_metrics": self.training_metrics,
        }
    
    def update_observation(self, observation_data: Dict):
        """Update environment observation."""
        if self.env and hasattr(self.env.envs[0], 'update_observation'):
            self.env.envs[0].update_observation(observation_data)