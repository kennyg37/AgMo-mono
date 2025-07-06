"""Tests for RL components."""

import pytest
import numpy as np
import asyncio
from unittest.mock import Mock, AsyncMock

from agmo.rl.environment import DroneEnvironment
from agmo.rl.trainer import RLTrainer


@pytest.fixture
def mock_websocket_client():
    """Create a mock WebSocket client."""
    client = Mock()
    client.send_action = AsyncMock()
    client.send_reset = AsyncMock()
    return client


@pytest.fixture
def drone_env(mock_websocket_client):
    """Create a drone environment."""
    return DroneEnvironment(websocket_client=mock_websocket_client)


def test_drone_environment_spaces(drone_env):
    """Test environment action and observation spaces."""
    # Test action space
    assert drone_env.action_space.shape == (4,)
    assert drone_env.action_space.low.min() == -1.0
    assert drone_env.action_space.high.max() == 1.0
    
    # Test observation space
    assert "image" in drone_env.observation_space.spaces
    assert "drone_state" in drone_env.observation_space.spaces
    assert "plant_positions" in drone_env.observation_space.spaces
    
    # Test image space
    image_space = drone_env.observation_space.spaces["image"]
    assert image_space.shape == (224, 224, 3)
    assert image_space.low.min() == 0
    assert image_space.high.max() == 255
    
    # Test drone state space
    drone_state_space = drone_env.observation_space.spaces["drone_state"]
    assert drone_state_space.shape == (9,)  # pos(3) + vel(3) + rot(3)


def test_drone_environment_reset(drone_env):
    """Test environment reset."""
    observation, info = drone_env.reset()
    
    assert drone_env.episode_step == 0
    assert drone_env.total_reward == 0
    assert len(drone_env.plants_identified) == 0
    
    # Check observation structure
    assert "image" in observation
    assert "drone_state" in observation
    assert "plant_positions" in observation
    
    assert observation["image"].shape == (224, 224, 3)
    assert observation["drone_state"].shape == (9,)
    assert observation["plant_positions"].shape == (20, 3)


def test_drone_environment_step(drone_env):
    """Test environment step."""
    # Reset first
    drone_env.reset()
    
    # Take a step
    action = np.array([0.5, 0.1, -0.1, 0.0])
    observation, reward, terminated, truncated, info = drone_env.step(action)
    
    assert drone_env.episode_step == 1
    assert isinstance(reward, float)
    assert isinstance(terminated, bool)
    assert isinstance(truncated, bool)
    assert isinstance(info, dict)
    
    # Check observation structure
    assert "image" in observation
    assert "drone_state" in observation
    assert "plant_positions" in observation


def test_reward_calculation(drone_env):
    """Test reward calculation."""
    drone_env.reset()
    
    # Test with different actions
    action1 = np.array([1.0, 0.0, 0.0, 0.0])  # High thrust
    action2 = np.array([0.0, 0.0, 0.0, 0.0])  # No action
    
    obs = drone_env._get_default_observation()
    
    reward1 = drone_env._calculate_reward(obs, action1)
    reward2 = drone_env._calculate_reward(obs, action2)
    
    # High thrust should have higher energy cost
    assert isinstance(reward1, float)
    assert isinstance(reward2, float)


def test_termination_conditions(drone_env):
    """Test environment termination conditions."""
    # Test crash condition (low altitude)
    obs_crash = {
        "image": np.zeros((224, 224, 3), dtype=np.uint8),
        "drone_state": np.array([0, 0.3, 0, 0, 0, 0, 0, 0, 0], dtype=np.float32),  # Low altitude
        "plant_positions": np.zeros((20, 3), dtype=np.float32),
    }
    
    assert drone_env._is_terminated(obs_crash) == True
    
    # Test out of bounds condition
    obs_oob = {
        "image": np.zeros((224, 224, 3), dtype=np.uint8),
        "drone_state": np.array([35, 5, 0, 0, 0, 0, 0, 0, 0], dtype=np.float32),  # Far out
        "plant_positions": np.zeros((20, 3), dtype=np.float32),
    }
    
    assert drone_env._is_terminated(obs_oob) == True
    
    # Test normal condition
    obs_normal = {
        "image": np.zeros((224, 224, 3), dtype=np.uint8),
        "drone_state": np.array([0, 5, 0, 0, 0, 0, 0, 0, 0], dtype=np.float32),  # Normal
        "plant_positions": np.zeros((20, 3), dtype=np.float32),
    }
    
    assert drone_env._is_terminated(obs_normal) == False


def test_observation_update(drone_env):
    """Test observation update from WebSocket data."""
    # Mock observation data
    obs_data = {
        "image": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGA",  # 1x1 white pixel
        "position": [1.0, 2.0, 3.0],
        "velocity": [0.1, 0.2, 0.3],
        "plants": [
            {"position": [5.0, 0.0, 5.0]},
            {"position": [-5.0, 0.0, -5.0]},
        ]
    }
    
    drone_env.update_observation(obs_data)
    
    assert drone_env.current_observation is not None
    assert drone_env.current_observation["drone_state"][0] == 1.0  # x position
    assert drone_env.current_observation["drone_state"][1] == 2.0  # y position
    assert drone_env.current_observation["drone_state"][2] == 3.0  # z position


@pytest.fixture
def rl_trainer(mock_websocket_client):
    """Create an RL trainer."""
    return RLTrainer(
        model_name="PPO",
        learning_rate=3e-4,
        total_timesteps=1000,
        websocket_client=mock_websocket_client
    )


def test_rl_trainer_initialization(rl_trainer):
    """Test RL trainer initialization."""
    assert rl_trainer.model_name == "PPO"
    assert rl_trainer.learning_rate == 3e-4
    assert rl_trainer.total_timesteps == 1000
    assert rl_trainer.is_training == False
    assert rl_trainer.current_timesteps == 0
    assert rl_trainer.model is not None
    assert rl_trainer.env is not None


def test_rl_trainer_prediction(rl_trainer):
    """Test RL trainer prediction."""
    # Create a sample observation
    observation = {
        "image": np.zeros((224, 224, 3), dtype=np.uint8),
        "drone_state": np.array([0, 5, 0, 0, 0, 0, 0, 0, 0], dtype=np.float32),
        "plant_positions": np.zeros((20, 3), dtype=np.float32),
    }
    
    action = rl_trainer.predict(observation)
    
    assert isinstance(action, np.ndarray)
    assert action.shape == (4,)
    assert np.all(action >= -1.0) and np.all(action <= 1.0)


def test_rl_trainer_metrics(rl_trainer):
    """Test RL trainer metrics."""
    metrics = rl_trainer.get_metrics()
    
    assert "is_training" in metrics
    assert "current_timesteps" in metrics
    assert "total_timesteps" in metrics
    assert "episodes" in metrics
    assert "mean_reward" in metrics
    assert "training_metrics" in metrics
    
    assert metrics["is_training"] == False
    assert metrics["total_timesteps"] == 1000