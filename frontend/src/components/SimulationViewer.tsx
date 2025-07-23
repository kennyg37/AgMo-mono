import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stats } from '@react-three/drei';
import Scene from './Scene';
import DebugPanel from './DebugPanel';
import ControlPanel from './ControlPanel';
import DroneControls from './DroneControls';
import { useSimulationStore } from '../store/simulationStore';

const SimulationViewer: React.FC = () => {
  const { isConnected } = useSimulationStore();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Show unavailable message
  const renderUnavailableMessage = () => (
    <div className="flex items-center justify-center h-full bg-gray-50">
      <div className="text-center p-8">
        <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Simulation Unavailable</h3>
        <p className="text-gray-600 mb-4">The 3D simulation feature is currently unavailable.</p>
        <div className="text-sm text-gray-500">
          <p>This feature will be available in a future update.</p>
        </div>
      </div>
    </div>
  );

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

        {/* Fullscreen Content */}
        <div className="absolute inset-0 pt-16">
          {renderUnavailableMessage()}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[600px]">
      {/* 3D Canvas - Show unavailable message instead */}
      <div className="w-full h-full">
        {renderUnavailableMessage()}
      </div>

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="flex h-full">
          {/* Left Panel - Debug Info */}
          <div className="w-64 p-2 pointer-events-auto">
            <div className="bg-black bg-opacity-50 rounded-lg p-2 max-h-full overflow-y-auto">
              <DebugPanel />
            </div>
          </div>

          {/* Center Panel - Drone Controls */}
          <div className="flex-1 flex justify-center items-end p-2">
            <div className="w-80 pointer-events-auto">
              <div className="bg-black bg-opacity-50 rounded-lg p-2">
                <DroneControls />
              </div>
            </div>
          </div>

          {/* Right Panel - Controls */}
          <div className="flex-1 flex justify-end p-2">
            <div className="w-64 pointer-events-auto">
              <div className="bg-black bg-opacity-50 rounded-lg p-2 max-h-full overflow-y-auto">
                <ControlPanel />
              </div>
            </div>
          </div>
        </div>

        {/* Connection Status */}
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 pointer-events-auto">
          <div className="px-3 py-1 rounded-full text-xs font-medium bg-red-500 text-white">
            Unavailable
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