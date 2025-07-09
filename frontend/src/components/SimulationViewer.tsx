import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stats } from '@react-three/drei';
import Scene from './Scene';
import DebugPanel from './DebugPanel';
import ControlPanel from './ControlPanel';
import { useSimulationStore } from '../store/simulationStore';

const SimulationViewer: React.FC = () => {
  const { isConnected } = useSimulationStore();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-900">
        {/* Fullscreen Header */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-gray-800 text-white p-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Live Simulation</h2>
          <button
            onClick={toggleFullscreen}
            className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>Exit Fullscreen</span>
          </button>
        </div>

        {/* Fullscreen 3D Canvas */}
        <Canvas
          camera={{ position: [10, 10, 10], fov: 60 }}
          className="absolute inset-0"
        >
          <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
          <Stats />
          <Scene />
        </Canvas>

        {/* Fullscreen UI Overlay */}
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
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 pointer-events-auto">
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

  return (
    <div className="relative w-full h-full">
      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [10, 10, 10], fov: 60 }}
        className="w-full h-full"
      >
        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
        <Stats />
        <Scene />
      </Canvas>

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="flex h-full">
          {/* Left Panel - Debug Info */}
          <div className="w-64 p-2 pointer-events-auto">
            <div className="bg-black bg-opacity-50 rounded-lg p-2">
              <DebugPanel />
            </div>
          </div>

          {/* Right Panel - Controls */}
          <div className="flex-1 flex justify-end p-2">
            <div className="w-64 pointer-events-auto">
              <div className="bg-black bg-opacity-50 rounded-lg p-2">
                <ControlPanel />
              </div>
            </div>
          </div>
        </div>

        {/* Connection Status */}
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 pointer-events-auto">
          <div
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              isConnected
                ? 'bg-green-500 text-white'
                : 'bg-red-500 text-white'
            }`}
          >
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>

        {/* Fullscreen Button */}
        <div className="absolute bottom-2 right-2 pointer-events-auto">
          <button
            onClick={toggleFullscreen}
            className="bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimulationViewer; 