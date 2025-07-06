# AGMO - Autonomous Ground Monitoring Operations

A full-stack, simulation-driven reinforcement learning environment for training a drone to navigate and identify plant health conditions. The system features realistic 3D physics simulation, computer vision-based plant classification, and state-of-the-art reinforcement learning algorithms.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    Frontend     │    │   Simulation    │    │    Backend      │
│                 │    │                 │    │                 │
│ • React + TS    │◄──►│ • Node.js + TS  │◄──►│ • Python 3.11+  │
│ • Three.js      │    │ • Ammo.js       │    │ • FastAPI       │
│ • Zustand       │    │ • Express       │    │ • Stable-B3     │
│ • TailwindCSS   │    │ • Socket.IO     │    │ • PyTorch       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │                        │
        └────────────────────────┼────────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   WebSocket     │
                    │ Communication   │
                    └─────────────────┘
```

## 🚀 Features

### Frontend (React + Three.js)
- **3D Visualization**: Real-time 3D rendering of drone, environment, and plants
- **Debug Panel**: Live telemetry display (position, velocity, battery, camera feed)
- **Control Interface**: Start/pause simulation, toggle CNN overlay, reset environment
- **Responsive Design**: Modern UI with Tailwind CSS and smooth animations

### Simulation (Node.js + Physics)
- **Realistic Physics**: Ammo.js-powered drone dynamics and collision detection
- **3D Environment**: Procedurally generated plants and terrain
- **Camera Rendering**: Offscreen rendering for drone's POV using Canvas
- **WebSocket API**: Real-time communication with frontend and backend

### Backend (Python + AI/ML)
- **Reinforcement Learning**: PPO/SAC training using Stable-Baselines3
- **Computer Vision**: CNN-based plant health classification with PyTorch
- **Custom Gym Environment**: Drone control environment with image observations
- **Model Management**: Save/load trained models and checkpoints

## 🛠️ Tech Stack

| Component | Technologies |
|-----------|-------------|
| **Frontend** | React 18, TypeScript, Three.js, React Three Fiber, Zustand, Tailwind CSS, Vite |
| **Simulation** | Node.js, TypeScript, Express, Socket.IO, Ammo.js, Canvas |
| **Backend** | Python 3.11+, FastAPI, Stable-Baselines3, PyTorch, OpenCV, Gymnasium |
| **Testing** | Vitest, Playwright, Pytest, Puppeteer |
| **DevOps** | Docker, GitHub Actions, ESLint, Prettier, Black, MyPy |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- npm (or yarn)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd agmo-mono
   ```

2. **Install dependencies for each component**
   ```bash
   # Install Frontend dependencies
   cd frontend
   npm install
   cd ..
   
   # Install Simulation dependencies
   cd simulation
   npm install
   cd ..
   
   # Install Backend dependencies
   cd backend
   pip install -r requirements.txt
   cd ..
   ```

3. **Start each service individually**
   ```bash
   # Terminal 1: Start Frontend
   cd frontend
   npm run dev
   
   # Terminal 2: Start Simulation
   cd simulation
   npm run dev
   
   # Terminal 3: Start Backend
   cd backend
   python -m agmo.main
   ```

4. **Open the application**
   - Frontend: http://localhost:3000
   - Simulation API: http://localhost:3001
   - Backend API: http://localhost:8000

## 📁 Project Structure

```
agmo-mono/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── store/          # Zustand state management
│   │   └── test/           # Unit and E2E tests
│   └── package.json
├── simulation/              # Node.js simulation engine
│   ├── src/
│   │   ├── simulation/     # Physics and rendering
│   │   ├── socket/         # WebSocket handlers
│   │   └── python/         # Backend communication
│   └── package.json
├── backend/                 # Python RL and ML backend
│   ├── agmo/
│   │   ├── rl/            # Reinforcement learning
│   │   ├── vision/        # Computer vision
│   │   ├── api/           # FastAPI routes
│   │   └── websocket/     # WebSocket client
│   └── requirements.txt
├── .vscode/                # VS Code configuration
├── .github/                # GitHub Actions workflows
└── README.md
```

## 🧪 Testing

```bash
# Frontend tests
cd frontend
npm test
npm run test:e2e

# Simulation tests
cd simulation
npm test
npm run test:headless

# Backend tests
cd backend
pytest
pytest --cov=agmo
```

## 🐳 Docker Deployment

```bash
# Build simulation container
cd simulation
docker build -t agmo-simulation .

# Build backend container
cd backend
docker build -t agmo-backend .

# Run with docker-compose (coming soon)
docker-compose up
```

## 🎯 Training Process

1. **Environment Setup**: The simulation creates a 3D world with plants and terrain
2. **Observation Collection**: Drone camera captures images, processed by CNN
3. **RL Training**: PPO/SAC agent learns optimal flight patterns for plant monitoring
4. **Reward Function**: Combines exploration, plant identification accuracy, and flight efficiency
5. **Model Persistence**: Regular checkpoints and final model saving

## 📊 Monitoring & Metrics

- **TensorBoard**: Training progress visualization
- **Debug Panel**: Real-time telemetry and system status
- **API Metrics**: Training statistics and model performance
- **Health Checks**: System status monitoring

## 🔧 Development

### Code Quality
```bash
# Format code (from root directory)
npm run format

# Lint code (run in each directory)
cd frontend && npm run lint
cd simulation && npm run lint

# Type checking (run in each directory)
cd frontend && npm run type-check
cd simulation && npm run type-check
```

### VS Code Setup
The project includes pre-configured VS Code settings for:
- Python and TypeScript development
- Debugging configurations
- Task automation
- Extension recommendations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Stable-Baselines3](https://github.com/DLR-RM/stable-baselines3) for RL algorithms
- [Three.js](https://threejs.org/) for 3D graphics
- [Ammo.js](https://github.com/kripken/ammo.js/) for physics simulation
- [FastAPI](https://fastapi.tiangolo.com/) for the Python backend framework

## 📞 Support

For questions and support, please open an issue on GitHub or contact the development team.

---

**AGMO** - Advancing autonomous systems through simulation-driven machine learning 🚁🌱🤖