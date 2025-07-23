import { create } from 'zustand';

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
    console.log('🎮 Manual control mode:', enabled ? 'enabled' : 'disabled');
  },
  setDroneAction: (action) => {
    console.log('🎮 setDroneAction called:', { action });
    console.log('❌ Simulation is currently unavailable');
  },

  // Actions
  connect: () => {
    console.log('🔌 Attempting to connect to simulation...');
    console.log('❌ Simulation is currently unavailable');
    set({ isConnected: false });
  },

  disconnect: () => {
    console.log('🔌 Disconnecting from simulation...');
    set({ isConnected: false });
  },

  startSimulation: () => {
    console.log('🚀 Attempting to start simulation...');
    console.log('❌ Simulation is currently unavailable');
  },

  pauseSimulation: () => {
    console.log('⏸️ Attempting to pause simulation...');
    console.log('❌ Simulation is currently unavailable');
  },

  resetSimulation: () => {
    console.log('🔄 Attempting to reset simulation...');
    console.log('❌ Simulation is currently unavailable');
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