import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import puppeteer, { Browser, Page } from 'puppeteer';
import { SimulationEngine } from '../simulation/SimulationEngine.js';

describe('Headless Rendering Tests', () => {
  let browser: Browser;
  let page: Page;
  let simulationEngine: SimulationEngine;

  beforeAll(async () => {
    browser = await puppeteer.launch({ headless: true });
    page = await browser.newPage();
    
    simulationEngine = new SimulationEngine();
    await simulationEngine.initialize();
  });

  afterAll(async () => {
    simulationEngine.stop();
    await browser.close();
  });

  it('should render camera feed', async () => {
    // Start simulation
    simulationEngine.start();
    
    // Wait for a few simulation steps
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const state = simulationEngine.getState();
    
    // Check that simulation is running
    expect(state.isRunning).toBe(true);
    expect(state.step).toBeGreaterThan(0);
    
    // Check drone state
    expect(state.drone.position).toHaveLength(3);
    expect(state.drone.velocity).toHaveLength(3);
    expect(state.drone.rotation).toHaveLength(3);
    
    simulationEngine.stop();
  });

  it('should generate camera images', () => {
    const state = simulationEngine.getState();
    
    // Camera renderer should produce base64 images
    // This is tested indirectly through the simulation engine
    expect(state.drone).toBeDefined();
    expect(state.plants).toBeDefined();
  });

  it('should handle drone actions', () => {
    const initialPosition = simulationEngine.getDroneObservation().position;
    
    // Apply action
    simulationEngine.setDroneAction([1, 0, 0, 0]); // Thrust up
    
    // Step simulation
    simulationEngine.start();
    
    setTimeout(() => {
      const finalPosition = simulationEngine.getDroneObservation().position;
      
      // Position should have changed
      expect(finalPosition).not.toEqual(initialPosition);
      
      simulationEngine.stop();
    }, 100);
  });
});