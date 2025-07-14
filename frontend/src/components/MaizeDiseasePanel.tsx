import React from 'react';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Eye, 
  Brain,
  Target,
  Clock,
  Info
} from 'lucide-react';

interface MaizeDiseaseResult {
  prediction: string;
  confidence: number;
  is_sick: boolean;
  description: string;
  class_id: number;
  probabilities: number[];
  timestamp: string;
  model_loaded: boolean;
}

interface MaizeDiseasePanelProps {
  diseaseResult?: MaizeDiseaseResult;
  isConnected: boolean;
}

const MaizeDiseasePanel: React.FC<MaizeDiseasePanelProps> = ({ 
  diseaseResult, 
  isConnected 
}) => {
  const getDiseaseColor = (prediction: string) => {
    switch (prediction) {
      case 'Healthy':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'Northern Leaf Blight':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'Common Rust':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'Gray Leaf Spot':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getDiseaseIcon = (prediction: string) => {
    switch (prediction) {
      case 'Healthy':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'Northern Leaf Blight':
      case 'Common Rust':
      case 'Gray Leaf Spot':
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      default:
        return <Info className="w-5 h-5 text-gray-600" />;
    }
  };

  const formatConfidence = (confidence: number) => {
    return (confidence * 100).toFixed(1);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-blue-100">
            <Brain className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Maize Disease Detection</h3>
            <p className="text-sm text-gray-600">CNN-powered plant health analysis</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            isConnected 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>
      </div>

      {/* Connection Status */}
      {!isConnected && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <span className="text-sm text-yellow-800">
              CNN server not connected. Using simulated predictions.
            </span>
          </div>
        </div>
      )}

      {/* Disease Detection Result */}
      {diseaseResult ? (
        <div className="space-y-4">
          {/* Main Result */}
          <div className={`p-4 rounded-lg border-2 ${getDiseaseColor(diseaseResult.prediction)}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getDiseaseIcon(diseaseResult.prediction)}
                <div>
                  <h4 className="font-semibold">{diseaseResult.prediction}</h4>
                  <p className="text-sm opacity-75">{diseaseResult.description}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">
                  {formatConfidence(diseaseResult.confidence)}%
                </div>
                <div className="text-xs opacity-75">Confidence</div>
              </div>
            </div>
          </div>

          {/* Health Status */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Health Status</span>
            </div>
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
              diseaseResult.is_sick 
                ? 'bg-red-100 text-red-700' 
                : 'bg-green-100 text-green-700'
            }`}>
              {diseaseResult.is_sick ? (
                <>
                  <AlertTriangle className="w-3 h-3" />
                  <span>Disease Detected</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-3 h-3" />
                  <span>Healthy</span>
                </>
              )}
            </div>
          </div>

          {/* Model Status */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Model Status</span>
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              diseaseResult.model_loaded 
                ? 'bg-green-100 text-green-700' 
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              {diseaseResult.model_loaded ? 'Loaded' : 'Simulated'}
            </div>
          </div>

          {/* Timestamp */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Last Analysis</span>
            </div>
            <span className="text-sm text-gray-600">
              {formatTimestamp(diseaseResult.timestamp)}
            </span>
          </div>

          {/* Class Probabilities */}
          {diseaseResult.probabilities && (
            <div className="space-y-2">
              <h5 className="text-sm font-medium text-gray-700">Class Probabilities</h5>
              <div className="space-y-1">
                {['Healthy', 'Northern Leaf Blight', 'Common Rust', 'Gray Leaf Spot'].map((className, index) => (
                  <div key={className} className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">{className}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(diseaseResult.probabilities[index] || 0) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-8 text-right">
                        {((diseaseResult.probabilities[index] || 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* No Result State */
        <div className="text-center py-8">
          <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Analysis Yet</h4>
          <p className="text-sm text-gray-600">
            Fly the drone over plants to analyze their health using the CNN model.
          </p>
        </div>
      )}
    </div>
  );
};

export default MaizeDiseasePanel; 