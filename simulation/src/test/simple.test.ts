import { describe, it, expect } from 'vitest';
import { SimulationEngine } from '../simulation/SimulationEngine.js';

describe('Simple Simulation Test', () => {
  it('should create simulation engine', () => {
    const engine = new SimulationEngine();
    expect(engine).toBeDefined();
    expect(engine.isRunning).toBe(false);
  });

  it('should have valid configuration', () => {
    const engine = new SimulationEngine();
    const config = engine.getConfig();
    expect(config.physicsTimestep).toBeGreaterThan(0);
    expect(config.maxFPS).toBeGreaterThan(0);
  });

  it('should control simulation state', () => {
    const engine = new SimulationEngine();
    
    // Test start
    engine.start();
    expect(engine.isRunning).toBe(true);
    
    // Test pause
    engine.pause();
    expect(engine.isPaused).toBe(true);
    
    // Test resume
    engine.resume();
    expect(engine.isPaused).toBe(false);
    
    // Test stop
    engine.stop();
    expect(engine.isRunning).toBe(false);
  });

  it('should reset simulation', () => {
    const engine = new SimulationEngine();
    engine.start();
    engine.step = 100;
    
    engine.reset();
    expect(engine.step).toBe(0);
    expect(engine.isRunning).toBe(false);
  });

  it('should get simulation state', () => {
    const engine = new SimulationEngine();
    const state = engine.getState();
    
    expect(state.isRunning).toBeDefined();
    expect(state.isPaused).toBeDefined();
    expect(state.step).toBeDefined();
    expect(state.drone).toBeDefined();
    expect(state.plants).toBeDefined();
  });
}); 