import { describe, it, expect, beforeEach } from 'vitest';
import { PhysicsWorld } from '../simulation/PhysicsWorld.js';
import { DroneController } from '../simulation/DroneController.js';

describe('Physics Tests', () => {
  let physicsWorld: PhysicsWorld;
  let droneController: DroneController;

  beforeEach(async () => {
    physicsWorld = new PhysicsWorld();
    droneController = new DroneController();
    
    await physicsWorld.initialize();
    await droneController.initialize(physicsWorld);
  });

  it('should initialize physics world', () => {
    expect(physicsWorld.getWorld()).toBeDefined();
  });

  it('should update drone position with physics', () => {
    const initialPosition = droneController.getPosition();
    
    // Apply upward thrust
    droneController.setAction([1, 0, 0, 0]);
    
    // Step physics
    for (let i = 0; i < 60; i++) { // 1 second at 60fps
      droneController.update(1/60);
      physicsWorld.step(1/60);
    }
    
    const finalPosition = droneController.getPosition();
    
    // Drone should have moved upward
    expect(finalPosition[1]).toBeGreaterThan(initialPosition[1]);
  });

  it('should apply gravity to drone', () => {
    const initialPosition = droneController.getPosition();
    
    // No thrust, let gravity work
    droneController.setAction([0, 0, 0, 0]);
    
    // Step physics
    for (let i = 0; i < 60; i++) { // 1 second at 60fps
      droneController.update(1/60);
      physicsWorld.step(1/60);
    }
    
    const finalPosition = droneController.getPosition();
    
    // Drone should have fallen
    expect(finalPosition[1]).toBeLessThan(initialPosition[1]);
  });
});