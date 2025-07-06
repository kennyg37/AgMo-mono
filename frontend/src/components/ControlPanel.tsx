import React from 'react';
import { Play, Pause, RotateCcw, Eye, EyeOff, MousePointerClick, Bot, Lock, Unlock, Move } from 'lucide-react';
import { useSimulationStore } from '../store/simulationStore';

const ControlPanel: React.FC = () => {
  const {
    isRunning,
    isPaused,
    showCNNOverlay,
    startSimulation,
    pauseSimulation,
    resetSimulation,
    toggleCNNOverlay,
    manualControlMode,
    setManualControl,
    heightLockEnabled,
    toggleHeightLock,
    setHeightLock,
    setTargetAltitude,
  } = useSimulationStore();

  return (
    <div className="bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white space-y-4">
      <h2 className="text-xl font-bold mb-4">Control Panel</h2>
      
      {/* Simulation Controls */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Simulation</h3>
        <div className="flex gap-2">
          <button
            onClick={isRunning && !isPaused ? pauseSimulation : startSimulation}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
          >
            {isRunning && !isPaused ? (
              <>
                <Pause className="w-4 h-4" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Start
              </>
            )}
          </button>
          
          <button
            onClick={resetSimulation}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>
        
        {/* Emergency Landing Button */}
        <button
          onClick={() => {
            const { socket } = useSimulationStore.getState();
            if (socket) {
              socket.emit('emergency_land');
            }
          }}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors w-full"
        >
          <span className="text-white font-bold">🚨 EMERGENCY LAND</span>
        </button>
      </div>

      {/* Manual/Autopilot Toggle */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Drone Mode</h3>
        <button
          onClick={() => setManualControl(!manualControlMode)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            manualControlMode
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'bg-gray-600 hover:bg-gray-700'
          }`}
        >
          {manualControlMode ? (
            <>
              <MousePointerClick className="w-4 h-4" />
              Manual Mode
            </>
          ) : (
            <>
              <Bot className="w-4 h-4" />
              Autopilot
            </>
          )}
        </button>
        <div className="text-xs text-gray-300">
          {manualControlMode
            ? 'Use WASD/Arrow keys to fly, Q/E or R/F for altitude, Z/C for yaw.'
            : 'Drone is in autopilot mode.'}
        </div>
      </div>

      {/* Height Lock Controls */}
      {manualControlMode && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Height Control</h3>
          
          {/* Height Lock Toggle */}
          <button
            onClick={toggleHeightLock}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              heightLockEnabled
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-gray-600 hover:bg-gray-700'
            }`}
          >
            {heightLockEnabled ? (
              <>
                <Lock className="w-4 h-4" />
                Height Lock On
              </>
            ) : (
              <>
                <Unlock className="w-4 h-4" />
                Height Lock Off
              </>
            )}
          </button>

          {/* Quick Altitude Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setTargetAltitude(3)}
              className="px-3 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-sm transition-colors"
            >
              3m
            </button>
            <button
              onClick={() => setTargetAltitude(5)}
              className="px-3 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-sm transition-colors"
            >
              5m
            </button>
            <button
              onClick={() => setTargetAltitude(10)}
              className="px-3 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-sm transition-colors"
            >
              10m
            </button>
          </div>

          <div className="text-xs text-gray-300">
            {heightLockEnabled
              ? 'Drone will maintain current altitude. Use Q/E to change target height.'
              : 'Drone altitude is not locked. Enable height lock for stable flight.'}
          </div>
        </div>
      )}

      {/* Keyboard Controls Help */}
      {manualControlMode && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Controls</h3>
          <div className="text-xs text-gray-300 space-y-1">
            <div><strong>Movement:</strong> WASD or Arrow Keys</div>
            <div><strong>Altitude:</strong> Q (up) / E (down)</div>
            <div><strong>Yaw:</strong> Z (left) / C (right)</div>
            {heightLockEnabled && (
              <div className="text-green-400">
                <strong>Height Lock Active:</strong> Q/E changes target altitude
              </div>
            )}
          </div>
        </div>
      )}

      {/* Vision Controls */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Vision</h3>
        <button
          onClick={toggleCNNOverlay}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            showCNNOverlay
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-gray-600 hover:bg-gray-700'
          }`}
        >
          {showCNNOverlay ? (
            <>
              <Eye className="w-4 h-4" />
              CNN Overlay On
            </>
          ) : (
            <>
              <EyeOff className="w-4 h-4" />
              CNN Overlay Off
            </>
          )}
        </button>
      </div>

      {/* Training Info */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Training</h3>
        <div className="text-sm text-gray-300 space-y-1">
          <div>Episode: -</div>
          <div>Reward: -</div>
          <div>FPS: -</div>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;