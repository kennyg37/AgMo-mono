import React from 'react';
import { 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight,
  RotateCcw,
  RotateCw,
  Square,
  AlertTriangle
} from 'lucide-react';
import { useSimulationStore } from '../store/simulationStore';

const DroneControls: React.FC = () => {
  const { setDroneAction, manualControlMode, isConnected } = useSimulationStore();

  const sendAction = (action: [number, number, number, number]) => {
    console.log('🎮 On-screen control pressed:', action);
    console.log('❌ Simulation is currently unavailable');
  };

  const handleKeyPress = (action: [number, number, number, number]) => {
    sendAction(action);
  };

  return (
    <div className="bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white">
      <h3 className="text-lg font-semibold mb-4 text-center">Drone Controls</h3>
      
      {/* Unavailable Notice */}
      <div className="bg-red-600/20 border border-red-500 rounded-lg p-3 mb-4">
        <div className="flex items-center gap-2 text-red-400 justify-center">
          <AlertTriangle className="w-4 h-4" />
          <span className="font-semibold">Controls Unavailable</span>
        </div>
        <div className="text-xs text-red-300 mt-2 text-center">
          Drone controls are disabled. Simulation feature is currently unavailable.
        </div>
      </div>
      
      {/* Movement Controls */}
      <div className="space-y-3 opacity-50">
        <div className="text-center">
          <h4 className="text-sm font-medium mb-2">Movement</h4>
          
          {/* Forward/Backward */}
          <div className="flex justify-center mb-2">
            <button
              disabled
              className="bg-gray-500 p-3 rounded-lg cursor-not-allowed"
              title="Forward"
            >
              <ArrowUp className="w-6 h-6" />
            </button>
          </div>
          
          {/* Left/Right/Backward Row */}
          <div className="flex justify-center space-x-2">
            <button
              disabled
              className="bg-gray-500 p-3 rounded-lg cursor-not-allowed"
              title="Left"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            
            <button
              disabled
              className="bg-gray-500 p-3 rounded-lg cursor-not-allowed"
              title="Backward"
            >
              <ArrowDown className="w-6 h-6" />
            </button>
            
            <button
              disabled
              className="bg-gray-500 p-3 rounded-lg cursor-not-allowed"
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
              disabled
              className="bg-gray-500 p-2 rounded-lg cursor-not-allowed text-xs"
              title="Forward-Left"
            >
              Q
            </button>
            <button
              disabled
              className="bg-gray-500 p-2 rounded-lg cursor-not-allowed text-xs"
              title="Forward-Right"
            >
              E
            </button>
            <button
              disabled
              className="bg-gray-500 p-2 rounded-lg cursor-not-allowed text-xs"
              title="Backward-Left"
            >
              R
            </button>
            <button
              disabled
              className="bg-gray-500 p-2 rounded-lg cursor-not-allowed text-xs"
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
              disabled
              className="bg-gray-500 p-3 rounded-lg cursor-not-allowed"
              title="Yaw Left"
            >
              <RotateCcw className="w-6 h-6" />
            </button>
            <button
              disabled
              className="bg-gray-500 p-3 rounded-lg cursor-not-allowed"
              title="Yaw Right"
            >
              <RotateCw className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Hover Button */}
        <div className="text-center">
          <button
            disabled
            className="bg-gray-500 p-2 rounded-lg cursor-not-allowed text-sm"
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
          Controls disabled - simulation unavailable
        </div>
      </div>
    </div>
  );
};

export default DroneControls; 