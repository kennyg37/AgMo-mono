import { EventEmitter } from 'events';
import { PhysicsWorld } from './PhysicsWorld.js';
import { DroneController } from './DroneController.js';
import { Environment } from './Environment.js';
import { CameraRenderer } from './CameraRenderer.js';
import { PythonBackendClient } from '../python/PythonBackendClient.js';

export interface SimulationState {
  isRunning: boolean;
  isPaused: boolean;
  step: number;
  fps: number;
  performance: {
    physicsTime: number;
    renderTime: number;
    totalTime: number;
  };
  drone: {
    position: [number, number, number];
    rotation: [number, number, number];
    velocity: [number, number, number];
    altitude: number;
    battery: number;
  };
  plants: Array<{
    id: string;
    position: [number, number, number];
    health: 'healthy' | 'sick' | 'unknown';
    confidence: number;
  }>;
}

export interface SimulationConfig {
  physicsTimestep: number;
  maxFPS: number;
  enablePerformanceMonitoring: boolean;
  enableErrorRecovery: boolean;
  maxConsecutiveErrors: number;
}

export class SimulationEngine extends EventEmitter {
  private physicsWorld: PhysicsWorld;
  private droneController: DroneController;
  private environment: Environment;
  private cameraRenderer: CameraRenderer;
  private pythonClient: PythonBackendClient;
  
  public isRunning = false;
  public isPaused = false;
  public step = 0;
  public fps = 0;
  
  // Manual control state
  private manualControl = false;
  private lastManualAction: [number, number, number, number] = [0.5, 0, 0, 0];
  
  private simulationLoop?: NodeJS.Timeout;
  private lastFrameTime = 0;
  private frameCount = 0;
  private fpsUpdateInterval = 0;
  private consecutiveErrors = 0;
  private performanceMetrics = {
    physicsTime: 0,
    renderTime: 0,
    totalTime: 0,
  };
  
  private config: SimulationConfig = {
    physicsTimestep: parseFloat(process.env.PHYSICS_TIMESTEP || '0.016'),
    maxFPS: parseInt(process.env.MAX_FPS || '60'),
    enablePerformanceMonitoring: process.env.ENABLE_PERFORMANCE_MONITORING === 'true',
    enableErrorRecovery: process.env.ENABLE_ERROR_RECOVERY === 'true',
    maxConsecutiveErrors: parseInt(process.env.MAX_CONSECUTIVE_ERRORS || '5'),
  };

  constructor() {
    super();
    
    this.physicsWorld = new PhysicsWorld();
    this.droneController = new DroneController();
    this.environment = new Environment();
    this.cameraRenderer = new CameraRenderer();
    this.pythonClient = new PythonBackendClient();
  }

  async initialize(): Promise<void> {
    console.log('🔧 Initializing simulation engine...');
    console.log('📊 Configuration:', this.config);
    
    try {
      await this.physicsWorld.initialize();
      await this.droneController.initialize(this.physicsWorld);
      await this.environment.initialize(this.physicsWorld);
      await this.cameraRenderer.initialize();
      
      // Connect to Python backend with retry logic
      await this.connectToBackendWithRetry();
      
      // Start FPS monitoring
      this.startFPSMonitoring();
      
      console.log('✅ Simulation engine initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize simulation engine:', error);
      throw error;
    }
  }

  private async connectToBackendWithRetry(maxRetries = 3): Promise<void> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.pythonClient.connect();
        console.log(`✅ Connected to Python backend on attempt ${attempt}`);
        return;
      } catch (error) {
        console.warn(`⚠️ Backend connection attempt ${attempt} failed:`, error);
        if (attempt === maxRetries) {
          console.warn('⚠️ Continuing without backend connection');
          return;
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  private startFPSMonitoring(): void {
    this.fpsUpdateInterval = setInterval(() => {
      this.fps = this.frameCount;
      this.frameCount = 0;
    }, 1000) as any;
  }

  start(): void {
    if (this.isRunning) return;
    
    console.log('▶️ Starting simulation...');
    this.isRunning = true;
    this.isPaused = false;
    this.lastFrameTime = Date.now();
    
    this.simulationLoop = setInterval(() => {
      if (!this.isPaused) {
        this.update();
      }
    }, 1000 / this.config.maxFPS);
    
    this.emit('started');
  }

  pause(): void {
    if (!this.isRunning || this.isPaused) return;
    
    console.log('⏸️ Pausing simulation...');
    this.isPaused = true;
    this.emit('paused');
  }

  resume(): void {
    if (!this.isRunning || !this.isPaused) return;
    
    console.log('▶️ Resuming simulation...');
    this.isPaused = false;
    this.lastFrameTime = Date.now();
    this.emit('resumed');
  }

  stop(): void {
    if (!this.isRunning) return;
    
    console.log('⏹️ Stopping simulation...');
    this.isRunning = false;
    this.isPaused = false;
    
    if (this.simulationLoop) {
      clearInterval(this.simulationLoop);
      this.simulationLoop = undefined;
    }
    
    this.emit('stopped');
  }

  reset(): void {
    console.log('🔄 Resetting simulation...');
    
    const wasRunning = this.isRunning;
    this.stop();
    
    this.step = 0;
    this.consecutiveErrors = 0;
    this.frameCount = 0;
    this.performanceMetrics = {
      physicsTime: 0,
      renderTime: 0,
      totalTime: 0,
    };
    
    this.droneController.reset();
    this.environment.reset();
    this.physicsWorld.reset();
    
    if (wasRunning) {
      this.start();
    }
    
    this.emit('reset');
  }

  private update(): void {
    const startTime = performance.now();
    
    try {
      this.step++;
      this.frameCount++;
      
      // Calculate delta time
      const currentTime = Date.now();
      const deltaTime = Math.min((currentTime - this.lastFrameTime) / 1000, this.config.physicsTimestep * 2);
      this.lastFrameTime = currentTime;
      
      // Update physics with timing
      const physicsStart = performance.now();
      this.physicsWorld.step(this.config.physicsTimestep);
      this.performanceMetrics.physicsTime = performance.now() - physicsStart;
      
      // === DRONE CONTROL LOGIC ===
      if (this.manualControl) {
        // Only use last manual action
        this.droneController.setAction(this.lastManualAction);
        console.log('🕹️ Applying manual action:', this.lastManualAction);
      } else {
        // TODO: Insert agent/autopilot logic here if needed
        // For now, hover
        this.droneController.setAction([0.5, 0, 0, 0]);
      }
      // Update drone
      this.droneController.update(this.config.physicsTimestep);
      
      // Update environment
      this.environment.update(this.config.physicsTimestep);
      
      // Render camera view with timing
      const renderStart = performance.now();
      const cameraImage = this.cameraRenderer.render(
        this.droneController.getPosition(),
        this.droneController.getRotation()
      );
      this.performanceMetrics.renderTime = performance.now() - renderStart;
      
      // Send data to Python backend for RL processing
      this.sendObservationToBackend(cameraImage);
      
      // Reset error counter on successful update
      this.consecutiveErrors = 0;
      
      // Update total time
      this.performanceMetrics.totalTime = performance.now() - startTime;
      
      // Emit updates
      this.emit('update', this.getState());
      this.emit('camera_feed', { image: cameraImage });
      
    } catch (error) {
      this.consecutiveErrors++;
      console.error(`❌ Simulation update error (${this.consecutiveErrors}/${this.config.maxConsecutiveErrors}):`, error);
      
      if (this.config.enableErrorRecovery && this.consecutiveErrors >= this.config.maxConsecutiveErrors) {
        console.warn('⚠️ Too many consecutive errors, attempting recovery...');
        this.attemptErrorRecovery();
      }
    }
  }

  private async sendObservationToBackend(cameraImage: string): Promise<void> {
    try {
      await this.pythonClient.sendObservation({
        image: cameraImage,
        position: this.droneController.getPosition(),
        velocity: this.droneController.getVelocity(),
        plants: this.environment.getPlants(),
      });
    } catch (error) {
      // Don't throw here, just log the error
      console.warn('⚠️ Failed to send observation to backend:', error);
    }
  }

  private attemptErrorRecovery(): void {
    console.log('🔄 Attempting error recovery...');
    
    try {
      // Reset physics world
      this.physicsWorld.reset();
      
      // Reset drone to safe position
      this.droneController.reset();
      
      // Reset environment
      this.environment.reset();
      
      // Reset error counter
      this.consecutiveErrors = 0;
      
      console.log('✅ Error recovery completed');
      this.emit('error_recovered');
    } catch (error) {
      console.error('❌ Error recovery failed:', error);
      this.emit('error_recovery_failed', error);
    }
  }

  getState(): SimulationState {
    return {
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      step: this.step,
      fps: this.fps,
      performance: this.config.enablePerformanceMonitoring ? { ...this.performanceMetrics } : {
        physicsTime: 0,
        renderTime: 0,
        totalTime: 0,
      },
      drone: {
        position: this.droneController.getPosition(),
        rotation: this.droneController.getRotation(),
        velocity: this.droneController.getVelocity(),
        altitude: this.droneController.getPosition()[1],
        battery: this.droneController.getBattery(),
      },
      plants: this.environment.getPlants(),
    };
  }

  // Control methods for external use
  setDroneAction(action: [number, number, number, number]): void {
    if (this.manualControl) {
      this.lastManualAction = action;
      console.log('🕹️ Manual action received:', action);
    }
    // If not manual, ignore frontend actions
  }

  getDroneObservation(): any {
    return {
      position: this.droneController.getPosition(),
      velocity: this.droneController.getVelocity(),
      rotation: this.droneController.getRotation(),
    };
  }

  // Configuration methods
  updateConfig(newConfig: Partial<SimulationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ Simulation config updated:', this.config);
  }

  getConfig(): SimulationConfig {
    return { ...this.config };
  }

  // Cleanup
  destroy(): void {
    console.log('🧹 Cleaning up simulation engine...');
    
    this.stop();
    
    if (this.fpsUpdateInterval) {
      clearInterval(this.fpsUpdateInterval);
    }
    
    this.pythonClient.disconnect();
    this.emit('destroyed');
  }

  setManualControl(enabled: boolean): void {
    this.manualControl = enabled;
    if (enabled) {
      console.log('🕹️ Manual drone control enabled');
    } else {
      console.log('🤖 Autopilot/agent control enabled');
    }
  }

  // Height lock control methods
  toggleHeightLock(): void {
    this.droneController.toggleHeightLock();
  }

  setHeightLock(enabled: boolean): void {
    this.droneController.setHeightLock(enabled);
  }

  setTargetAltitude(altitude: number): void {
    this.droneController.setTargetAltitude(altitude);
  }

  emergencyLand(): void {
    this.droneController.emergencyLand();
  }
}