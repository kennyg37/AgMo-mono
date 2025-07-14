import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

export interface DroneState {
  position: [number, number, number];
  rotation: [number, number, number];
  velocity: [number, number, number];
  altitude: number;
  battery: number;
}

export interface PlantData {
  id: string;
  position: [number, number, number];
  health: 'healthy' | 'sick' | 'unknown';
  confidence: number;
}

export interface SimulationState {
  // Connection
  socket: Socket | null;
  isConnected: boolean;
  
  // Simulation state
  isRunning: boolean;
  isPaused: boolean;
  step: number;
  
  // Drone data
  drone: DroneState;
  
  // Environment data
  plants: PlantData[];
  
  // CNN/Vision
  showCNNOverlay: boolean;
  cameraFeed: string | null; // base64 image
  maizeDiseaseResult: any | null; // Maize disease detection result

  // Manual control
  manualControlMode: boolean;
  setManualControl: (enabled: boolean) => void;
  setDroneAction: (action: [number, number, number, number]) => void;

  // Actions
  connect: () => void;
  disconnect: () => void;
  startSimulation: () => void;
  pauseSimulation: () => void;
  resetSimulation: () => void;
  toggleCNNOverlay: () => void;
  updateDrone: (drone: Partial<DroneState>) => void;
  updatePlants: (plants: PlantData[]) => void;
  setCameraFeed: (feed: string) => void;
  setMaizeDiseaseResult: (result: any) => void;
}

export const useSimulationStore = create<SimulationState>((set, get) => ({
  // Initial state
  socket: null,
  isConnected: false,
  isRunning: false,
  isPaused: false,
  step: 0,
  drone: {
    position: [0, 5, 0],
    rotation: [0, 0, 0],
    velocity: [0, 0, 0],
    altitude: 5,
    battery: 100,
  },
  plants: [],
  showCNNOverlay: false,
  cameraFeed: null,
  maizeDiseaseResult: null,
  manualControlMode: false,
  setManualControl: (enabled) => {
    set({ manualControlMode: enabled });
    const { socket } = get();
    if (socket) {
      socket.emit('set_manual_mode', enabled);
    }
  },
  setDroneAction: (action) => {
    const { socket, manualControlMode } = get();
    console.log('🎮 setDroneAction called:', { action, socket: !!socket, manualControlMode });
    if (socket && manualControlMode) {
      console.log('📡 Sending drone action to server:', action);
      socket.emit('drone_action', action);
    } else {
      console.log('❌ Cannot send drone action:', { 
        hasSocket: !!socket, 
        manualControlMode 
      });
    }
  },

  // Actions
  connect: () => {
    const socket = io('http://localhost:3001');
    
    socket.on('connect', () => {
      set({ isConnected: true });
    });
    
    socket.on('disconnect', () => {
      set({ isConnected: false });
    });
    
    socket.on('drone_update', (data: DroneState) => {
      set({ drone: data });
    });
    
    socket.on('plants_update', (data: PlantData[]) => {
      set({ plants: data });
    });
    
    socket.on('camera_feed', (data: { image: string }) => {
      set({ cameraFeed: data.image });
    });
    
    socket.on('maize_disease_result', (data: any) => {
      set({ maizeDiseaseResult: data });
    });

    socket.on('simulation_state', (data: { isRunning: boolean; isPaused: boolean; step: number }) => {
      set({ 
        isRunning: data.isRunning, 
        isPaused: data.isPaused, 
        step: data.step 
      });
    });
    
    set({ socket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  },

  startSimulation: () => {
    const { socket } = get();
    if (socket) {
      socket.emit('start_simulation');
    }
  },

  pauseSimulation: () => {
    const { socket } = get();
    if (socket) {
      socket.emit('pause_simulation');
    }
  },

  resetSimulation: () => {
    const { socket } = get();
    if (socket) {
      socket.emit('reset_simulation');
    }
  },

  toggleCNNOverlay: () => {
    set((state) => ({ showCNNOverlay: !state.showCNNOverlay }));
  },

  updateDrone: (droneUpdate) => {
    set((state) => ({
      drone: { ...state.drone, ...droneUpdate }
    }));
  },

  updatePlants: (plants) => {
    set({ plants });
  },

  setCameraFeed: (feed) => {
    set({ cameraFeed: feed });
  },

  setMaizeDiseaseResult: (result) => {
    set({ maizeDiseaseResult: result });
  },
}));