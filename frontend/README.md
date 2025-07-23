# Frontend - Drone RL Simulation

React-based 3D visualization and control interface for the drone reinforcement learning simulation.

## Features

- **3D Visualization**: Real-time 3D rendering using Three.js and React Three Fiber (Currently Unavailable)
- **Debug Panel**: Live telemetry display (position, velocity, battery, etc.)
- **Control Panel**: Simulation controls (start/pause/reset, CNN overlay toggle)
- **Real-time Communication**: WebSocket connection to simulation backend (Currently Unavailable)
- **Responsive Design**: Tailwind CSS with modern UI components

## Tech Stack

- React 18 + TypeScript
- Three.js + React Three Fiber + Drei
- Zustand for state management
- Socket.IO client for real-time communication (Currently Unavailable)
- Tailwind CSS for styling
- Vite for development and building
- Vitest for unit testing
- Playwright for E2E testing

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Run E2E tests
npm run test:e2e

# Build for production
npm run build

# Type checking
npm run type-check

# Linting
npm run lint
```

## Project Structure

```
src/
├── components/          # React components
│   ├── Scene.tsx       # Main 3D scene
│   ├── Drone.tsx       # Drone 3D model
│   ├── Environment.tsx # Environment (plants, terrain)
│   ├── DebugPanel.tsx  # Telemetry display
│   └── ControlPanel.tsx # Simulation controls
├── store/              # Zustand stores
│   └── simulationStore.ts # Main simulation state
├── test/               # Test utilities and setup
└── App.tsx            # Main application component
```

## WebSocket Events (Currently Unavailable)

The frontend was designed to listen for these events from the simulation:

- `drone_update`: Drone position, rotation, velocity updates
- `plants_update`: Plant health status updates
- `camera_feed`: Base64 encoded camera images
- `simulation_state`: Running/paused state and step count

The frontend was designed to emit these events:

- `start_simulation`: Start the simulation
- `pause_simulation`: Pause the simulation
- `reset_simulation`: Reset the simulation to initial state

**Note**: Simulation functionality is currently unavailable and will be restored in a future update.
