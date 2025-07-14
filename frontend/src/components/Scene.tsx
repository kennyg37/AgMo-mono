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

  // Keyboard event listeners - DISABLED for on-screen controls
  useEffect(() => {
    console.log('🎮 Keyboard controls disabled - using on-screen controls');
    // Keyboard controls are disabled in favor of on-screen controls
  }, [manualControlMode, isRunning]);

  // Drone control disabled - using on-screen controls instead
  useFrame(() => {
    // On-screen controls handle all drone movement
    // This frame loop is kept for potential future use
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