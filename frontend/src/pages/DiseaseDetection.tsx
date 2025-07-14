import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  Image as ImageIcon, 
  CheckCircle, 
  AlertTriangle, 
  Brain,
  Target,
  Clock,
  Info,
  Download,
  Trash2,
  Loader2
} from 'lucide-react';
import api from '../services/api';

interface DiseasePrediction {
  prediction: string;
  confidence: number;
  is_sick: boolean;
  description: string;
  class_id: number;
  probabilities: number[];
  timestamp: string;
  model_loaded: boolean;
}

interface BatchPrediction {
  predictions: DiseasePrediction[];
  total_images: number;
  healthy_count: number;
  sick_count: number;
}

const DiseaseDetection: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [predictions, setPredictions] = useState<DiseasePrediction[]>([]);
  const [batchResult, setBatchResult] = useState<BatchPrediction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [modelInfo, setModelInfo] = useState<any>(null);

  // Fetch model info on component mount
  React.useEffect(() => {
    fetchModelInfo();
  }, []);

  const fetchModelInfo = async () => {
    try {
      const response = await api.get('/api/disease-detection/model-info');
      setModelInfo(response.data);
    } catch (error) {
      console.error('Failed to fetch model info:', error);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setUploadedFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp']
    },
    multiple: true
  });

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setUploadedFiles([]);
    setPredictions([]);
    setBatchResult(null);
  };

  const predictSingle = async (file: File) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/api/disease-detection/predict', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const prediction: DiseasePrediction = response.data;
      setPredictions(prev => [...prev, prediction]);
    } catch (error) {
      console.error('Prediction failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const predictBatch = async () => {
    if (uploadedFiles.length === 0) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      uploadedFiles.forEach(file => {
        formData.append('files', file);
      });

      const response = await api.post('/api/disease-detection/predict-batch', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const result: BatchPrediction = response.data;
      setBatchResult(result);
      setPredictions(result.predictions);
    } catch (error) {
      console.error('Batch prediction failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Maize Disease Detection</h1>
          <p className="text-gray-600">Upload images to detect maize plant diseases using AI</p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <button
            onClick={clearAll}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All</span>
          </button>
        </div>
      </div>

      {/* Model Info */}
      {modelInfo && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Brain className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Model Information</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Model Type</p>
              <p className="text-sm text-gray-900">{modelInfo.model_type}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Input Size</p>
              <p className="text-sm text-gray-900">{modelInfo.input_size[0]}x{modelInfo.input_size[1]}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Classes</p>
              <p className="text-sm text-gray-900">{modelInfo.num_classes}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Status</p>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                modelInfo.model_loaded 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {modelInfo.model_loaded ? 'Loaded' : 'Simulated'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Upload className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Upload Images</h3>
        </div>
        
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          {isDragActive ? (
            <p className="text-blue-600">Drop the images here...</p>
          ) : (
            <div>
              <p className="text-gray-600 mb-2">
                Drag & drop images here, or click to select files
              </p>
              <p className="text-sm text-gray-500">
                Supports JPEG, PNG, GIF, BMP (max 10MB each)
              </p>
            </div>
          )}
        </div>

        {/* Uploaded Files */}
        {uploadedFiles.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-semibold text-gray-900">
                Uploaded Files ({uploadedFiles.length})
              </h4>
              <button
                onClick={predictBatch}
                disabled={isLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Brain className="w-4 h-4" />
                )}
                <span>Analyze All Images</span>
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                  <p className="text-xs text-gray-600 mt-1 truncate">{file.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {predictions.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Analysis Results</h3>
            </div>
            
            {batchResult && (
              <div className="flex items-center space-x-4 text-sm">
                <span className="text-green-600">
                  Healthy: {batchResult.healthy_count}
                </span>
                <span className="text-red-600">
                  Sick: {batchResult.sick_count}
                </span>
                <span className="text-gray-600">
                  Total: {batchResult.total_images}
                </span>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {predictions.map((prediction, index) => (
              <div key={index} className="space-y-4">
                {/* Image */}
                {uploadedFiles[index] && (
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={URL.createObjectURL(uploadedFiles[index])}
                      alt={`Analysis ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                {/* Prediction */}
                <div className={`p-4 rounded-lg border-2 ${getDiseaseColor(prediction.prediction)}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getDiseaseIcon(prediction.prediction)}
                      <div>
                        <h4 className="font-semibold">{prediction.prediction}</h4>
                        <p className="text-sm opacity-75">{prediction.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {formatConfidence(prediction.confidence)}%
                      </div>
                      <div className="text-xs opacity-75">Confidence</div>
                    </div>
                  </div>
                </div>

                {/* Health Status */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Health Status</span>
                  <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                    prediction.is_sick 
                      ? 'bg-red-100 text-red-700' 
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {prediction.is_sick ? (
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

                {/* Class Probabilities */}
                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-gray-700">Class Probabilities</h5>
                  <div className="space-y-1">
                    {['Healthy', 'Northern Leaf Blight', 'Common Rust', 'Gray Leaf Spot'].map((className, classIndex) => (
                      <div key={className} className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">{className}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${(prediction.probabilities[classIndex] || 0) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 w-8 text-right">
                            {((prediction.probabilities[classIndex] || 0) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Timestamp */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Analysis Time</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {formatTimestamp(prediction.timestamp)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DiseaseDetection; 