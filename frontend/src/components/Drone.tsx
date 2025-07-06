import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh } from 'three';

interface DroneProps {
  position: [number, number, number];
  rotation: [number, number, number];
}

const Drone: React.FC<DroneProps> = ({ position, rotation }) => {
  const droneRef = useRef<Mesh>(null);

  useFrame((state, delta) => {
    if (droneRef.current) {
      // Smooth position and rotation updates
      droneRef.current.position.set(...position);
      droneRef.current.rotation.set(...rotation);
    }
  });

  return (
    <group ref={droneRef}>
      {/* Main body */}
      <mesh castShadow>
        <boxGeometry args={[1, 0.3, 1]} />
        <meshStandardMaterial color="#333333" />
      </mesh>

      {/* Propellers */}
      {[
        [-0.6, 0.2, -0.6],
        [0.6, 0.2, -0.6],
        [-0.6, 0.2, 0.6],
        [0.6, 0.2, 0.6],
      ].map((pos, index) => (
        <group key={index} position={pos}>
          <mesh>
            <cylinderGeometry args={[0.02, 0.02, 0.1]} />
            <meshStandardMaterial color="#666666" />
          </mesh>
          <mesh position={[0, 0.05, 0]} rotation={[0, 0, 0]}>
            <boxGeometry args={[0.4, 0.02, 0.05]} />
            <meshStandardMaterial color="#ff6b6b" />
          </mesh>
        </group>
      ))}

      {/* Camera */}
      <mesh position={[0, -0.2, 0.3]}>
        <sphereGeometry args={[0.1]} />
        <meshStandardMaterial color="#4ecdc4" />
      </mesh>
    </group>
  );
};

export default Drone;