# AgMo Simulation Engine

A robust, high-performance 3D drone simulation environment for reinforcement learning and plant health monitoring. Built with TypeScript, Three.js, and Ammo.js physics.

## 🚀 Features

### Core Simulation

- **Realistic Physics**: Full 3D physics simulation using Ammo.js with collision detection
- **Advanced Drone Controls**: Realistic quadcopter physics with motor dynamics and PID controllers
- **Dynamic Environment**: Weather simulation, plant growth, and disease spread
- **High-Performance Rendering**: 3D camera rendering with shadows and post-processing
- **Error Recovery**: Automatic error detection and recovery mechanisms
- **Performance Monitoring**: Real-time FPS and performance metrics

### Drone System

- **Realistic Aerodynamics**: Proper thrust, drag, and torque calculations
- **Motor Dynamics**: Individual motor control with response time simulation
- **Safety Constraints**: Altitude limits, battery management, and collision prevention
- **Flight Modes**: Manual, stabilized, and autonomous flight modes
- **Battery Simulation**: Realistic battery drain based on thrust and operation

### Environment System

- **Dynamic Weather**: Temperature, humidity, wind, precipitation, and sunlight
- **Plant Growth**: Realistic plant growth stages and health simulation
- **Disease Spread**: Environmental factors affecting plant health
- **Multiple Plant Types**: Corn, wheat, soybean, and tomato with different characteristics
- **Environmental Effects**: Water, fertilizer, and pesticide application

### Camera System

- **3D Rendering**: Full Three.js scene rendering from drone perspective
- **Realistic Effects**: Shadows, noise, and post-processing for realism
- **Configurable Quality**: Adjustable resolution, FOV, and rendering options
- **Plant Detection**: Visual feedback for plant health and classification

## 🛠️ Installation

```bash
# Install dependencies
npm install

# Copy environment configuration
cp env.example .env

# Build the project
npm run build

# Start development server
npm run dev
```

## ⚙️ Configuration

The simulation is highly configurable through environment variables. See `env.example` for all available options:

### Key Configuration Categories

#### Physics Settings

```bash
PHYSICS_TIMESTEP=0.016          # Physics timestep (seconds)
PHYSICS_MAX_SUBSTEPS=10         # Maximum physics substeps
ENABLE_CONTACT_CALLBACKS=true   # Enable collision callbacks
```

#### Performance Settings

```bash
MAX_FPS=60                      # Maximum simulation FPS
ENABLE_PERFORMANCE_MONITORING=true
ENABLE_ERROR_RECOVERY=true
```

#### Camera Settings

```bash
RENDER_WIDTH=224                # Camera render width
RENDER_HEIGHT=224               # Camera render height
ENABLE_SHADOWS=true             # Enable shadow rendering
CAMERA_NOISE_LEVEL=0.02         # Camera noise for realism
```

#### Environment Settings

```bash
WORLD_SIZE=100                  # World size in meters
MAX_PLANTS=100                  # Maximum number of plants
WEATHER_ENABLED=true            # Enable weather simulation
GROWTH_ENABLED=true             # Enable plant growth
```

## 🎮 Usage

### Starting the Simulation

```bash
# Development mode with hot reload
npm run dev

# Production mode
npm run build
npm start
```

### WebSocket API

The simulation exposes a WebSocket API for real-time control:

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');

// Start simulation
socket.emit('start_simulation');

// Pause simulation
socket.emit('pause_simulation');

// Reset simulation
socket.emit('reset_simulation');

// Control drone
socket.emit('drone_action', [thrust, pitch, roll, yaw]);

// Listen for updates
socket.on('simulation_state', (state) => {
  console.log('Simulation state:', state);
});

socket.on('drone_update', (drone) => {
  console.log('Drone position:', drone.position);
});

socket.on('camera_feed', (data) => {
  console.log('Camera image:', data.image);
});
```

### HTTP API

```bash
# Get simulation state
GET /api/simulation/state

# Reset simulation
POST /api/simulation/reset

# Health check
GET /health
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test simulation.test.ts

# Run tests with coverage
npm run test:coverage
```

### Test Categories

- **Unit Tests**: Individual component testing
- **Integration Tests**: Full simulation loop testing
- **Performance Tests**: FPS and timing validation
- **Physics Tests**: Collision and movement validation

## 📊 Performance

The simulation is optimized for real-time performance:

- **Target FPS**: 60 FPS
- **Physics Timestep**: 16ms (60Hz)
- **Render Resolution**: 224x224 (configurable)
- **Memory Usage**: <100MB typical
- **CPU Usage**: <20% on modern hardware

### Performance Monitoring

Enable performance monitoring to track:

- Physics simulation time
- Rendering time
- Total frame time
- FPS
- Memory usage

## 🔧 Development

### Project Structure

```
src/
├── simulation/
│   ├── SimulationEngine.ts    # Main simulation controller
│   ├── PhysicsWorld.ts        # Physics simulation
│   ├── DroneController.ts     # Drone physics and controls
│   ├── Environment.ts         # World and plant simulation
│   └── CameraRenderer.ts      # 3D rendering system
├── socket/
│   └── socketHandlers.ts      # WebSocket event handlers
├── python/
│   └── PythonBackendClient.ts # Python backend communication
└── server.ts                  # Express server setup
```

### Adding New Features

1. **New Physics Objects**: Extend `PhysicsWorld.ts`
2. **New Drone Behaviors**: Extend `DroneController.ts`
3. **New Environment Features**: Extend `Environment.ts`
4. **New Rendering Effects**: Extend `CameraRenderer.ts`

### Debugging

Enable debug logging:

```bash
ENABLE_DEBUG_LOGGING=true
LOG_LEVEL=debug
```

## 🚁 Drone Controls

### Control Input Format

```typescript
type DroneAction = [thrust, pitch, roll, yaw];
// thrust: 0-1 (vertical thrust)
// pitch: -1 to 1 (forward/backward tilt)
// roll: -1 to 1 (left/right tilt)
// yaw: -1 to 1 (rotation)
```

### Safety Features

- **Altitude Limits**: Maximum 50m altitude
- **Ground Protection**: Minimum 0.5m above ground
- **Battery Management**: Automatic power reduction at low battery
- **Collision Prevention**: Automatic obstacle avoidance

## 🌱 Plant System

### Plant Types

- **Corn**: Tall, disease-resistant
- **Wheat**: Medium height, average resistance
- **Soybean**: Short, slightly resistant
- **Tomato**: Medium height, disease-susceptible

### Health Factors

- **Water Level**: 0-100%
- **Nutrient Level**: 0-100%
- **Disease Level**: 0-100%
- **Age**: Affects vulnerability
- **Weather**: Temperature, humidity, sunlight

### Environmental Effects

```javascript
// Apply water to plants
environment.applyEnvironmentalEffect(position, 'water', intensity);

// Apply fertilizer
environment.applyEnvironmentalEffect(position, 'fertilizer', intensity);

// Apply pesticide
environment.applyEnvironmentalEffect(position, 'pesticide', intensity);
```

## 📈 Monitoring

### Real-time Metrics

- **FPS**: Current simulation frame rate
- **Step Count**: Total simulation steps
- **Drone Position**: 3D coordinates and orientation
- **Battery Level**: Remaining battery percentage
- **Plant Health**: Overall plant health statistics

### Performance Metrics

- **Physics Time**: Time spent on physics simulation
- **Render Time**: Time spent on camera rendering
- **Total Time**: Total frame processing time
- **Memory Usage**: Current memory consumption

## 🔌 Integration

### Python Backend

The simulation connects to a Python backend for RL training:

```python
# Example Python client
import websockets
import json

async def connect_to_simulation():
    uri = "ws://localhost:3001"
    async with websockets.connect(uri) as websocket:
        # Send drone action
        action = [0.5, 0.1, -0.1, 0.2]
        await websocket.send(json.dumps({
            "type": "drone_action",
            "action": action
        }))

        # Receive observation
        response = await websocket.recv()
        observation = json.loads(response)
```

### Frontend Integration

The simulation provides real-time data to the React frontend:

```typescript
// Example frontend integration
const socket = io('http://localhost:3001');

socket.on('simulation_state', (state) => {
  // Update 3D scene
  updateDronePosition(state.drone.position);
  updatePlants(state.plants);
});

socket.on('camera_feed', (data) => {
  // Display camera feed
  displayCameraImage(data.image);
});
```

## 🐛 Troubleshooting

### Common Issues

1. **Low FPS**: Reduce `MAX_PLANTS` or disable shadows
2. **Physics Instability**: Increase `PHYSICS_MAX_SUBSTEPS`
3. **Memory Leaks**: Check for proper cleanup in custom components
4. **Connection Issues**: Verify Python backend is running

### Debug Commands

```bash
# Enable verbose logging
DEBUG=* npm run dev

# Run with performance profiling
npm run dev -- --prof

# Test specific components
npm test -- --grep "Physics"
```

## 📝 License

This project is part of the AgMo monorepo. See the main README for license information.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📚 References

- [Ammo.js Documentation](https://github.com/kripken/ammo.js/)
- [Three.js Documentation](https://threejs.org/docs/)
- [Socket.IO Documentation](https://socket.io/docs/)
- [Express.js Documentation](https://expressjs.com/)
