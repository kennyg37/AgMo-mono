import React from 'react';
import { Play, Pause, RotateCcw, Eye, EyeOff, MousePointerClick, Bot, AlertTriangle, CheckCircle } from 'lucide-react';
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
            disabled
            className="flex items-center gap-2 px-4 py-2 bg-gray-500 rounded-lg cursor-not-allowed opacity-50"
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
            disabled
            className="flex items-center gap-2 px-4 py-2 bg-gray-500 rounded-lg cursor-not-allowed opacity-50"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>
        
        {/* Emergency Landing Button */}
        <button
          disabled
          className="flex items-center gap-2 px-4 py-2 bg-gray-500 rounded-lg cursor-not-allowed opacity-50 w-full"
        >
          <span className="text-white font-bold">🚨 EMERGENCY LAND</span>
        </button>
        
        {/* Unavailable Notice */}
        <div className="bg-red-600/20 border border-red-500 rounded-lg p-3">
          <div className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="w-4 h-4" />
            <span className="font-semibold">Simulation Unavailable</span>
          </div>
          <div className="text-xs text-red-300 mt-2">
            Simulation controls are currently disabled. This feature will be available in a future update.
          </div>
        </div>
      </div>

      {/* Manual/Autopilot Toggle */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Drone Mode</h3>
        <button
          onClick={() => setManualControl(!manualControlMode)}
          disabled
          className="flex items-center gap-2 px-4 py-2 bg-gray-500 rounded-lg cursor-not-allowed opacity-50"
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
          Controls disabled - simulation unavailable
        </div>
      </div>

      {/* Flight Mode Info */}
      {manualControlMode && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Flight Mode</h3>
          <div className="bg-red-600/20 border border-red-500 rounded-lg p-3">
            <div className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-semibold">Simulation Unavailable</span>
            </div>
            <div className="text-xs text-red-300 mt-2">
              Flight controls are disabled. Simulation feature is currently unavailable.
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Controls Help */}
      {manualControlMode && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Controls</h3>
          <div className="text-xs text-gray-300 space-y-1">
            <div><strong>Movement:</strong> DISABLED</div>
            <div><strong>Diagonal Movement:</strong> DISABLED</div>
            <div><strong>Yaw:</strong> DISABLED</div>
            <div className="text-red-400">
              <strong>Thrust:</strong> DISABLED (simulation unavailable)
            </div>
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