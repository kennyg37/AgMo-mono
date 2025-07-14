import React from 'react';
import { 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight,
  RotateCcw,
  RotateCw,
  Move,
  Square
} from 'lucide-react';
import { useSimulationStore } from '../store/simulationStore';

const DroneControls: React.FC = () => {
  const { setDroneAction, manualControlMode, isConnected } = useSimulationStore();

  const sendAction = (action: [number, number, number, number]) => {
    console.log('🎮 On-screen control pressed:', action);
    setDroneAction(action);
  };

  const handleKeyPress = (action: [number, number, number, number]) => {
    sendAction(action);
    // Auto-release after 200ms for smoother button-like behavior
    setTimeout(() => {
      sendAction([0.5, 0, 0, 0]); // Return to hover
    }, 200);
  };

  if (!manualControlMode || !isConnected) {
    return (
      <div className="bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white">
        <div className="text-center">
          <p className="text-sm text-gray-300">
            {!isConnected ? 'Not connected to simulation' : 'Manual control disabled'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white">
      <h3 className="text-lg font-semibold mb-4 text-center">Drone Controls</h3>
      
      {/* Movement Controls */}
      <div className="space-y-3">
        <div className="text-center">
          <h4 className="text-sm font-medium mb-2">Movement</h4>
          
          {/* Forward/Backward */}
          <div className="flex justify-center mb-2">
            <button
              onClick={() => handleKeyPress([0.5, -0.3, 0, 0])}
              className="bg-blue-600 hover:bg-blue-700 p-3 rounded-lg transition-colors"
              title="Forward"
            >
              <ArrowUp className="w-6 h-6" />
            </button>
          </div>
          
          {/* Left/Right/Backward Row */}
          <div className="flex justify-center space-x-2">
            <button
              onClick={() => handleKeyPress([0.5, 0, -0.3, 0])}
              className="bg-blue-600 hover:bg-blue-700 p-3 rounded-lg transition-colors"
              title="Left"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            
            <button
              onClick={() => handleKeyPress([0.5, 0.3, 0, 0])}
              className="bg-blue-600 hover:bg-blue-700 p-3 rounded-lg transition-colors"
              title="Backward"
            >
              <ArrowDown className="w-6 h-6" />
            </button>
            
            <button
              onClick={() => handleKeyPress([0.5, 0, 0.3, 0])}
              className="bg-blue-600 hover:bg-blue-700 p-3 rounded-lg transition-colors"
              title="Right"
            >
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Diagonal Movement */}
        <div className="text-center">
          <h4 className="text-sm font-medium mb-2">Diagonal Movement</h4>
          <div className="grid grid-cols-2 gap-2 max-w-xs mx-auto">
            <button
              onClick={() => handleKeyPress([0.5, -0.2, -0.2, 0])}
              className="bg-green-600 hover:bg-green-700 p-2 rounded-lg transition-colors text-xs"
              title="Forward-Left"
            >
              Q
            </button>
            <button
              onClick={() => handleKeyPress([0.5, -0.2, 0.2, 0])}
              className="bg-green-600 hover:bg-green-700 p-2 rounded-lg transition-colors text-xs"
              title="Forward-Right"
            >
              E
            </button>
            <button
              onClick={() => handleKeyPress([0.5, 0.2, -0.2, 0])}
              className="bg-green-600 hover:bg-green-700 p-2 rounded-lg transition-colors text-xs"
              title="Backward-Left"
            >
              R
            </button>
            <button
              onClick={() => handleKeyPress([0.5, 0.2, 0.2, 0])}
              className="bg-green-600 hover:bg-green-700 p-2 rounded-lg transition-colors text-xs"
              title="Backward-Right"
            >
              F
            </button>
          </div>
        </div>

        {/* Yaw Controls */}
        <div className="text-center">
          <h4 className="text-sm font-medium mb-2">Rotation</h4>
          <div className="flex justify-center space-x-2">
            <button
              onClick={() => handleKeyPress([0.5, 0, 0, -0.3])}
              className="bg-purple-600 hover:bg-purple-700 p-3 rounded-lg transition-colors"
              title="Yaw Left"
            >
              <RotateCcw className="w-6 h-6" />
            </button>
            <button
              onClick={() => handleKeyPress([0.5, 0, 0, 0.3])}
              className="bg-purple-600 hover:bg-purple-700 p-3 rounded-lg transition-colors"
              title="Yaw Right"
            >
              <RotateCw className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Hover Button */}
        <div className="text-center">
          <button
            onClick={() => sendAction([0.5, 0, 0, 0])}
            className="bg-gray-600 hover:bg-gray-700 p-2 rounded-lg transition-colors text-sm"
            title="Hover"
          >
            <Square className="w-4 h-4 inline mr-1" />
            Hover
          </button>
        </div>
      </div>

      {/* Status */}
      <div className="mt-4 text-center">
        <div className="text-xs text-gray-300">
          Click buttons to move drone
        </div>
      </div>
    </div>
  );
};

export default DroneControls; 