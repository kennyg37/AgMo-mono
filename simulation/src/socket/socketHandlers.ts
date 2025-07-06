import { Server, Socket } from 'socket.io';
import { SimulationEngine } from '../simulation/SimulationEngine.js';

export function setupSocketHandlers(io: Server, simulationEngine: SimulationEngine): void {
  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);
    
    // Send initial state
    socket.emit('simulation_state', {
      isRunning: simulationEngine.isRunning,
      isPaused: simulationEngine.isPaused,
      step: simulationEngine.step,
    });
    
    socket.emit('drone_update', simulationEngine.getState().drone);
    socket.emit('plants_update', simulationEngine.getState().plants);
    
    // Handle simulation control
    socket.on('start_simulation', () => {
      console.log(`▶️ Start simulation requested by ${socket.id}`);
      if (!simulationEngine.isRunning) {
        simulationEngine.start();
      } else if (simulationEngine.isPaused) {
        simulationEngine.resume();
      }
    });
    
    socket.on('pause_simulation', () => {
      console.log(`⏸️ Pause simulation requested by ${socket.id}`);
      simulationEngine.pause();
    });
    
    socket.on('reset_simulation', () => {
      console.log(`🔄 Reset simulation requested by ${socket.id}`);
      simulationEngine.reset();
    });
    
    // Handle drone control
    socket.on('drone_action', (action: [number, number, number, number]) => {
      simulationEngine.setDroneAction(action);
    });

    // Handle manual mode toggle
    socket.on('set_manual_mode', (enabled: boolean) => {
      simulationEngine.setManualControl(enabled);
    });

    // Handle height lock controls
    socket.on('toggle_height_lock', () => {
      simulationEngine.toggleHeightLock();
    });

    socket.on('set_height_lock', (enabled: boolean) => {
      simulationEngine.setHeightLock(enabled);
    });

    socket.on('set_target_altitude', (altitude: number) => {
      simulationEngine.setTargetAltitude(altitude);
    });

    socket.on('emergency_land', () => {
      simulationEngine.emergencyLand();
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });
  
  // Broadcast simulation updates to all connected clients
  simulationEngine.on('update', (state) => {
    io.emit('simulation_state', {
      isRunning: state.isRunning,
      isPaused: state.isPaused,
      step: state.step,
    });
    io.emit('drone_update', state.drone);
    io.emit('plants_update', state.plants);
  });
  
  simulationEngine.on('camera_feed', (data) => {
    io.emit('camera_feed', data);
  });
  
  // Broadcast simulation state changes
  simulationEngine.on('started', () => {
    io.emit('simulation_state', {
      isRunning: true,
      isPaused: false,
      step: simulationEngine.step,
    });
  });
  
  simulationEngine.on('paused', () => {
    io.emit('simulation_state', {
      isRunning: true,
      isPaused: true,
      step: simulationEngine.step,
    });
  });
  
  simulationEngine.on('stopped', () => {
    io.emit('simulation_state', {
      isRunning: false,
      isPaused: false,
      step: simulationEngine.step,
    });
  });
  
  simulationEngine.on('reset', () => {
    const state = simulationEngine.getState();
    io.emit('simulation_state', {
      isRunning: state.isRunning,
      isPaused: state.isPaused,
      step: state.step,
    });
    io.emit('drone_update', state.drone);
    io.emit('plants_update', state.plants);
  });
}