import React from 'react';
import { useSimulationStore } from '../store/simulationStore';
import { useMemo } from 'react';
import * as THREE from 'three';
import { GradientTexture } from '@react-three/drei';

// Helper for maize (corn) plant
const MaizePlant: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  // Stalk segments
  const stalkSegments = Array.from({ length: 5 });
  // Leaves (randomized angles)
  const leaves = Array.from({ length: 6 });

  return (
    <group position={position}>
      {/* Stalk */}
      {stalkSegments.map((_, i) => (
        <mesh key={i} position={[0, 0.2 + i * 0.25, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.07, 0.25, 8]} />
          <meshStandardMaterial color="#7cfc00" />
        </mesh>
      ))}
      {/* Leaves */}
      {leaves.map((_, i) => {
        const angle = (i / leaves.length) * Math.PI * 2;
        const y = 0.3 + (i % 3) * 0.35;
        return (
          <mesh
            key={i}
            position={[Math.sin(angle) * 0.18, y, Math.cos(angle) * 0.18]}
            rotation={[0, angle, Math.PI / 2.5]}
            castShadow
          >
            <cylinderGeometry args={[0.01, 0.08, 0.35, 6, 1, true]} />
            <meshStandardMaterial color="#228B22" />
          </mesh>
        );
      })}
      {/* Corn cob (yellow tip) */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshStandardMaterial color="#ffd700" />
      </mesh>
    </group>
  );
};

const Environment: React.FC = () => {
  const { plants } = useSimulationStore();

  // Field size
  const FIELD_SIZE = 50;

  // Only render plants within bounds
  const boundedPlants = useMemo(
    () =>
      plants.filter(
        (p) =>
          Math.abs(p.position[0]) <= FIELD_SIZE / 2 - 1 &&
          Math.abs(p.position[2]) <= FIELD_SIZE / 2 - 1
      ),
    [plants]
  );

  return (
    <group>
      {/* Ground with subtle gradient using vertex colors */}
      <mesh receiveShadow position={[0, -0.5, 0]}>
        <boxGeometry args={[FIELD_SIZE, 1, FIELD_SIZE]} />
        <meshStandardMaterial color="#355e1a" />
      </mesh>

      {/* Dirt path */}
      <mesh position={[0, -0.49, 0]}>
        <boxGeometry args={[FIELD_SIZE * 0.7, 0.02, 2]} />
        <meshStandardMaterial color="#a67c52" />
      </mesh>

      {/* Fence (simple posts around the field) */}
      {Array.from({ length: 20 }).map((_, i) => {
        const t = (i / 20) * Math.PI * 2;
        const r = FIELD_SIZE / 2 + 0.5;
        return (
          <mesh key={i} position={[Math.cos(t) * r, 0, Math.sin(t) * r]}>
            <cylinderGeometry args={[0.07, 0.07, 1.2, 6]} />
            <meshStandardMaterial color="#8b5a2b" />
          </mesh>
        );
      })}

      {/* Barn (simple red box with roof) */}
      <group position={[-FIELD_SIZE / 2 + 4, 0.5, -FIELD_SIZE / 2 + 4]}>
        <mesh>
          <boxGeometry args={[3, 2, 2]} />
          <meshStandardMaterial color="#b22222" />
        </mesh>
        <mesh position={[0, 1.2, 0]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[3.2, 0.5, 2.2]} />
          <meshStandardMaterial color="#fffafa" />
        </mesh>
      </group>

      {/* Bushes and rocks at the edge */}
      {Array.from({ length: 10 }).map((_, i) => {
        const angle = (i / 10) * Math.PI * 2;
        const r = FIELD_SIZE / 2 + 1.5;
        return (
          <mesh key={i} position={[Math.cos(angle) * r, 0, Math.sin(angle) * r]}>
            <sphereGeometry args={[0.4 + Math.random() * 0.2, 8, 8]} />
            <meshStandardMaterial color={i % 2 === 0 ? '#3e7042' : '#b0a99f'} />
          </mesh>
        );
      })}

      {/* Maize plants */}
      {boundedPlants.map((plant) => (
        <MaizePlant key={plant.id} position={plant.position} />
      ))}

      {/* Sky gradient dome */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[120, 32, 32]} />
        <meshBasicMaterial side={THREE.BackSide}>
          <GradientTexture
            stops={[0, 0.7, 1]}
            colors={["#b3e0ff", "#87ceeb", "#e0f7fa"]}
            size={1024}
          />
        </meshBasicMaterial>
      </mesh>
    </group>
  );
};

export default Environment;