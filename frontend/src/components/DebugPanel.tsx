import React, { useEffect } from 'react';
import { Activity, Battery, Camera, MapPin, AlertTriangle } from 'lucide-react';
import { useSimulationStore } from '../store/simulationStore';

const DebugPanel: React.FC = () => {
  const { 
    drone, 
    step, 
    isRunning, 
    isPaused, 
    cameraFeed, 
    showCNNOverlay,
    plants,
    connect,
    isConnected,
    manualControlMode,
  } = useSimulationStore();

  useEffect(() => {
    if (!isConnected) {
      connect();
    }
  }, [connect, isConnected]);

  const healthyPlants = plants.filter(p => p.health === 'healthy').length;
  const sickPlants = plants.filter(p => p.health === 'sick').length;
  const unknownPlants = plants.filter(p => p.health === 'unknown').length;

  return (
    <div className="bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white space-y-4">
      <h2 className="text-xl font-bold mb-4">Debug Panel</h2>
      
      {/* Simulation Status */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Simulation
        </h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>Status: {isRunning ? (isPaused ? 'Paused' : 'Running') : 'Stopped'}</div>
          <div>Step: {step}</div>
        </div>
      </div>

      {/* Drone Telemetry */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Drone Telemetry
        </h3>
        <div className="space-y-1 text-sm">
          <div>Position: ({drone.position.map(p => p.toFixed(2)).join(', ')})</div>
          <div>Velocity: ({drone.velocity.map(v => v.toFixed(2)).join(', ')})</div>
          <div>Altitude: {drone.altitude.toFixed(2)}m</div>
          <div className="flex items-center gap-2">
            <Battery className="w-4 h-4" />
            <div className="flex-1 bg-gray-700 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${drone.battery}%` }}
              />
            </div>
            <span>{drone.battery}%</span>
          </div>
        </div>
      </div>

      {/* Flight Control Status */}
      {manualControlMode && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Flight Control</h3>
          <div className="space-y-1 text-sm">
            <div className={`flex items-center gap-2 ${manualControlMode ? 'text-blue-400' : 'text-gray-400'}`}>
              <div className={`w-2 h-2 rounded-full ${manualControlMode ? 'bg-blue-400' : 'bg-gray-400'}`} />
              Manual Control: {manualControlMode ? 'ON' : 'OFF'}
            </div>
            <div className="flex items-center gap-2 text-orange-400">
              <AlertTriangle className="w-4 h-4" />
              <div className="w-2 h-2 rounded-full bg-orange-400" />
              Thrust: DISABLED
            </div>
            <div className="text-xs text-gray-300 ml-4">
              WASD/Arrow keys for movement, Q/E/R/F for diagonal movement
            </div>
            <div className="text-xs text-orange-300 ml-4">
              No altitude changes possible - thrust completely disabled
            </div>
          </div>
        </div>
      )}

      {/* Plant Statistics */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Plant Health</h3>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="text-green-400">Healthy: {healthyPlants}</div>
          <div className="text-red-400">Sick: {sickPlants}</div>
          <div className="text-gray-400">Unknown: {unknownPlants}</div>
        </div>
      </div>

      {/* Camera Feed */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Camera className="w-5 h-5" />
          Camera Feed
        </h3>
        <div className="relative">
          {cameraFeed ? (
            <img 
              src={`data:image/jpeg;base64,${cameraFeed}`}
              alt="Drone camera feed"
              className="w-full h-32 object-cover rounded border"
            />
          ) : (
            <div className="w-full h-32 bg-gray-800 rounded border flex items-center justify-center text-gray-400">
              No feed
            </div>
          )}
          {showCNNOverlay && (
            <div className="absolute inset-0 bg-blue-500/20 border-2 border-blue-500 rounded">
              <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-1 rounded">
                CNN Active
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DebugPanel;