import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { SimulationEngine } from '../simulation/SimulationEngine.js';
import { PhysicsWorld } from '../simulation/PhysicsWorld.js';
import { DroneController } from '../simulation/DroneController.js';
import { Environment } from '../simulation/Environment.js';
import { CameraRenderer } from '../simulation/CameraRenderer.js';

describe('Simulation Engine', () => {
  let simulationEngine: SimulationEngine;

  beforeAll(async () => {
    simulationEngine = new SimulationEngine();
    await simulationEngine.initialize();
  });

  afterAll(async () => {
    simulationEngine.destroy();
  });

  beforeEach(() => {
    simulationEngine.reset();
  });

  describe('Initialization', () => {
    it('should initialize successfully', () => {
      expect(simulationEngine).toBeDefined();
      expect(simulationEngine.isRunning).toBe(false);
      expect(simulationEngine.isPaused).toBe(false);
      expect(simulationEngine.step).toBe(0);
    });

    it('should have valid configuration', () => {
      const config = simulationEngine.getConfig();
      expect(config.physicsTimestep).toBeGreaterThan(0);
      expect(config.maxFPS).toBeGreaterThan(0);
      expect(config.maxFPS).toBeLessThanOrEqual(120);
    });
  });

  describe('Simulation Control', () => {
    it('should start simulation', () => {
      simulationEngine.start();
      expect(simulationEngine.isRunning).toBe(true);
      expect(simulationEngine.isPaused).toBe(false);
    });

    it('should pause simulation', () => {
      simulationEngine.start();
      simulationEngine.pause();
      expect(simulationEngine.isRunning).toBe(true);
      expect(simulationEngine.isPaused).toBe(true);
    });

    it('should resume simulation', () => {
      simulationEngine.start();
      simulationEngine.pause();
      simulationEngine.resume();
      expect(simulationEngine.isRunning).toBe(true);
      expect(simulationEngine.isPaused).toBe(false);
    });

    it('should stop simulation', () => {
      simulationEngine.start();
      simulationEngine.stop();
      expect(simulationEngine.isRunning).toBe(false);
      expect(simulationEngine.isPaused).toBe(false);
    });

    it('should reset simulation', () => {
      simulationEngine.start();
      simulationEngine.step = 100;
      simulationEngine.reset();
      expect(simulationEngine.step).toBe(0);
      expect(simulationEngine.isRunning).toBe(false);
    });
  });

  describe('State Management', () => {
    it('should return valid state', () => {
      const state = simulationEngine.getState();
      expect(state.isRunning).toBeDefined();
      expect(state.isPaused).toBeDefined();
      expect(state.step).toBeDefined();
      expect(state.drone).toBeDefined();
      expect(state.plants).toBeDefined();
      expect(state.fps).toBeDefined();
      expect(state.performance).toBeDefined();
    });

    it('should update state during simulation', async () => {
      simulationEngine.start();
      
      // Wait for a few steps
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const state = simulationEngine.getState();
      expect(state.step).toBeGreaterThan(0);
      expect(state.fps).toBeGreaterThan(0);
    });
  });
});

describe('Physics World', () => {
  let physicsWorld: PhysicsWorld;

  beforeAll(async () => {
    physicsWorld = new PhysicsWorld();
    await physicsWorld.initialize();
  });

  afterAll(() => {
    physicsWorld.dispose();
  });

  beforeEach(() => {
    physicsWorld.reset();
  });

  describe('Initialization', () => {
    it('should initialize successfully', () => {
      expect(physicsWorld.getWorld()).toBeDefined();
    });

    it('should have valid configuration', () => {
      const config = physicsWorld.getConfig();
      expect(config.gravity).toEqual([0, -9.81, 0]);
      expect(config.maxSubSteps).toBeGreaterThan(0);
    });
  });

  describe('Body Management', () => {
    it('should add and remove rigid bodies', async () => {
      const ammoModule = await import('ammo.js');
      const Ammo = ammoModule.default || ammoModule;
      
      // Initialize Ammo.js
      if (typeof Ammo === 'function') {
        await Ammo();
      }

      // Create a simple box body
      const shape = new Ammo.btBoxShape(new Ammo.btVector3(1, 1, 1));
      const transform = new Ammo.btTransform();
      transform.setIdentity();
      transform.setOrigin(new Ammo.btVector3(0, 5, 0));
      const motionState = new Ammo.btDefaultMotionState(transform);
      const mass = 1;
      const localInertia = new Ammo.btVector3(0, 0, 0);
      shape.calculateLocalInertia(mass, localInertia);
      const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, shape, localInertia);
      const body = new Ammo.btRigidBody(rbInfo);

      physicsWorld.addRigidBody('test_body', body);
      expect(physicsWorld.getRigidBody('test_body')).toBe(body);

      physicsWorld.removeRigidBody('test_body');
      expect(physicsWorld.getRigidBody('test_body')).toBeUndefined();
    });
  });

  describe('Physics Simulation', () => {
    it('should step simulation without errors', () => {
      expect(() => physicsWorld.step(0.016)).not.toThrow();
    });

    it('should provide performance metrics', () => {
      physicsWorld.step(0.016);
      const metrics = physicsWorld.getPerformanceMetrics();
      expect(metrics.stepTime).toBeGreaterThanOrEqual(0);
      expect(metrics.activeBodies).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('Drone Controller', () => {
  let droneController: DroneController;
  let physicsWorld: PhysicsWorld;

  beforeAll(async () => {
    physicsWorld = new PhysicsWorld();
    await physicsWorld.initialize();
    
    droneController = new DroneController();
    await droneController.initialize(physicsWorld);
  });

  afterAll(() => {
    physicsWorld.dispose();
  });

  beforeEach(() => {
    droneController.reset();
  });

  describe('Initialization', () => {
    it('should initialize successfully', () => {
      expect(droneController.getPosition()).toEqual([0, 5, 0]);
      expect(droneController.getBattery()).toBe(100);
    });

    it('should have valid configuration', () => {
      const config = droneController.getConfig();
      expect(config.mass).toBeGreaterThan(0);
      expect(config.maxThrust).toBeGreaterThan(0);
      expect(config.batteryCapacity).toBeGreaterThan(0);
    });
  });

  describe('Drone Control', () => {
    it('should accept control actions', () => {
      const action: [number, number, number, number] = [0.5, 0.1, -0.1, 0.2];
      droneController.setAction(action);
      
      // The action should be applied in the next update
      droneController.update(0.016);
      
      const state = droneController.getState();
      expect(state.motors).toBeDefined();
      expect(state.motors.length).toBe(4);
    });

    it('should update drone state', () => {
      const initialPosition = droneController.getPosition();
      droneController.update(0.016);
      const newPosition = droneController.getPosition();
      
      // Position should be updated (might not change much due to physics)
      expect(newPosition).toBeDefined();
    });

    it('should drain battery during operation', () => {
      const initialBattery = droneController.getBattery();
      droneController.setAction([0.8, 0, 0, 0]); // High thrust
      droneController.update(0.016);
      const newBattery = droneController.getBattery();
      
      expect(newBattery).toBeLessThanOrEqual(initialBattery);
    });
  });

  describe('Safety Features', () => {
    it('should prevent excessive altitude', () => {
      // Set drone to high altitude
      const state = droneController.getState();
      state.position[1] = 60; // Very high
      
      droneController.setAction([1.0, 0, 0, 0]); // Full thrust
      droneController.update(0.016);
      
      // Should reduce thrust due to altitude protection
      const newState = droneController.getState();
      expect(newState.position[1]).toBeLessThanOrEqual(60);
    });

    it('should prevent ground collision', () => {
      // Set drone to low altitude
      const state = droneController.getState();
      state.position[1] = 0.1; // Very low
      
      droneController.setAction([0.0, 0, 0, 0]); // No thrust
      droneController.update(0.016);
      
      // Should maintain minimum thrust due to ground protection
      const newState = droneController.getState();
      expect(newState.position[1]).toBeGreaterThanOrEqual(0.1);
    });
  });
});

describe('Environment', () => {
  let environment: Environment;
  let physicsWorld: PhysicsWorld;

  beforeAll(async () => {
    physicsWorld = new PhysicsWorld();
    await physicsWorld.initialize();
    
    environment = new Environment();
    await environment.initialize(physicsWorld);
  });

  afterAll(() => {
    physicsWorld.dispose();
  });

  beforeEach(() => {
    environment.reset();
  });

  describe('Initialization', () => {
    it('should generate plants', () => {
      const plants = environment.getPlants();
      expect(plants.length).toBeGreaterThan(0);
      
      const config = environment.getConfig();
      expect(plants.length).toBeLessThanOrEqual(config.maxPlants);
    });

    it('should have valid plant data', () => {
      const plants = environment.getPlants();
      const plant = plants[0];
      
      expect(plant.id).toBeDefined();
      expect(plant.position).toHaveLength(3);
      expect(plant.health).toMatch(/^(healthy|sick|unknown)$/);
      expect(plant.age).toBeGreaterThanOrEqual(0);
      expect(plant.type).toMatch(/^(corn|wheat|soybean|tomato)$/);
    });
  });

  describe('Plant Management', () => {
    it('should update plant health', () => {
      const plants = environment.getPlants();
      const plantId = plants[0].id;
      
      environment.updatePlantHealth(plantId, 'sick', 85);
      
      const updatedPlants = environment.getPlants();
      const updatedPlant = updatedPlants.find(p => p.id === plantId);
      expect(updatedPlant?.health).toBe('sick');
      expect(updatedPlant?.confidence).toBe(85);
    });

    it('should find plants in radius', () => {
      const center: [number, number, number] = [0, 0, 0];
      const radius = 10;
      
      const plantsInRadius = environment.getPlantsInRadius(center, radius);
      expect(plantsInRadius.length).toBeGreaterThanOrEqual(0);
      
      // All plants should be within radius
      plantsInRadius.forEach(plant => {
        const distance = Math.sqrt(
          Math.pow(plant.position[0] - center[0], 2) +
          Math.pow(plant.position[2] - center[2], 2)
        );
        expect(distance).toBeLessThanOrEqual(radius);
      });
    });
  });

  describe('Weather System', () => {
    it('should have weather conditions', () => {
      const weather = environment.getWeather();
      expect(weather.temperature).toBeGreaterThan(-20);
      expect(weather.temperature).toBeLessThan(50);
      expect(weather.humidity).toBeGreaterThanOrEqual(0);
      expect(weather.humidity).toBeLessThanOrEqual(100);
    });

    it('should update weather over time', () => {
      const initialWeather = environment.getWeather();
      
      environment.update(1.0); // Update for 1 second
      
      const newWeather = environment.getWeather();
      // Weather should have changed (though might be subtle)
      expect(newWeather).toBeDefined();
    });
  });
});

describe('Camera Renderer', () => {
  let cameraRenderer: CameraRenderer;

  beforeAll(async () => {
    cameraRenderer = new CameraRenderer();
    await cameraRenderer.initialize();
  });

  afterAll(() => {
    cameraRenderer.dispose();
  });

  describe('Initialization', () => {
    it('should initialize successfully', () => {
      const config = cameraRenderer.getConfig();
      expect(config.width).toBeGreaterThan(0);
      expect(config.height).toBeGreaterThan(0);
      expect(config.fov).toBeGreaterThan(0);
    });
  });

  describe('Rendering', () => {
    it('should render camera view', () => {
      const position: [number, number, number] = [0, 10, 0];
      const rotation: [number, number, number] = [0, 0, 0];
      
      const imageData = cameraRenderer.render(position, rotation);
      expect(imageData).toBeDefined();
      expect(imageData.length).toBeGreaterThan(0);
    });

    it('should handle different camera positions', () => {
      const positions: [number, number, number][] = [
        [0, 5, 0],
        [10, 15, -5],
        [-5, 8, 10],
      ];
      
      positions.forEach(position => {
        const rotation: [number, number, number] = [0, 0, 0];
        const imageData = cameraRenderer.render(position, rotation);
        expect(imageData).toBeDefined();
        expect(imageData.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Configuration', () => {
    it('should update camera configuration', () => {
      const newConfig = {
        fov: 90,
        enableShadows: true,
        noiseLevel: 0.05,
      };
      
      cameraRenderer.setCameraConfig(newConfig);
      
      const config = cameraRenderer.getConfig();
      expect(config.fov).toBe(90);
      expect(config.enableShadows).toBe(true);
      expect(config.noiseLevel).toBe(0.05);
    });
  });
});

describe('Integration Tests', () => {
  let simulationEngine: SimulationEngine;

  beforeAll(async () => {
    simulationEngine = new SimulationEngine();
    await simulationEngine.initialize();
  });

  afterAll(async () => {
    simulationEngine.destroy();
  });

  describe('Full Simulation Loop', () => {
    it('should run complete simulation cycle', async () => {
      simulationEngine.start();
      
      // Run for a short time
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const state = simulationEngine.getState();
      expect(state.step).toBeGreaterThan(0);
      expect(state.fps).toBeGreaterThan(0);
      expect(state.drone.position).toBeDefined();
      expect(state.plants.length).toBeGreaterThan(0);
      
      simulationEngine.stop();
    });

    it('should handle drone actions', () => {
      simulationEngine.start();
      
      // Apply drone action
      simulationEngine.setDroneAction([0.5, 0.1, -0.1, 0.2]);
      
      // Let it run for a bit
      setTimeout(() => {
        const state = simulationEngine.getState();
        expect(state.drone.position).toBeDefined();
        expect(state.drone.battery).toBeLessThanOrEqual(100);
        
        simulationEngine.stop();
      }, 100);
    });

    it('should maintain performance', async () => {
      simulationEngine.start();
      
      // Run for a longer time to check performance
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const state = simulationEngine.getState();
      expect(state.performance.totalTime).toBeGreaterThan(0);
      expect(state.performance.physicsTime).toBeGreaterThan(0);
      expect(state.performance.renderTime).toBeGreaterThan(0);
      
      // Performance should be reasonable
      expect(state.performance.totalTime).toBeLessThan(16); // Should be under 16ms for 60fps
      
      simulationEngine.stop();
    });
  });
}); 