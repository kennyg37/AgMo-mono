"""Gym environment for drone RL training."""

import numpy as np
import gymnasium as gym
from gymnasium import spaces
from typing import Dict, Any, Tuple, Optional
import asyncio
import logging

logger = logging.getLogger(__name__)


class DroneEnvironment(gym.Env):
    """Custom Gym environment for drone plant monitoring."""
    
    metadata = {"render_modes": ["rgb_array"], "render_fps": 60}
    
    def __init__(self, websocket_client=None):
        super().__init__()
        
        self.websocket_client = websocket_client
        
        # Action space: [thrust, pitch, roll, yaw] normalized to [-1, 1]
        self.action_space = spaces.Box(
            low=-1.0, high=1.0, shape=(4,), dtype=np.float32
        )
        
        # Observation space: camera image + drone state + plant positions
        self.observation_space = spaces.Dict({
            "image": spaces.Box(
                low=0, high=255, shape=(224, 224, 3), dtype=np.uint8
            ),
            "drone_state": spaces.Box(
                low=-np.inf, high=np.inf, shape=(9,), dtype=np.float32
            ),  # position(3) + velocity(3) + rotation(3)
            "plant_positions": spaces.Box(
                low=-25, high=25, shape=(20, 3), dtype=np.float32
            ),  # max 20 plants with x,y,z positions
        })
        
        # Environment state
        self.current_observation = None
        self.episode_step = 0
        self.max_episode_steps = 1000
        self.total_reward = 0
        
        # Reward components
        self.plants_identified = set()
        self.last_position = np.array([0, 5, 0])
        
    def reset(self, seed: Optional[int] = None, options: Optional[Dict] = None) -> Tuple[Dict, Dict]:
        """Reset the environment."""
        super().reset(seed=seed)
        
        logger.info("🔄 Resetting drone environment")
        
        # Reset environment state
        self.episode_step = 0
        self.total_reward = 0
        self.plants_identified.clear()
        self.last_position = np.array([0, 5, 0])
        
        # Send reset command to simulation
        if self.websocket_client:
            asyncio.create_task(self.websocket_client.send_reset())
        
        # Wait for initial observation
        self.current_observation = self._get_default_observation()
        
        return self.current_observation, {}
    
    def step(self, action: np.ndarray) -> Tuple[Dict, float, bool, bool, Dict]:
        """Execute one step in the environment."""
        self.episode_step += 1
        
        # Send action to simulation
        if self.websocket_client:
            asyncio.create_task(self.websocket_client.send_action(action.tolist()))
        
        # Get new observation (this would be updated by websocket callbacks)
        observation = self.current_observation or self._get_default_observation()
        
        # Calculate reward
        reward = self._calculate_reward(observation, action)
        self.total_reward += reward
        
        # Check if episode is done
        terminated = self._is_terminated(observation)
        truncated = self.episode_step >= self.max_episode_steps
        
        info = {
            "episode_step": self.episode_step,
            "total_reward": self.total_reward,
            "plants_identified": len(self.plants_identified),
        }
        
        return observation, reward, terminated, truncated, info
    
    def _calculate_reward(self, observation: Dict, action: np.ndarray) -> float:
        """Calculate reward based on current state and action."""
        reward = 0.0
        
        # Extract drone state
        drone_state = observation["drone_state"]
        position = drone_state[:3]
        velocity = drone_state[3:6]
        
        # Reward for staying airborne
        altitude = position[1]
        if altitude > 1.0:
            reward += 0.1
        else:
            reward -= 1.0  # Penalty for crashing
        
        # Reward for exploring (moving to new areas)
        distance_moved = np.linalg.norm(position - self.last_position)
        reward += min(distance_moved * 0.1, 0.5)  # Cap exploration reward
        self.last_position = position.copy()
        
        # Penalty for excessive speed (encourage smooth flight)
        speed = np.linalg.norm(velocity)
        if speed > 5.0:
            reward -= 0.1
        
        # Reward for identifying plants (this would be updated by CNN results)
        # This is a placeholder - actual plant identification rewards would be
        # added when CNN classification results are received
        
        # Small penalty for energy consumption
        energy_cost = np.sum(np.abs(action)) * 0.01
        reward -= energy_cost
        
        return reward
    
    def _is_terminated(self, observation: Dict) -> bool:
        """Check if episode should terminate."""
        drone_state = observation["drone_state"]
        position = drone_state[:3]
        
        # Terminate if drone crashes (too low altitude)
        if position[1] < 0.5:
            return True
        
        # Terminate if drone goes too far out of bounds
        if abs(position[0]) > 30 or abs(position[2]) > 30:
            return True
        
        return False
    
    def _get_default_observation(self) -> Dict:
        """Get default observation when no real data is available."""
        return {
            "image": np.zeros((224, 224, 3), dtype=np.uint8),
            "drone_state": np.array([0, 5, 0, 0, 0, 0, 0, 0, 0], dtype=np.float32),
            "plant_positions": np.zeros((20, 3), dtype=np.float32),
        }
    
    def update_observation(self, observation_data: Dict):
        """Update observation from websocket data."""
        try:
            # Convert image from base64 to numpy array
            import base64
            from PIL import Image
            import io
            
            if "image" in observation_data:
                image_data = base64.b64decode(observation_data["image"])
                image = Image.open(io.BytesIO(image_data))
                image = image.resize((224, 224))
                image_array = np.array(image)
            else:
                image_array = np.zeros((224, 224, 3), dtype=np.uint8)
            
            # Extract drone state
            position = observation_data.get("position", [0, 5, 0])
            velocity = observation_data.get("velocity", [0, 0, 0])
            rotation = [0, 0, 0]  # Placeholder
            
            drone_state = np.array(position + velocity + rotation, dtype=np.float32)
            
            # Extract plant positions
            plants = observation_data.get("plants", [])
            plant_positions = np.zeros((20, 3), dtype=np.float32)
            
            for i, plant in enumerate(plants[:20]):  # Limit to 20 plants
                plant_positions[i] = plant.get("position", [0, 0, 0])
            
            self.current_observation = {
                "image": image_array,
                "drone_state": drone_state,
                "plant_positions": plant_positions,
            }
            
        except Exception as e:
            logger.error(f"Failed to update observation: {e}")
            self.current_observation = self._get_default_observation()
    
    def render(self, mode="rgb_array"):
        """Render the environment."""
        if mode == "rgb_array":
            if self.current_observation:
                return self.current_observation["image"]
            else:
                return np.zeros((224, 224, 3), dtype=np.uint8)
        else:
            raise NotImplementedError(f"Render mode {mode} not supported")
    
    def close(self):
        """Clean up environment."""
        pass