import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';
import Drone from './Drone';
import Environment from './Environment';
import { useSimulationStore } from '../store/simulationStore';

const FIELD_SIZE = 50;
const DRONE_SPEED = 1.0; // Movement speed for horizontal movement
const DRONE_YAW_SPEED = 0.05; // Yaw rotation speed

const Scene: React.FC = () => {
  const groupRef = useRef<Group>(null);
  const { drone, manualControlMode, setDroneAction, isRunning } = useSimulationStore();

  // Keyboard state
  const keys = useRef<{ [key: string]: boolean }>({});

  // Keyboard event listeners
  useEffect(() => {
    if (!manualControlMode || !isRunning) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [manualControlMode, isRunning]);

  // Completely redesigned drone control - NO ALTITUDE CHANGES
  useFrame(() => {
    if (!manualControlMode || !isRunning) return;
    
    // ALWAYS set thrust to 0 to prevent any climbing
    const thrust = 0; // ZERO thrust - no altitude changes
    
    let pitch = 0;
    let roll = 0;
    let yaw = 0;
    
    // Basic movement controls
    // Forward/backward
    if (keys.current['w'] || keys.current['arrowup']) pitch = -1;
    if (keys.current['s'] || keys.current['arrowdown']) pitch = 1;
    
    // Left/right
    if (keys.current['a'] || keys.current['arrowleft']) roll = -1;
    if (keys.current['d'] || keys.current['arrowright']) roll = 1;
    
    // Yaw rotation
    if (keys.current['z']) yaw = -1;
    if (keys.current['c']) yaw = 1;
    
    // Diagonal movement (reduced intensity for smoother control)
    if (keys.current['q']) {
      // Forward-left diagonal
      pitch = -0.5;
      roll = -0.5;
    }
    if (keys.current['e']) {
      // Forward-right diagonal
      pitch = -0.5;
      roll = 0.5;
    }
    if (keys.current['r']) {
      // Backward-left diagonal
      pitch = 0.5;
      roll = -0.5;
    }
    if (keys.current['f']) {
      // Backward-right diagonal
      pitch = 0.5;
      roll = 0.5;
    }

    // Apply speed multipliers
    pitch *= DRONE_SPEED;
    roll *= DRONE_SPEED;
    yaw *= DRONE_YAW_SPEED;

    // Send action with ZERO thrust to prevent climbing
    const action: [number, number, number, number] = [thrust, pitch, roll, yaw];
    setDroneAction(action);
    
    // Debug logging
    if (pitch !== 0 || roll !== 0 || yaw !== 0) {
      console.log('🎮 Drone controls (NO CLIMBING):', { 
        thrust: 0, 
        pitch: pitch.toFixed(2), 
        roll: roll.toFixed(2), 
        yaw: yaw.toFixed(2) 
      });
    }
  });

  return (
    <group ref={groupRef}>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      {/* Environment */}
      <Environment />

      {/* Drone */}
      <Drone position={drone.position} rotation={drone.rotation} />
    </group>
  );
};

export default Scene;