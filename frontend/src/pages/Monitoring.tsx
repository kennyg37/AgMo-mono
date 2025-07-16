import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Activity, 
  Droplets, 
  Thermometer, 
  Wind,
  Sun,
  Cloud,
  CheckCircle,
  Clock,
  Zap,
  Sprout,
  MessageSquare,
  BarChart3,
  Eye,
  Download,
  Share2,
  Settings,
  Search,
  Filter,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Award,
  Target,
  Info,
  Crop,
  Package,
  AlertTriangle,
  Camera,
  MapPin,
  Calendar,
  RefreshCw,
  Play,
  Pause,
  Square,
  Maximize2,
  Minimize2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Layers,
  Grid,
  List,
  Clock as ClockIcon,
  Calendar as CalendarIcon,
  Gauge,
  BarChart,
  LineChart,
  PieChart
} from 'lucide-react';
import { monitoringAPI, farmsAPI, weatherAPI } from '../services/api';
import { useLocation } from '../contexts/LocationContext';

interface SensorData {
  id: number;
  field_id: number;
  sensor_type: string;
  value: number;
  unit: string;
  timestamp: string;
  status: 'normal' | 'warning' | 'critical';
}

interface WeatherData {
  id: number;
  field_id: number;
  temperature: number;
  humidity: number;
  wind_speed: number;
  rainfall: number;
  pressure: number;
  timestamp: string;
}

interface PlantHealth {
  id: number;
  field_id: number;
  health_score: number;
  disease_detected: string | null;
  pest_infestation: string | null;
  nutrient_deficiency: string | null;
  timestamp: string;
}

const Monitoring: React.FC = () => {
  const [selectedField, setSelectedField] = useState<number | null>(null);
  const [timeRange, setTimeRange] = useState('24h');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedSensor, setSelectedSensor] = useState<string | null>(null);

  // Get location from context
  const { location, isLoading: locationLoading, error: locationError, detectLocation } = useLocation();

  // Fetch farms for selection
  const { data: farms } = useQuery({
    queryKey: ['farms'],
    queryFn: () => farmsAPI.getFarms(),
  });

  // Fetch sensor data
  const { data: sensorData } = useQuery({
    queryKey: ['sensor-data', selectedField, timeRange],
    queryFn: () => selectedField ? monitoringAPI.getSensorData(selectedField, undefined, timeRange === '24h' ? 24 : 168) : null,
    enabled: !!selectedField,
    refetchInterval: autoRefresh ? 30000 : false, // Refresh every 30 seconds if auto-refresh is on
  });

  // Fetch weather data using detected location
  const { data: weatherData } = useQuery({
    queryKey: ['weather-data', location?.name || 'default'],
    queryFn: () => weatherAPI.getCurrentWeather(location?.name),
    enabled: !!location?.name,
    refetchInterval: autoRefresh ? 60000 : false, // Refresh every minute
  });

  // Fetch plant health data
  const { data: plantHealthData } = useQuery({
    queryKey: ['plant-health', selectedField, timeRange],
    queryFn: () => selectedField ? monitoringAPI.getPlantHealth(selectedField, timeRange === '24h' ? 1 : 30) : null,
    enabled: !!selectedField,
    refetchInterval: autoRefresh ? 120000 : false, // Refresh every 2 minutes
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'critical':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getSensorIcon = (sensorType: string) => {
    switch (sensorType.toLowerCase()) {
      case 'temperature':
        return <Thermometer className="w-5 h-5 text-orange-500" />;
      case 'humidity':
        return <Droplets className="w-5 h-5 text-blue-500" />;
      case 'soil_moisture':
        return <Droplets className="w-5 h-5 text-blue-600" />;
      case 'wind_speed':
        return <Wind className="w-5 h-5 text-gray-500" />;
      case 'light':
        return <Sun className="w-5 h-5 text-yellow-500" />;
      case 'pressure':
        return <Gauge className="w-5 h-5 text-purple-500" />;
      default:
        return <Activity className="w-5 h-5 text-green-500" />;
    }
  };

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'sunny':
        return <Sun className="w-6 h-6 text-yellow-500" />;
      case 'cloudy':
        return <Cloud className="w-6 h-6 text-gray-500" />;
      case 'rainy':
        return <Droplets className="w-6 h-6 text-blue-500" />;
      default:
        return <Sun className="w-6 h-6 text-yellow-500" />;
    }
  };

  const getEnhancedWeatherIcon = (condition: string, temperature?: number) => {
    const conditionLower = condition?.toLowerCase() || '';
    
    // Map weather conditions to appropriate icons
    if (conditionLower.includes('clear') || conditionLower.includes('sunny')) {
      return <Sun className="w-8 h-8 text-yellow-500" />;
    } else if (conditionLower.includes('cloud') || conditionLower.includes('overcast')) {
      return <Cloud className="w-8 h-8 text-gray-500" />;
    } else if (conditionLower.includes('rain') || conditionLower.includes('drizzle') || conditionLower.includes('shower')) {
      return <Droplets className="w-8 h-8 text-blue-500" />;
    } else if (conditionLower.includes('snow') || conditionLower.includes('sleet')) {
      return <Cloud className="w-8 h-8 text-blue-300" />;
    } else if (conditionLower.includes('thunder') || conditionLower.includes('storm')) {
      return <Zap className="w-8 h-8 text-yellow-600" />;
    } else if (conditionLower.includes('fog') || conditionLower.includes('mist')) {
      return <Cloud className="w-8 h-8 text-gray-400" />;
    } else if (conditionLower.includes('haze') || conditionLower.includes('smoke')) {
      return <Cloud className="w-8 h-8 text-orange-400" />;
    } else {
      // Fallback based on temperature if condition is not recognized
      if (temperature !== undefined) {
        if (temperature > 25) {
          return <Sun className="w-8 h-8 text-yellow-500" />;
        } else if (temperature < 10) {
          return <Cloud className="w-8 h-8 text-gray-500" />;
        } else {
          return <Cloud className="w-8 h-8 text-blue-400" />;
        }
      }
      return <Sun className="w-8 h-8 text-yellow-500" />; // Default fallback
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const mockSensorData: SensorData[] = [
    { id: 1, field_id: 1, sensor_type: 'temperature', value: 24.5, unit: '°C', timestamp: new Date().toISOString(), status: 'normal' },
    { id: 2, field_id: 1, sensor_type: 'humidity', value: 68, unit: '%', timestamp: new Date().toISOString(), status: 'normal' },
    { id: 3, field_id: 1, sensor_type: 'soil_moisture', value: 45, unit: '%', timestamp: new Date().toISOString(), status: 'warning' },
    { id: 4, field_id: 1, sensor_type: 'wind_speed', value: 12, unit: 'km/h', timestamp: new Date().toISOString(), status: 'normal' },
    { id: 5, field_id: 1, sensor_type: 'light', value: 850, unit: 'lux', timestamp: new Date().toISOString(), status: 'normal' },
    { id: 6, field_id: 1, sensor_type: 'pressure', value: 1013, unit: 'hPa', timestamp: new Date().toISOString(), status: 'normal' },
  ];

  const mockPlantHealthData: PlantHealth[] = [
    { id: 1, field_id: 1, health_score: 87, disease_detected: null, pest_infestation: null, nutrient_deficiency: null, timestamp: new Date().toISOString() },
  ];

  // Use real weather data from backend API or fallback to mock data
  const currentWeather = weatherData?.data?.current ? {
    temperature_c: weatherData.data.current.temperature_c || 0,
    humidity: weatherData.data.current.humidity || 0,
    wind_kph: weatherData.data.current.wind_kph || 0,
    precip_mm: weatherData.data.current.precip_mm || 0,
    pressure_mb: weatherData.data.current.pressure_mb || 0,
    condition: weatherData.data.current.condition || { text: 'Unknown', icon: '' },
    last_updated: weatherData.data.current.last_updated || new Date().toISOString()
  } : {
    temperature_c: 24.5,
    humidity: 68,
    wind_kph: 12,
    precip_mm: 0,
    pressure_mb: 1013,
    condition: { text: 'sunny', icon: '' },
    last_updated: new Date().toISOString()
  };

  // Create sensor data from weather API when no field is selected
  const weatherBasedSensors: SensorData[] = weatherData?.data?.current ? [
    { 
      id: 1, 
      field_id: 0, 
      sensor_type: 'temperature', 
      value: weatherData.data.current.temperature_c || 0, 
      unit: '°C', 
      timestamp: weatherData.data.current.last_updated || new Date().toISOString(), 
      status: 'normal' 
    },
    { 
      id: 2, 
      field_id: 0, 
      sensor_type: 'humidity', 
      value: weatherData.data.current.humidity || 0, 
      unit: '%', 
      timestamp: weatherData.data.current.last_updated || new Date().toISOString(), 
      status: 'normal' 
    },
    { 
      id: 3, 
      field_id: 0, 
      sensor_type: 'wind_speed', 
      value: weatherData.data.current.wind_kph || 0, 
      unit: 'km/h', 
      timestamp: weatherData.data.current.last_updated || new Date().toISOString(), 
      status: 'normal' 
    },
    { 
      id: 4, 
      field_id: 0, 
      sensor_type: 'pressure', 
      value: weatherData.data.current.pressure_mb || 0, 
      unit: 'hPa', 
      timestamp: weatherData.data.current.last_updated || new Date().toISOString(), 
      status: 'normal' 
    }
  ] : mockSensorData;

  // Debug logging to check weather data
  console.log('Weather Data:', weatherData);
  console.log('Weather-based sensors:', weatherBasedSensors);

  const data = {
    sensors: sensorData?.data || weatherBasedSensors,
    weather: [currentWeather],
    plantHealth: plantHealthData?.data || mockPlantHealthData,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Monitoring</h1>
          <p className="text-gray-600">Real-time sensor data and crop health monitoring</p>
          
          {/* Location Display */}
          <div className="flex items-center space-x-2 mt-2">
            <MapPin className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              {locationLoading ? 'Detecting location...' : 
               locationError ? 'Location unavailable' :
               location?.name || 'Location not set'}
            </span>
            <button
              onClick={detectLocation}
              disabled={locationLoading}
              className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
              title="Refresh location"
            >
              <RefreshCw className={`w-3 h-3 text-gray-500 ${locationLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <select 
            value={selectedField || ''}
            onChange={(e) => setSelectedField(e.target.value ? Number(e.target.value) : null)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">Select Field</option>
            {farms?.data?.map((farm: any) => 
              farm.fields?.map((field: any) => (
                <option key={field.id} value={field.id}>{field.name}</option>
              ))
            )}
          </select>
          
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
          
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`p-2 rounded-lg transition-colors ${
              autoRefresh ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Real-time Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-green-100">
              <Activity className="w-5 h-5 text-green-600" />
            </div>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor('normal')}`}>
              Normal
            </span>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-600">System Status</p>
            <p className="text-2xl font-bold text-gray-900">All Good</p>
            <p className="text-xs text-gray-500">
              {data.sensors.length} sensors active
              {!selectedField && weatherData?.data?.current && ' (Weather-based)'}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-blue-100">
              <Thermometer className="w-5 h-5 text-blue-600" />
            </div>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor('normal')}`}>
              Normal
            </span>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-600">Temperature</p>
            <p className="text-2xl font-bold text-gray-900">{Math.round(currentWeather.temperature_c)}°C</p>
            <p className="text-xs text-gray-500">Last updated {formatTimestamp(currentWeather.last_updated)}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-purple-100">
              <Droplets className="w-5 h-5 text-purple-600" />
            </div>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor('warning')}`}>
              Warning
            </span>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-600">Soil Moisture</p>
            <p className="text-2xl font-bold text-gray-900">
              {data.sensors.find((s: SensorData) => s.sensor_type === 'soil_moisture')?.value || 
               (weatherData?.data?.current?.humidity ? Math.round(weatherData.data.current.humidity) : 45)}%
            </p>
            <p className="text-xs text-gray-500">Below optimal range</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-orange-100">
              <Sprout className="w-5 h-5 text-orange-600" />
            </div>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor('normal')}`}>
              Good
            </span>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-600">Crop Health</p>
            <p className={`text-2xl font-bold ${getHealthColor(data.plantHealth[0]?.health_score || 87)}`}>
              {data.plantHealth[0]?.health_score || 87}%
            </p>
            <p className="text-xs text-gray-500">Excellent condition</p>
          </div>
        </div>
      </div>

      {/* Sensor Data Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Sensor Data</h3>
              <p className="text-sm text-gray-600">Real-time sensor readings from the field</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Download className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className={`grid gap-4 ${
            viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
          }`}>
            {data.sensors.map((sensor: any) => (
              <div key={sensor.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getSensorIcon(sensor.sensor_type)}
                    <div>
                      <h4 className="font-medium text-gray-900 capitalize">
                        {sensor.sensor_type.replace('_', ' ')}
                      </h4>
                      <p className="text-sm text-gray-600">{sensor.unit}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(sensor.status)}`}>
                    {sensor.status}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-gray-900">{sensor.value}</span>
                    <span className="text-sm text-gray-500">{sensor.unit}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Last updated</span>
                    <span>{formatTimestamp(sensor.timestamp)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weather and Plant Health */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Weather Data */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Weather Conditions</h3>
                <p className="text-sm text-gray-600">Current environmental data</p>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-gray-600">Real-time</span>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {data.weather.length > 0 ? (
              <div className="space-y-6">
                {/* Main Weather Display */}
                <div className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="p-4 bg-blue-50 rounded-full">
                      {getEnhancedWeatherIcon(data.weather[0].condition?.text || 'sunny', data.weather[0].temperature_c)}
                    </div>
                  </div>
                  <p className="text-4xl font-bold text-gray-900 mb-2">{data.weather[0].temperature_c}°C</p>
                  <p className="text-lg text-gray-600 capitalize">{data.weather[0].condition?.text || 'Clear'}</p>
                </div>
                
                {/* Weather Metrics Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 text-center">
                    <div className="flex justify-center mb-2">
                      <Thermometer className="w-6 h-6 text-orange-500" />
                    </div>
                    <p className="text-xl font-bold text-gray-900">{data.weather[0].temperature_c}°C</p>
                    <p className="text-xs text-gray-600">Temperature</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 text-center">
                    <div className="flex justify-center mb-2">
                      <Droplets className="w-6 h-6 text-blue-500" />
                    </div>
                    <p className="text-xl font-bold text-gray-900">{Math.round(data.weather[0].humidity)}%</p>
                    <p className="text-xs text-gray-600">Humidity</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 text-center">
                    <div className="flex justify-center mb-2">
                      <Wind className="w-6 h-6 text-gray-500" />
                    </div>
                    <p className="text-xl font-bold text-gray-900">{data.weather[0].wind_kph} km/h</p>
                    <p className="text-xs text-gray-600">Wind Speed</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-4 text-center">
                    <div className="flex justify-center mb-2">
                      <Cloud className="w-6 h-6 text-indigo-500" />
                    </div>
                    <p className="text-xl font-bold text-gray-900">{data.weather[0].precip_mm} mm</p>
                    <p className="text-xs text-gray-600">Rainfall</p>
                  </div>
                </div>
                
                <div className="text-center text-xs text-gray-500 bg-gray-50 rounded-lg py-2">
                  Last updated: {formatTimestamp(data.weather[0].last_updated)}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Cloud className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No weather data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Plant Health */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Plant Health</h3>
                <p className="text-sm text-gray-600">Crop health and disease detection</p>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Camera className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {data.plantHealth.length > 0 ? (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sprout className="w-10 h-10 text-green-600" />
                  </div>
                  <p className={`text-3xl font-bold ${getHealthColor(data.plantHealth[0].health_score)}`}>
                    {data.plantHealth[0].health_score}%
                  </p>
                  <p className="text-sm text-gray-600">Health Score</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Disease Detected</span>
                    <span className="text-sm font-medium text-gray-900">
                      {data.plantHealth[0].disease_detected || 'None'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Pest Infestation</span>
                    <span className="text-sm font-medium text-gray-900">
                      {data.plantHealth[0].pest_infestation || 'None'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Nutrient Deficiency</span>
                    <span className="text-sm font-medium text-gray-900">
                      {data.plantHealth[0].nutrient_deficiency || 'None'}
                    </span>
                  </div>
                </div>
                
                <div className="text-center text-xs text-gray-500">
                  Last updated: {formatTimestamp(data.plantHealth[0].timestamp)}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Sprout className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No plant health data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alerts and Notifications */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Alerts</h3>
          <p className="text-sm text-gray-600">System notifications and warnings</p>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex space-x-3">
              <div className="flex-shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Low soil moisture detected</p>
                <p className="text-sm text-gray-600 mt-1">
                  Field A-3 soil moisture is at 45%, below optimal range. Consider irrigation.
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <span className="text-xs text-gray-500">2 hours ago</span>
                  <span className="text-xs text-gray-400">Field A-3</span>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <div className="flex-shrink-0 mt-0.5">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">System check completed</p>
                <p className="text-sm text-gray-600 mt-1">
                  All sensors are functioning normally. No issues detected.
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <span className="text-xs text-gray-500">1 hour ago</span>
                  <span className="text-xs text-gray-400">System</span>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <div className="flex-shrink-0 mt-0.5">
                <Info className="w-5 h-5 text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Weather forecast update</p>
                <p className="text-sm text-gray-600 mt-1">
                  Rain expected in the next 48 hours. Adjust irrigation schedule accordingly.
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <span className="text-xs text-gray-500">3 hours ago</span>
                  <span className="text-xs text-gray-400">Weather</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Monitoring; 