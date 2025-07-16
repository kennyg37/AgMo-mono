# Backend - Drone RL Training System

Python backend for reinforcement learning training and CNN-based plant health classification.

## Features

- **Reinforcement Learning**: PPO/SAC training using Stable-Baselines3
- **Computer Vision**: CNN-based plant health classification
- **WebSocket Communication**: Real-time communication with simulation (Currently Unavailable)
- **RESTful API**: HTTP endpoints for model management and training control
- **Model Persistence**: Save/load trained models and checkpoints
- **Metrics & Logging**: Comprehensive training metrics and TensorBoard integration

## Tech Stack

- Python 3.11+
- FastAPI for web framework
- Stable-Baselines3 for RL algorithms
- PyTorch for CNN models
- OpenCV & Pillow for image processing
- Gymnasium for RL environments
- WebSockets for real-time communication (Currently Unavailable)
- TensorBoard for training visualization

## Installation

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Or install in development mode
pip install -e .
```

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
# Server Configuration
HOST=0.0.0.0
PORT=8000
DEBUG=True

# Simulation Connection (Currently Unavailable)
# SIMULATION_WS_URL=ws://localhost:3001

# Model Configuration
MODEL_NAME=PPO
LEARNING_RATE=3e-4
TOTAL_TIMESTEPS=1000000

# Paths
CHECKPOINTS_DIR=./checkpoints
LOGS_DIR=./logs
MODELS_DIR=./models
```

## Development

```bash
# Start development server
python -m agmo.main

# Run tests
pytest

# Run tests with coverage
pytest --cov=agmo

# Format code
black agmo/
isort agmo/

# Type checking
mypy agmo/

# Linting
flake8 agmo/
```

## API Endpoints

### Plant Classification

- `POST /api/classify` - Classify plant from uploaded image
- `POST /api/classify/base64` - Classify plant from base64 image

### Training Control

- `GET /api/training/status` - Get training status
- `POST /api/training/start` - Start RL training
- `POST /api/training/stop` - Stop RL training

### Model Management

- `GET /api/models` - List available models
- `POST /api/models/{name}/load` - Load specific model

### Metrics

- `GET /api/metrics` - Get training metrics and model info

## Project Structure

```
agmo/
├── core/                # Core configuration and utilities
│   └── config.py       # Settings and configuration
├── api/                # FastAPI routes and endpoints
│   └── routes.py       # API route definitions
├── rl/                 # Reinforcement learning components
│   ├── environment.py  # Gym environment for drone
│   └── trainer.py      # RL training orchestrator
├── vision/             # Computer vision components
│   └── cnn_model.py    # CNN for plant classification
├── websocket/          # WebSocket communication (Currently Unavailable)
│   └── client.py       # WebSocket client for simulation
└── main.py            # FastAPI application entry point
```

## Training Process

1. **Environment Setup**: Custom Gym environment receives observations from simulation
2. **RL Training**: PPO/SAC agent learns to control drone for plant monitoring
3. **CNN Classification**: Parallel CNN processes camera feed for plant health
4. **Reward Calculation**: Combines exploration, plant identification, and flight efficiency
5. **Model Persistence**: Regular checkpoints and final model saving

## WebSocket Protocol (Currently Unavailable)

### Incoming Messages (from Simulation):

```json
{
  "type": "observation",
  "data": {
    "image": "base64_encoded_image",
    "position": [x, y, z],
    "velocity": [vx, vy, vz],
    "plants": [{"id": "plant_1", "position": [x, y, z]}]
  }
}
```

### Outgoing Messages (to Simulation):

```json
{
  "type": "action",
  "data": {
    "action": [thrust, pitch, roll, yaw]
  }
}
```

**Note**: WebSocket functionality is currently unavailable and will be restored in a future update.

## Docker

```bash
# Build image
docker build -t agmo-backend .

# Run container
docker run -p 8000:8000 --env-file .env agmo-backend

# With GPU support (if available)
docker run --gpus all -p 8000:8000 --env-file .env agmo-backend
```

## Testing

```bash
# Run all tests
pytest

# Run specific test categories
pytest tests/test_cnn.py      # CNN model tests
pytest tests/test_rl.py       # RL component tests
pytest tests/test_api.py      # API endpoint tests

# Run with coverage
pytest --cov=agmo --cov-report=html

# Integration tests
pytest tests/test_integration.py
```

## Performance Optimization

- **GPU Acceleration**: Automatic CUDA detection for PyTorch models
- **Async Processing**: Non-blocking WebSocket and API operations
- **Batch Processing**: Efficient CNN inference for multiple images
- **Memory Management**: Proper cleanup and garbage collection
- **Model Optimization**: TorchScript compilation for production deployment

## Monitoring

- **TensorBoard**: Training metrics visualization
- **Logging**: Structured logging with different levels
- **Health Checks**: API endpoints for system status
- **Metrics Collection**: Training progress and model performance tracking

## Troubleshooting

Common issues and solutions:

1. **CUDA Out of Memory**: Reduce batch size or use CPU-only mode
2. **WebSocket Connection Failed**: Check simulation server is running
3. **Model Loading Error**: Verify model file exists and is compatible
4. **Training Slow**: Enable GPU acceleration or reduce environment complexity
