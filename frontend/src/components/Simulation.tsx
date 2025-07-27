import React, { useState } from 'react';
import { X, Maximize2, Minimize2 } from 'lucide-react';

interface SimulationProps {
  isOpen: boolean;
  onClose: () => void;
}

const Simulation: React.FC<SimulationProps> = ({ isOpen, onClose }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black m-0 p-0">
      <div className="relative w-full h-full pl-5 m-0 p-0">
        {/* Unity Environment - Full Screen */}
        <iframe
          src="/simulation/index.html"
          className="w-full h-full border-0 m-0 p-0"
          title="Unity WebGL Simulation"
          allow="fullscreen"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
          style={{ margin: 0, padding: 0, display: 'block' }}
          onLoad={() => console.log('Unity iframe loaded successfully')}
          onError={(e) => console.error('Unity iframe error:', e)}
        />

        {/* Floating Control Buttons */}
        <div className="absolute top-4 right-4 flex items-center space-x-2">
          <button
            onClick={handleFullscreen}
            className="p-3 bg-black bg-opacity-50 hover:bg-opacity-75 text-white rounded-lg transition-all duration-200 backdrop-blur-sm"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
          <button
            onClick={handleClose}
            className="p-3 bg-black bg-opacity-50 hover:bg-opacity-75 text-white rounded-lg transition-all duration-200 backdrop-blur-sm"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Simulation; 