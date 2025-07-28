import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
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
  PieChart,
  History,
  Bug,
  Shield,
  Bell,
  BellOff,
  Database,
  Wifi,
  WifiOff,
  Battery,
  BatteryCharging,
  AlertCircle,
  CheckSquare,
  XCircle,
  HelpCircle,
  FileText,
  Users,
  Globe,
  ShieldCheck,
  Heart,
  HeartOff,
  Leaf
} from 'lucide-react';
import { monitoringAPI, farmsAPI, weatherAPI, alertAPI } from '../services/api';
import { useLocation } from '../contexts/LocationContext';
import { alertHistoryService, AlertHistory as AlertHistoryType } from '../services/alertHistoryService';

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

interface SystemStatus {
  overall: 'healthy' | 'warning' | 'critical';
  sensors: number;
  activeAlerts: number;
  lastUpdate: string;
  uptime: string;
}

const Monitoring: React.FC = () => {
  const [selectedField, setSelectedField] = useState<number | null>(null);
  const [timeRange, setTimeRange] = useState('24h');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedSensor, setSelectedSensor] = useState<string | null>(null);
  const [showAlerts, setShowAlerts] = useState(true);
  const [alertFilter, setAlertFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
  const { t } = useTranslation();

  // Get location from context
  const { location, isLoading: locationLoading, error: locationError, detectLocation } = useLocation();

  // Fetch farms for selection
  const { data: farms } = useQuery({
    queryKey: ['farms'],
    queryFn: () => farmsAPI.getFarms(),
  });

  // Fetch sensor data
  const { data: sensorData, isLoading: sensorLoading } = useQuery({
    queryKey: ['sensor-data', selectedField, timeRange],
    queryFn: () => selectedField ? monitoringAPI.getSensorData(selectedField, undefined, timeRange === '24h' ? 24 : 168) : null,
    enabled: !!selectedField,
    refetchInterval: autoRefresh ? 30000 : false, // Refresh every 30 seconds if auto-refresh is on
  });

  // Fetch weather data using detected location
  const { data: weatherData, isLoading: weatherLoading } = useQuery({
    queryKey: ['weather-data', location?.name || 'default'],
    queryFn: () => weatherAPI.getCurrentWeather(location?.name),
    enabled: !!location?.name,
    refetchInterval: autoRefresh ? 60000 : false, // Refresh every minute
  });

  // Fetch plant health data
  const { data: plantHealthData, isLoading: healthLoading } = useQuery({
    queryKey: ['plant-health', selectedField, timeRange],
    queryFn: () => selectedField ? monitoringAPI.getPlantHealth(selectedField, timeRange === '24h' ? 1 : 30) : null,
    enabled: !!selectedField,
    refetchInterval: autoRefresh ? 120000 : false, // Refresh every 2 minutes
  });

  // Fetch alerts using alertHistoryService (same as Dashboard)
  const { data: alertsData, isLoading: alertsLoading } = useQuery({
    queryKey: ['alerts', selectedField, alertFilter],
    queryFn: async () => {
      console.log('🔍 [Monitoring] Starting to fetch alerts...');
      
      try {
        // Get alerts from disease detection history (this works)
        console.log('🔍 [Monitoring] Fetching disease alerts...');
        const diseaseResponse = await fetch('/api/disease-history/public-history?limit=20&only_sick=true');
        console.log('🔍 [Monitoring] Disease response status:', diseaseResponse.status);
        const diseaseAlerts = await diseaseResponse.json();
        console.log('🔍 [Monitoring] Disease alerts count:', diseaseAlerts.length);
        console.log('🔍 [Monitoring] Disease alerts sample:', diseaseAlerts.slice(0, 2));
        
        // Get alerts from sessions (this works)
        console.log('🔍 [Monitoring] Fetching session alerts...');
        const sessionResponse = await fetch('/api/sessions/plant-detection?limit=20');
        console.log('🔍 [Monitoring] Session response status:', sessionResponse.status);
        const sessionAlerts = await sessionResponse.json();
        console.log('🔍 [Monitoring] Session alerts count:', sessionAlerts.length);
        console.log('🔍 [Monitoring] Session alerts sample:', sessionAlerts.slice(0, 2));
        
        // Get main alerts (this works)
        console.log('🔍 [Monitoring] Fetching main alerts...');
        const mainAlerts = await alertAPI.getAlerts(selectedField || undefined, alertFilter === 'all' ? undefined : alertFilter, 20);
        console.log('🔍 [Monitoring] Main alerts response:', mainAlerts);
        console.log('🔍 [Monitoring] Main alerts type:', typeof mainAlerts);
        console.log('🔍 [Monitoring] Main alerts keys:', mainAlerts ? Object.keys(mainAlerts) : 'null/undefined');
        console.log('🔍 [Monitoring] Main alerts.data:', mainAlerts?.data);
        console.log('🔍 [Monitoring] Main alerts.data type:', typeof mainAlerts?.data);
        console.log('🔍 [Monitoring] Main alerts.data length:', Array.isArray(mainAlerts?.data) ? mainAlerts.data.length : 'not array');
        
        // Combine and format all alerts
        const allAlerts = [
          // Disease detection alerts - only show unhealthy detections
          ...diseaseAlerts
            .filter((alert: any) => alert.disease_type !== 'healthy' && alert.is_sick === true)
            .map((alert: any) => ({
              id: `disease_${alert.id}`,
              title: `${alert.disease_type} Detected`,
              message: `${alert.disease_type} detected with ${(alert.confidence * 100).toFixed(1)}% confidence`,
              severity: alert.confidence > 0.8 ? 'critical' : alert.confidence > 0.6 ? 'high' : 'medium',
              timestamp: alert.detected_at,
              field_id: alert.field_id,
              source: 'disease_detection'
            })),
          // Session alerts
          ...sessionAlerts
            .filter((alert: any) => alert.health_status === 'diseased' || alert.health_status === 'unhealthy')
            .map((alert: any) => ({
              id: `session_${alert.id}`,
              title: `Plant Health Alert`,
              message: `${alert.label} detected in session`,
              severity: 'high',
              timestamp: alert.detected_at,
              field_id: alert.field_id,
              source: 'session'
            })),
          // Main alerts
          ...(() => {
            let mainAlertsArray = [];
            if (Array.isArray(mainAlerts)) {
              mainAlertsArray = mainAlerts;
            } else if (mainAlerts?.data && Array.isArray(mainAlerts.data)) {
              mainAlertsArray = mainAlerts.data;
            } else if (mainAlerts && typeof mainAlerts === 'object' && 'alerts' in mainAlerts && Array.isArray((mainAlerts as any).alerts)) {
              mainAlertsArray = (mainAlerts as any).alerts;
            } else if (mainAlerts && typeof mainAlerts === 'object') {
              // If it's an object with alert properties, treat it as a single alert
              mainAlertsArray = [mainAlerts];
            }
            console.log('🔍 [Monitoring] Main alerts array to map:', mainAlertsArray);
            return mainAlertsArray
              .filter((alert: any) => alert.title || alert.message || alert.description) // Only include alerts with actual content
              .map((alert: any) => ({
                id: `main_${alert.id || alert.alert_id || Date.now()}`,
                title: alert.title || alert.message || 'System Alert',
                message: alert.message || alert.description || 'System notification',
                severity: alert.severity || alert.level || 'medium',
                timestamp: alert.timestamp || alert.created_at || new Date().toISOString(),
                field_id: alert.field_id || alert.fieldId,
                source: 'main'
              }));
          })()
        ];
        
        console.log('🔍 [Monitoring] Combined alerts count:', allAlerts.length);
        console.log('🔍 [Monitoring] Combined alerts sample:', allAlerts.slice(0, 3));
        
        // Sort by timestamp (newest first) and filter by severity if needed
        const filteredAlerts = allAlerts
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .filter((alert: any) => {
            if (alertFilter === 'all') return true;
            return alert.severity === alertFilter;
          });
        
        console.log('🔍 [Monitoring] Final filtered alerts count:', filteredAlerts.length);
        console.log('🔍 [Monitoring] Final alerts:', filteredAlerts);
        
        return filteredAlerts;
      } catch (error) {
        console.error('❌ [Monitoring] Error fetching alerts:', error);
        return [];
      }
    },
    refetchInterval: autoRefresh ? 45000 : false, // Refresh every 45 seconds
  });

  // Fetch disease detection history
  const { data: diseaseHistory, isLoading: diseaseLoading, refetch: refetchDiseaseHistory } = useQuery({
    queryKey: ['disease-history', selectedField],
    queryFn: () => fetch(`/api/disease-history/public-history?field_id=${selectedField || ''}&limit=10&only_sick=true`).then(res => res.json()),
    enabled: !!selectedField,
    refetchInterval: autoRefresh ? 60000 : false, // Refresh every minute
  });

  // Fetch system status
  const { data: systemStatus, isLoading: systemLoading } = useQuery({
    queryKey: ['system-status'],
    queryFn: () => fetch('/api/system/status').then(res => res.json()).catch(() => ({
      overall: 'healthy',
      sensors: sensorData?.data?.length || 0,
      activeAlerts: Array.isArray(alertsData) ? alertsData.length : 0,
      lastUpdate: new Date().toISOString(),
      uptime: '24h 30m'
    })),
    refetchInterval: autoRefresh ? 30000 : false,
  });

  // Fetch alert history for comprehensive monitoring
  // Note: alertHistoryService is temporarily disabled due to API endpoint requirements
  // const { data: alertHistory, isLoading: alertHistoryLoading } = useQuery({
  //   queryKey: ['alert-history', selectedField],
  //   queryFn: () => alertHistoryService.getAlertHistory(20),
  //   refetchInterval: autoRefresh ? 30000 : false,
  // });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
      case 'healthy':
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
      if (temperature !== undefined) {
        if (temperature > 25) {
          return <Sun className="w-8 h-8 text-yellow-500" />;
        } else if (temperature < 10) {
          return <Cloud className="w-8 h-8 text-gray-500" />;
        } else {
          return <Cloud className="w-8 h-8 text-blue-400" />;
        }
      }
      return <Sun className="w-8 h-8 text-yellow-500" />;
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthIcon = (score: number) => {
    if (score >= 80) return <Heart className="w-5 h-5 text-green-600" />;
    if (score >= 60) return <Heart className="w-5 h-5 text-yellow-600" />;
    return <HeartOff className="w-5 h-5 text-red-600" />;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays}d ago`;
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes}m ago`;
    } else {
      return 'Just now';
    }
  };

  const getAlertIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case 'medium':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'low':
        return <Info className="w-5 h-5 text-blue-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getDiseaseIcon = (diseaseType: string) => {
    switch (diseaseType.toLowerCase()) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'blight':
        return <Bug className="w-5 h-5 text-red-600" />;
      case 'common rust':
        return <Bug className="w-5 h-5 text-orange-600" />;
      case 'gray leaf spot':
        return <Bug className="w-5 h-5 text-purple-600" />;
      default:
        return <Bug className="w-5 h-5 text-gray-600" />;
    }
  };

  // Calculate system status
  const currentSystemStatus: SystemStatus = {
    overall: systemStatus?.overall || 'healthy',
    sensors: sensorData?.data?.length || 0,
          activeAlerts: Array.isArray(alertsData) ? alertsData.length : 0,
    lastUpdate: systemStatus?.lastUpdate || new Date().toISOString(),
    uptime: systemStatus?.uptime || '24h 30m'
  };

  // Get current weather data
  const currentWeather = weatherData?.data?.current ? {
    temperature_c: weatherData.data.current.temperature_c || 0,
    humidity: weatherData.data.current.humidity || 0,
    wind_kph: weatherData.data.current.wind_kph || 0,
    precip_mm: weatherData.data.current.precip_mm || 0,
    pressure_mb: weatherData.data.current.pressure_mb || 0,
    condition: weatherData.data.current.condition || { text: 'Unknown', icon: '' },
    last_updated: weatherData.data.current.last_updated || new Date().toISOString()
  } : null;

  // Get sensor data
  const sensors = sensorData?.data || [];

  // Get plant health data
  const plantHealth = plantHealthData?.data || [];

  // Get alerts
  const alerts = Array.isArray(alertsData) ? alertsData : [];
  console.log('🔍 [Monitoring] alertsData:', alertsData);
  console.log('🔍 [Monitoring] alerts (processed):', alerts);

  // Get disease history
  const diseaseDetections = diseaseHistory || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('monitoring.title')}</h1>
          <p className="text-gray-600">{t('monitoring.subtitle')}</p>
          
          {/* Location Display */}
          <div className="flex items-center space-x-2 mt-2">
            <MapPin className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              {locationLoading ? t('monitoring.location.detecting') : 
               locationError ? t('monitoring.location.unavailable') :
               location?.name || t('monitoring.location.notSet')}
            </span>
            <button
              onClick={detectLocation}
              disabled={locationLoading}
              className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
              title={t('monitoring.location.refresh')}
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
            <option value="">All Fields</option>
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
            title={autoRefresh ? 'Auto-refresh enabled' : 'Auto-refresh disabled'}
          >
            <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Comprehensive Monitoring Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-blue-100">
              <Database className="w-5 h-5 text-blue-600" />
            </div>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(currentSystemStatus.overall)}`}>
              {currentSystemStatus.overall}
            </span>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-600">System Status</p>
            <p className="text-2xl font-bold text-gray-900 capitalize">{currentSystemStatus.overall}</p>
            <p className="text-xs text-gray-500">
              {currentSystemStatus.sensors} sensors active
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-orange-100">
              <Thermometer className="w-5 h-5 text-orange-600" />
            </div>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor('normal')}`}>
              Live
            </span>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-600">Temperature</p>
            <p className="text-2xl font-bold text-gray-900">
              {currentWeather ? Math.round(currentWeather.temperature_c) : '--'}°C
            </p>
            <p className="text-xs text-gray-500">
              {currentWeather ? formatTimestamp(currentWeather.last_updated) : 'No data'}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-purple-100">
              <Droplets className="w-5 h-5 text-purple-600" />
            </div>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor('normal')}`}>
              {sensors.find((s: SensorData) => s.sensor_type === 'soil_moisture')?.status || 'Normal'}
            </span>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-600">Soil Moisture</p>
            <p className="text-2xl font-bold text-gray-900">
              {sensors.find((s: SensorData) => s.sensor_type === 'soil_moisture')?.value || 
               (currentWeather ? Math.round(currentWeather.humidity) : '--')}%
            </p>
            <p className="text-xs text-gray-500">
              {sensors.find((s: SensorData) => s.sensor_type === 'soil_moisture') ? 
               formatTimestamp(sensors.find((s: SensorData) => s.sensor_type === 'soil_moisture')!.timestamp) : 
               'Weather-based'}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-green-100">
              {plantHealth.length > 0 ? getHealthIcon(plantHealth[0].health_score) : <Sprout className="w-5 h-5 text-green-600" />}
            </div>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor('normal')}`}>
              {plantHealth.length > 0 ? (plantHealth[0].health_score >= 80 ? 'Good' : plantHealth[0].health_score >= 60 ? 'Fair' : 'Poor') : 'No Data'}
            </span>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-600">Crop Health</p>
            <p className={`text-2xl font-bold ${plantHealth.length > 0 ? getHealthColor(plantHealth[0].health_score) : 'text-gray-900'}`}>
              {plantHealth.length > 0 ? plantHealth[0].health_score : '--'}%
            </p>
            <p className="text-xs text-gray-500">
              {plantHealth.length > 0 ? formatTimestamp(plantHealth[0].timestamp) : 'No data available'}
            </p>
          </div>
        </div>
      </div>

      {/* Monitoring Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Monitoring Summary</h3>
          <p className="text-sm text-gray-600">Real-time overview of all monitoring systems</p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{sensors.length}</p>
              <p className="text-sm text-gray-600">Active Sensors</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{alerts.length}</p>
              <p className="text-sm text-gray-600">Active Alerts</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Bug className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{diseaseDetections.length}</p>
              <p className="text-sm text-gray-600">Disease Detections</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{currentSystemStatus.uptime}</p>
              <p className="text-sm text-gray-600">System Uptime</p>
            </div>
          </div>
        </div>
      </div>

      {/* Comprehensive Alerts Dashboard */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell className="w-5 h-5 text-red-500" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Monitoring Alerts</h3>
                <p className="text-sm text-gray-600">
                  {alertsLoading ? 'Loading alerts...' : 
                   alerts.length > 0 ? `${alerts.length} active alerts` : 
                   'No active alerts'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <select 
                value={alertFilter}
                onChange={(e) => setAlertFilter(e.target.value as any)}
                className="px-3 py-1 text-sm border border-gray-200 rounded-lg"
              >
                <option value="all">All Alerts</option>
                <option value="critical">Critical</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
              </select>
              <button
                onClick={() => setShowAlerts(!showAlerts)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title={showAlerts ? 'Hide alerts' : 'Show alerts'}
              >
                {showAlerts ? <BellOff className="w-4 h-4 text-gray-500" /> : <Bell className="w-4 h-4 text-gray-500" />}
              </button>
            </div>
          </div>
        </div>
        
        {showAlerts && (
          <div className="p-6">
            {(() => {
              console.log('🔍 [Monitoring] Rendering alerts section...');
              console.log('🔍 [Monitoring] alertsLoading:', alertsLoading);
              console.log('🔍 [Monitoring] alerts:', alerts);
              console.log('🔍 [Monitoring] alerts.length:', alerts.length);
              
              return alertsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                  <span className="ml-3 text-gray-600">Loading alerts...</span>
                </div>
              ) : alerts.length > 0 ? (
                <div className="space-y-4">
                  {alerts.slice(0, 5).map((alert: any) => (
                    <div key={alert.id} className={`flex space-x-3 p-4 rounded-lg border ${
                      alert.severity === 'critical' ? 'bg-red-50 border-red-200' :
                      alert.severity === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                      'bg-blue-50 border-blue-200'
                    }`}>
                      <div className="flex-shrink-0 mt-0.5">
                        {getAlertIcon(alert.severity)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{alert.title}</p>
                        <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className="text-xs text-gray-500">{formatTimestamp(alert.timestamp)}</span>
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(alert.severity)}`}>
                            {alert.severity}
                          </span>
                          {alert.field_id && (
                            <span className="text-xs text-gray-400">Field {alert.field_id}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {alerts.length > 5 && (
                    <div className="text-center pt-4">
                      <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                        View all {alerts.length} alerts
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <p className="text-gray-500">No active alerts</p>
                  <p className="text-sm text-gray-400 mt-1">All systems are operating normally</p>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Sensor Data Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Sensor Data</h3>
              <p className="text-sm text-gray-600">
                {sensorLoading ? 'Loading sensor data...' : 
                 sensors.length > 0 ? `${sensors.length} sensors active` : 
                 'No sensor data available'}
              </p>
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
          {sensorLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
              <span className="ml-3 text-gray-600">Loading sensor data...</span>
            </div>
          ) : sensors.length > 0 ? (
            <div className={`grid gap-4 ${
              viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
            }`}>
              {sensors.map((sensor: any) => (
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
          ) : (
            <div className="text-center py-8">
              <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No sensor data available</p>
              <p className="text-sm text-gray-400 mt-1">Select a field to view sensor data</p>
            </div>
          )}
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
                <p className="text-sm text-gray-600">
                  {weatherLoading ? 'Loading weather data...' : 
                   currentWeather ? 'Current environmental data' : 
                   'No weather data available'}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-gray-600">Real-time</span>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {weatherLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-600">Loading weather data...</span>
              </div>
            ) : currentWeather ? (
              <div className="space-y-6">
                {/* Main Weather Display */}
                <div className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="p-4 bg-blue-50 rounded-full">
                      {getEnhancedWeatherIcon(currentWeather.condition?.text || 'sunny', currentWeather.temperature_c)}
                    </div>
                  </div>
                  <p className="text-4xl font-bold text-gray-900 mb-2">{currentWeather.temperature_c}°C</p>
                  <p className="text-lg text-gray-600 capitalize">{currentWeather.condition?.text || 'Clear'}</p>
                </div>
                
                {/* Weather Metrics Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 text-center">
                    <div className="flex justify-center mb-2">
                      <Thermometer className="w-6 h-6 text-orange-500" />
                    </div>
                    <p className="text-xl font-bold text-gray-900">{currentWeather.temperature_c}°C</p>
                    <p className="text-xs text-gray-600">Temperature</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 text-center">
                    <div className="flex justify-center mb-2">
                      <Droplets className="w-6 h-6 text-blue-500" />
                    </div>
                    <p className="text-xl font-bold text-gray-900">{Math.round(currentWeather.humidity)}%</p>
                    <p className="text-xs text-gray-600">Humidity</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 text-center">
                    <div className="flex justify-center mb-2">
                      <Wind className="w-6 h-6 text-gray-500" />
                    </div>
                    <p className="text-xl font-bold text-gray-900">{currentWeather.wind_kph} km/h</p>
                    <p className="text-xs text-gray-600">Wind Speed</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-4 text-center">
                    <div className="flex justify-center mb-2">
                      <Cloud className="w-6 h-6 text-indigo-500" />
                    </div>
                    <p className="text-xl font-bold text-gray-900">{currentWeather.precip_mm} mm</p>
                    <p className="text-xs text-gray-600">Rainfall</p>
                  </div>
                </div>
                
                <div className="text-center text-xs text-gray-500 bg-gray-50 rounded-lg py-2">
                  Last updated: {formatTimestamp(currentWeather.last_updated)}
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
                <p className="text-sm text-gray-600">
                  {healthLoading ? 'Loading health data...' : 
                   plantHealth.length > 0 ? 'Crop health and disease detection' : 
                   'No health data available'}
                </p>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Camera className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {healthLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                <span className="ml-3 text-gray-600">Loading health data...</span>
              </div>
            ) : plantHealth.length > 0 ? (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    {getHealthIcon(plantHealth[0].health_score)}
                  </div>
                  <p className={`text-3xl font-bold ${getHealthColor(plantHealth[0].health_score)}`}>
                    {plantHealth[0].health_score}%
                  </p>
                  <p className="text-sm text-gray-600">Health Score</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Disease Detected</span>
                    <span className="text-sm font-medium text-gray-900">
                      {plantHealth[0].disease_detected || 'None'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Pest Infestation</span>
                    <span className="text-sm font-medium text-gray-900">
                      {plantHealth[0].pest_infestation || 'None'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Nutrient Deficiency</span>
                    <span className="text-sm font-medium text-gray-900">
                      {plantHealth[0].nutrient_deficiency || 'None'}
                    </span>
                  </div>
                </div>
                
                <div className="text-center text-xs text-gray-500">
                  Last updated: {formatTimestamp(plantHealth[0].timestamp)}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Sprout className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No plant health data available</p>
                <p className="text-sm text-gray-400 mt-1">Select a field to view health data</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Disease Detection History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Disease Detection History</h3>
              <p className="text-sm text-gray-600">
                {diseaseLoading ? 'Loading detection history...' : 
                 diseaseDetections.length > 0 ? `${diseaseDetections.length} recent detections` : 
                 'No detection history available'}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => refetchDiseaseHistory()}
                disabled={diseaseLoading}
                className="flex items-center space-x-1 px-2 py-1 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${diseaseLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              <button
                onClick={() => window.location.href = '/disease-detection'}
                className="flex items-center space-x-2 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <History className="w-4 h-4" />
                <span>View History</span>
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {diseaseLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-600">Loading detection history...</span>
            </div>
          ) : diseaseDetections.length > 0 ? (
            <div className="space-y-4">
              {diseaseDetections.slice(0, 5).map((detection: any) => (
                <div key={detection.id} className="flex space-x-3 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 mt-0.5">
                    {getDiseaseIcon(detection.disease_type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {detection.disease_type} detected
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Confidence: {(detection.confidence * 100).toFixed(1)}% - {detection.description || 'No description available'}
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="text-xs text-gray-500">{formatTimestamp(detection.detected_at)}</span>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        detection.confidence > 0.8 ? 'text-red-600 bg-red-100' :
                        detection.confidence > 0.6 ? 'text-orange-600 bg-orange-100' :
                        'text-yellow-600 bg-yellow-100'
                      }`}>
                        {detection.confidence > 0.8 ? 'High' : detection.confidence > 0.6 ? 'Medium' : 'Low'} Confidence
                      </span>
                      {detection.field_id && (
                        <span className="text-xs text-gray-400">Field {detection.field_id}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Bug className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No disease detection history available</p>
              <p className="text-sm text-gray-400 mt-1">Perform disease detection to see history</p>
            </div>
          )}
        </div>
      </div>

      {/* System Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">System Information</h3>
          <p className="text-sm text-gray-600">Monitoring system status and performance</p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Wifi className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Connection</p>
                  <p className="text-xs text-gray-600">Online</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Battery className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Battery</p>
                  <p className="text-xs text-gray-600">85%</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Uptime</p>
                  <p className="text-xs text-gray-600">{currentSystemStatus.uptime}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Security</p>
                  <p className="text-xs text-gray-600">Protected</p>
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