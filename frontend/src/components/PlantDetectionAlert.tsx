import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, Info, TrendingDown } from 'lucide-react';
import { sessionsAPI } from '../services/api';

interface PlantDetection {
  id: string;
  session_id: string;
  plant_id: string;
  label: string;
  location: { x: number; y: number; z: number };
  health_status: string;
  detected_at?: string;
  created_at?: string;
  updated_at?: string;
  metadata?: any;
  notes?: string;
  insights?: string;
}

interface PlantDetectionAlertProps {
  isVisible: boolean;
  onClose: () => void;
  detection: PlantDetection;
}

const PlantDetectionAlert: React.FC<PlantDetectionAlertProps> = ({ 
  isVisible, 
  onClose, 
  detection 
}) => {
  const [insights, setInsights] = useState<string>('');
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);

  useEffect(() => {
    if (isVisible && detection && !insights) {
      generateInsights();
      
      // Show browser notification if permission is granted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Plant Health Alert', {
          body: `${detection.label || 'Disease'} detected at location (${detection.location?.x?.toFixed(1) || 0}, ${detection.location?.z?.toFixed(1) || 0})`,
          icon: '/favicon.ico',
          tag: 'plant-alert'
        });
      }
      
      // Add a subtle notification sound or visual indicator
      // You can uncomment this if you want to add a notification sound
      // const audio = new Audio('/notification.mp3');
      // audio.play().catch(() => {}); // Ignore if audio fails
    }
  }, [isVisible, detection]);

  const generateInsights = async () => {
    try {
      setIsLoadingInsights(true);
      
      // Generate insights using OpenAI
      const response = await sessionsAPI.generatePlantInsights({
        label: detection.label || 'Unknown Disease',
        health_status: detection.health_status || 'unknown',
        location: detection.location || { x: 0, y: 0, z: 0 },
        plant_id: detection.plant_id || 'Unknown'
      });
      
      // Extract the AI response from the chat API
      const aiResponse = response.data?.content || response.data?.response || response.data?.message;
      setInsights(aiResponse || 'Unable to generate insights at this time.');
    } catch (error) {
      console.error('Failed to generate insights:', error);
      // Fallback to local insights generation
      const fallbackInsight = generateFallbackInsight(detection);
      setInsights(fallbackInsight);
    } finally {
      setIsLoadingInsights(false);
    }
  };

  const generateFallbackInsight = (detection: PlantDetection) => {
    const disease = detection.label?.toLowerCase() || 'disease';
    const location = detection.location;
    
    if (disease.includes('blight')) {
      return `Blight detected at coordinates (${location?.x?.toFixed(1) || 0}, ${location?.z?.toFixed(1) || 0}). This fungal disease can spread rapidly. Consider immediate treatment with fungicides and isolate affected plants.`;
    } else if (disease.includes('rust')) {
      return `Rust disease found at location (${location?.x?.toFixed(1) || 0}, ${location?.z?.toFixed(1) || 0}). Remove infected leaves and apply copper-based fungicides. Monitor for spread.`;
    } else if (disease.includes('spot')) {
      return `Leaf spot detected at (${location?.x?.toFixed(1) || 0}, ${location?.z?.toFixed(1) || 0}). Improve air circulation and avoid overhead watering. Apply appropriate fungicides.`;
    } else {
      return `Plant health issue detected at coordinates (${location?.x?.toFixed(1) || 0}, ${location?.z?.toFixed(1) || 0}). Monitor closely and consider treatment based on symptoms.`;
    }
  };

  const getDiseaseColor = (label: string) => {
    if (!label) return 'text-red-600';
    const disease = label.toLowerCase();
    if (disease.includes('blight')) return 'text-red-600';
    if (disease.includes('rust')) return 'text-orange-600';
    if (disease.includes('spot')) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getDiseaseIcon = (label: string) => {
    if (!label) return '';
    const disease = label.toLowerCase();
    if (disease.includes('blight')) return '';
    if (disease.includes('rust')) return '';
    if (disease.includes('spot')) return '';
    return '';
  };

  if (!isVisible || !detection) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-lg">
      <div className="bg-white rounded-lg shadow-2xl border-l-4 border-red-500 p-6 animate-slide-in animate-alert-pulse">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Plant Health Alert
              </h3>
              <p className="text-sm text-gray-500">
                {detection.created_at ? new Date(detection.created_at).toLocaleString() : 'Unknown time'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alert Content */}
        <div className="space-y-4">
          {/* Disease Info */}
          <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
            <span className="text-2xl">{getDiseaseIcon(detection.label)}</span>
            <div>
              <p className={`text-base font-bold ${getDiseaseColor(detection.label)}`}>
                {detection.label || 'Unknown Disease'} Detected
              </p>
              <p className="text-sm text-gray-600">
                Plant ID: {detection.plant_id || 'Unknown'}
              </p>
            </div>
          </div>

          {/* Location */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm font-medium text-gray-700 mb-2">Location:</p>
            <p className="text-sm font-mono bg-white p-2 rounded border">
              X: {detection.location?.x?.toFixed(1) || '0.0'}, 
              Y: {detection.location?.y?.toFixed(1) || '0.0'}, 
              Z: {detection.location?.z?.toFixed(1) || '0.0'}
            </p>
          </div>

          {/* Insights - Made more prominent */}
          {insights && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center space-x-2 mb-3">
                <Info className="w-5 h-5 text-blue-600" />
                <p className="text-base font-bold text-blue-800">AI Insights</p>
              </div>
              <p className="text-sm text-blue-700 leading-relaxed">{insights}</p>
            </div>
          )}

          {/* Loading State */}
          {isLoadingInsights && (
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <p className="text-sm text-blue-600 font-medium">Generating AI insights...</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-3">
            <button className="flex-1 bg-red-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium">
              View Details
            </button>
            <button 
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 text-sm px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Dismiss Alert
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlantDetectionAlert; 