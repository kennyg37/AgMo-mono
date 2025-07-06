import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stats } from '@react-three/drei';
import Scene from './components/Scene';
import DebugPanel from './components/DebugPanel';
import ControlPanel from './components/ControlPanel';
import { useSimulationStore } from './store/simulationStore';

function App() {
  const { isConnected } = useSimulationStore();

  return (
    <div className="w-full h-full relative bg-gray-900">
      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [10, 10, 10], fov: 60 }}
        className="absolute inset-0"
      >
        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
        <Stats />
        <Scene />
      </Canvas>

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="flex h-full">
          {/* Left Panel - Debug Info */}
          <div className="w-80 p-4 pointer-events-auto">
            <DebugPanel />
          </div>

          {/* Right Panel - Controls */}
          <div className="flex-1 flex justify-end p-4">
            <div className="w-80 pointer-events-auto">
              <ControlPanel />
            </div>
          </div>
        </div>

        {/* Connection Status */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 pointer-events-auto">
          <div
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              isConnected
                ? 'bg-green-500 text-white'
                : 'bg-red-500 text-white'
            }`}
          >
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;