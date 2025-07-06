import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';
import Drone from './Drone';
import Environment from './Environment';
import { useSimulationStore } from '../store/simulationStore';

const FIELD_SIZE = 50;
const DRONE_SPEED = 1.2; // Increased for more responsive movement
const DRONE_YAW_SPEED = 0.08; // Increased for more responsive yaw

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

  // Manual drone control logic
  useFrame(() => {
    if (!manualControlMode || !isRunning) return;
    
    // Get height lock state from store
    const { heightLockEnabled, setTargetAltitude } = useSimulationStore.getState();
    
    // WASD/arrow keys: movement, Q/E or R/F: altitude, Z/C: yaw
    let thrust = 0;
    let pitch = 0;
    let roll = 0;
    let yaw = 0;
    
    // Forward/back
    if (keys.current['w'] || keys.current['arrowup']) pitch = -1;
    if (keys.current['s'] || keys.current['arrowdown']) pitch = 1;
    
    // Left/right
    if (keys.current['a'] || keys.current['arrowleft']) roll = -1;
    if (keys.current['d'] || keys.current['arrowright']) roll = 1;
    
    // Up/down - handle differently based on height lock
    if (keys.current['q'] || keys.current['r']) {
      if (heightLockEnabled) {
        // In height lock mode, Q/R changes target altitude
        const currentAltitude = drone.position[1];
        setTargetAltitude(currentAltitude + 1);
      } else {
        // In manual mode, Q/R controls thrust directly
        thrust = 1;
      }
    }
    if (keys.current['e'] || keys.current['f']) {
      if (heightLockEnabled) {
        // In height lock mode, E/F decreases target altitude
        const currentAltitude = drone.position[1];
        setTargetAltitude(Math.max(0.5, currentAltitude - 1));
      } else {
        // In manual mode, E/F controls thrust directly
        thrust = -1;
      }
    }
    
    // Yaw
    if (keys.current['z']) yaw = -1;
    if (keys.current['c']) yaw = 1;

    // Handle thrust based on height lock mode
    if (heightLockEnabled) {
      // In height lock mode, thrust is controlled by the PID controller
      // We only send movement commands (pitch, roll, yaw)
      thrust = 0; // Let the height lock handle thrust
    } else {
      // In manual mode, handle thrust normally
      if (thrust !== 0) {
        thrust = thrust > 0 ? 0.7 : 0.3; // Up: 0.7, Down: 0.3
      } else {
        thrust = 0.15; // Lower hover thrust for better stability
      }
    }

    const action: [number, number, number, number] = [thrust, pitch * DRONE_SPEED, roll * DRONE_SPEED, yaw * DRONE_YAW_SPEED];
    setDroneAction(action);
    
    // Debug logging for movement
    if (pitch !== 0 || roll !== 0 || yaw !== 0) {
      console.log('🎮 Drone controls:', { pitch, roll, yaw, thrust, heightLockEnabled });
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