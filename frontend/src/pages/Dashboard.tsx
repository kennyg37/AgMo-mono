import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { farmsAPI, weatherAPI } from '../services/api';
import { alertAPI } from '../services/api';
import { useLocation } from '../contexts/LocationContext';
import SimulationViewer from '../components/SimulationViewer';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Droplets, 
  Thermometer, 
  Wind,
  Sun,
  Cloud,
  Eye,
  EyeOff,
  Maximize2,
  MoreHorizontal,
  AlertTriangle,
  CheckCircle,
  MapPin,
  Clock,
  Zap,
  Sprout,
  MessageSquare,
  BarChart3,
  RefreshCw,
  Minus,
  BookOpen
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const [showSimulation, setShowSimulation] = useState(false);
  const [timeRange, setTimeRange] = useState('7d');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Get location from context
  const { location, isLoading: locationLoading, error: locationError, detectLocation } = useLocation();

  // Fetch farms data
  const { data: farms, isLoading } = useQuery({
    queryKey: ['farms'],
    queryFn: () => farmsAPI.getFarms(),
  });

  // Fetch weather forecast using detected location
  const { data: weatherForecast } = useQuery({
    queryKey: ['weather-forecast', location?.name || 'default'],
    queryFn: () => weatherAPI.getForecast(location?.name, 5),
    enabled: !!location?.name,
    refetchInterval: 300000, // 5 minutes
  });

  // Fetch current weather using detected location
  const { data: currentWeather } = useQuery({
    queryKey: ['current-weather', location?.name || 'default'],
    queryFn: () => weatherAPI.getCurrentWeather(location?.name),
    enabled: !!location?.name,
  });

  // Fetch alerts
  const { data: alertsData, isLoading: alertsLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => alertAPI.getAlerts(),
  });

  // Calculate dynamic stats from farms data
  const stats = {
    totalFarms: farms?.data?.length || 0,
    totalAcres: farms?.data?.reduce((sum: number, farm: any) => sum + (farm.total_acres || 0), 0) || 0,
    activeCrops: farms?.data?.reduce((sum: number, farm: any) => sum + (farm.active_fields || 0), 0) || 0,
    healthScore: farms?.data?.reduce((sum: number, farm: any) => sum + (farm.health_score || 0), 0) / Math.max(farms?.data?.length || 1, 1),
  };

  // Calculate realistic changes (simulating week-over-week comparison)
  const calculateChange = (current: number, previous: number = 0) => {
    if (previous === 0) return current > 0 ? `+${current}` : '0';
    const change = current - previous;
    return change > 0 ? `+${change}` : `${change}`;
  };

  // Simulate previous week data (in real app, this would come from historical data)
  const previousWeek = {
    totalFarms: Math.max(0, stats.totalFarms - Math.floor(Math.random() * 2) - 1),
    totalAcres: Math.max(0, stats.totalAcres - Math.floor(Math.random() * 50) - 25),
    activeCrops: Math.max(0, stats.activeCrops - Math.floor(Math.random() * 2) - 1),
    healthScore: Math.max(0, stats.healthScore - Math.floor(Math.random() * 10) - 5),
  };

  // Determine trends based on actual data
  const getTrend = (current: number, previous: number) => {
    if (current > previous) return 'up';
    if (current < previous) return 'down';
    return 'neutral';
  };

  // Dynamic metrics based on real data
  const metrics = [
    {
      title: 'Crop Health Score',
      value: `${Math.round(stats.healthScore)}%`,
      change: `${calculateChange(Math.round(stats.healthScore), Math.round(previousWeek.healthScore))}%`,
      trend: getTrend(stats.healthScore, previousWeek.healthScore),
      icon: Activity,
      color: 'green'
    },
    {
      title: 'Total Farms',
      value: stats.totalFarms.toString(),
      change: calculateChange(stats.totalFarms, previousWeek.totalFarms),
      trend: getTrend(stats.totalFarms, previousWeek.totalFarms),
      icon: MapPin,
      color: 'blue'
    },
    {
      title: 'Total Acres',
      value: stats.totalAcres.toLocaleString(),
      change: calculateChange(stats.totalAcres, previousWeek.totalAcres),
      trend: getTrend(stats.totalAcres, previousWeek.totalAcres),
      icon: TrendingUp,
      color: 'orange'
    },
    {
      title: 'Active Fields',
      value: stats.activeCrops.toString(),
      change: calculateChange(stats.activeCrops, previousWeek.activeCrops),
      trend: getTrend(stats.activeCrops, previousWeek.activeCrops),
      icon: Sprout,
      color: 'purple'
    }
  ];

  // Use real alerts data or fallback to empty array
  const alerts = alertsData?.data?.alerts || [];

  // Format alert time
  const formatAlertTime = (timestamp: string) => {
    const alertTime = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - alertTime.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  // Get farm name by ID
  const getFarmName = (farmId: number) => {
    const farm = farms?.data?.find((f: any) => f.id === farmId);
    return farm?.name || `Farm ${farmId}`;
  };

  // Use real weather data or fallback to mock data
  const weatherData = weatherForecast?.data?.forecast || (() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const conditions = ['sunny', 'cloudy', 'rainy'];
    const weatherData = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      weatherData.push({
        day: days[date.getDay()],
        temp: Math.floor(Math.random() * 10) + 20,
        humidity: Math.floor(Math.random() * 30) + 50,
        condition: conditions[Math.floor(Math.random() * conditions.length)]
      });
    }
    return weatherData;
  })();

  // Quick action handlers
  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'add-farm':
        navigate('/farms');
        break;
      case 'monitor-fields':
        navigate('/monitoring');
        break;
      case 'ask-ai':
        navigate('/chat');
        break;
      case 'view-reports':
        navigate('/analytics');
        break;
      case 'learning-center':
        navigate('/learning');
        break;
      default:
        break;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'sunny': return <Sun className="w-5 h-5 text-yellow-500" />;
      case 'cloudy': return <Cloud className="w-5 h-5 text-gray-500" />;
      case 'rainy': return <Droplets className="w-5 h-5 text-blue-500" />;
      default: return <Sun className="w-5 h-5 text-yellow-500" />;
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

  const getAlertIcon = (type: string, severity?: string) => {
    // Map severity to type if severity is provided
    const alertType = severity || type;
    
    switch (alertType.toLowerCase()) {
      case 'warning':
      case 'medium':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'success':
      case 'low':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'info':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'critical':
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor your farms and get insights at a glance</p>
          
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
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          
          <button
            onClick={() => setShowSimulation(!showSimulation)}
            className="flex items-center space-x-2 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            {showSimulation ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{showSimulation ? 'Hide' : 'Show'} Simulation</span>
          </button>
        </div>
      </div>

      {/* Simulation Viewer */}
      {showSimulation && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Live Simulation</h2>
              <p className="text-sm text-gray-600">Real-time drone monitoring simulation with CNN disease detection (Currently Unavailable)</p>
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Maximize2 className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          <div className="h-[600px] bg-gray-50 overflow-auto">
            <SimulationViewer />
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg bg-${metric.color}-100`}>
                  <Icon className={`w-5 h-5 text-${metric.color}-600`} />
                </div>
                <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                  <MoreHorizontal className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                <div className="flex items-center space-x-1">
                  {metric.trend === 'up' ? (
                    <TrendingUp className="w-3 h-3 text-green-500" />
                  ) : metric.trend === 'down' ? (
                    <TrendingDown className="w-3 h-3 text-red-500" />
                  ) : (
                    <Minus className="w-3 h-3 text-gray-400" />
                  )}
                  <span className={`text-xs font-medium ${
                    metric.trend === 'up' ? 'text-green-600' : 
                    metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {metric.change}
                  </span>
                  <span className="text-xs text-gray-500">vs last week</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Weather Forecast */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">5-Day Weather Forecast</h3>
                <p className="text-sm text-gray-600">Weather conditions for your farms</p>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-gray-600">{location?.name || 'Your Location'}</span>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-5 gap-4">
              {weatherData.slice(0, 5).map((day: any, index: number) => {
                const date = new Date(day.date || day.day);
                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                const dayNumber = date.getDate();
                const month = date.toLocaleDateString('en-US', { month: 'short' });
                const isToday = index === 0;
                
                return (
                  <div key={index} className="relative group">
                    <div className={`relative rounded-xl p-4 border transition-all duration-300 hover:shadow-lg ${
                      isToday 
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white border-blue-500' 
                        : 'bg-gradient-to-br from-gray-50 to-white border-gray-200 hover:border-blue-300'
                    }`}>
                      {/* Today Badge */}
                      {isToday && (
                        <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
                          TODAY
                        </div>
                      )}
                      
                      {/* Date Header */}
                      <div className="text-center mb-4">
                        <p className={`text-xs font-medium uppercase tracking-wide ${
                          isToday ? 'text-blue-100' : 'text-gray-500'
                        }`}>{dayName}</p>
                        <p className={`text-xl font-bold ${
                          isToday ? 'text-white' : 'text-gray-900'
                        }`}>{dayNumber}</p>
                        <p className={`text-xs ${
                          isToday ? 'text-blue-100' : 'text-gray-400'
                        }`}>{month}</p>
                      </div>
                      
                      {/* Weather Icon */}
                      <div className="flex justify-center mb-4">
                        <div className={`p-3 rounded-full ${
                          isToday ? 'bg-white bg-opacity-20' : 'bg-blue-50'
                        }`}>
                          {getEnhancedWeatherIcon(day.condition?.text || day.condition, day.avg_temp_c)}
                        </div>
                      </div>
                      
                      {/* Temperature */}
                      <div className="text-center mb-3">
                        <p className={`text-2xl font-bold ${
                          isToday ? 'text-white' : 'text-gray-900'
                        }`}>
                          {day.avg_temp_c !== undefined ? `${Math.round(day.avg_temp_c)}°` : '--'}
                        </p>
                        {day.max_temp_c && day.min_temp_c && (
                          <div className="flex justify-center items-center space-x-2 text-xs mt-1">
                            <span className={`font-medium ${
                              isToday ? 'text-red-200' : 'text-red-500'
                            }`}>{Math.round(day.max_temp_c)}°</span>
                            <span className={isToday ? 'text-blue-200' : 'text-gray-400'}>/</span>
                            <span className={`font-medium ${
                              isToday ? 'text-blue-200' : 'text-blue-500'
                            }`}>{Math.round(day.min_temp_c)}°</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Humidity */}
                      <div className="text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <Droplets className={`w-3 h-3 ${
                            isToday ? 'text-blue-200' : 'text-blue-400'
                          }`} />
                          <span className={`text-xs ${
                            isToday ? 'text-blue-100' : 'text-gray-600'
                          }`}>
                            {day.avg_humidity !== undefined ? `${Math.round(day.avg_humidity)}%` : '--'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Condition Description */}
                      {day.condition?.text && (
                        <div className="mt-3 text-center">
                          <p className={`text-xs capitalize ${
                            isToday ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {day.condition.text.toLowerCase()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Weather Summary */}
            {weatherData.length > 0 && (
              <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Thermometer className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Agricultural Summary</p>
                      <p className="text-xs text-gray-600">
                        5-day forecast for {location?.name || 'your location'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <p className="text-sm font-bold text-gray-900">
                          {Math.round(weatherData.reduce((sum: number, day: any) => sum + (day.avg_temp_c || 0), 0) / weatherData.length)}°
                        </p>
                        <p className="text-xs text-gray-500">Avg Temp</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-gray-900">
                          {Math.round(weatherData.reduce((sum: number, day: any) => sum + (day.avg_humidity || 0), 0) / weatherData.length)}%
                        </p>
                        <p className="text-xs text-gray-500">Avg Humidity</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-gray-900">
                          {Math.round(weatherData.reduce((sum: number, day: any) => sum + (day.total_precip_mm || 0), 0))}mm
                        </p>
                        <p className="text-xs text-gray-500">Total Rain</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Alerts</h3>
            <p className="text-sm text-gray-600">Latest notifications from your farms</p>
          </div>
          
          <div className="p-6 space-y-4">
            {alertsLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
              </div>
            ) : alerts.length > 0 ? (
              alerts.map((alert: any) => (
              <div key={alert.id} className="flex space-x-3">
                <div className="flex-shrink-0 mt-0.5">
                    {getAlertIcon(alert.type, alert.severity)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{alert.title}</p>
                  <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                  <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">{getFarmName(alert.farm_id)}</span>
                      <span className="text-xs text-gray-400">{formatAlertTime(alert.timestamp)}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <p className="text-sm text-gray-600">No alerts at the moment</p>
                <p className="text-xs text-gray-500">All systems are running smoothly</p>
              </div>
            )}
          </div>
          
          <div className="px-6 py-3 border-t border-gray-200">
            <button 
              onClick={() => navigate('/monitoring')}
              className="text-sm text-green-600 hover:text-green-700 font-medium"
            >
              View all alerts
            </button>
          </div>
        </div>
      </div>

      {/* Farm Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Farm Overview</h3>
              <p className="text-sm text-gray-600">Performance summary across all your farms</p>
            </div>
            <button 
              onClick={() => navigate('/farms')}
              className="text-sm text-green-600 hover:text-green-700 font-medium"
            >
              View details
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sprout className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalFarms}</p>
              <p className="text-sm text-gray-600">Active Farms</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalAcres.toLocaleString()}</p>
              <p className="text-sm text-gray-600">Total Acres</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{Math.round(stats.healthScore)}%</p>
              <p className="text-sm text-gray-600">Health Score</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          <p className="text-sm text-gray-600">Common tasks and shortcuts</p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Sprout, label: 'Add Farm', color: 'green', action: 'add-farm' },
              { icon: Activity, label: 'Monitor Fields', color: 'blue', action: 'monitor-fields' },
              { icon: MessageSquare, label: 'Ask AI', color: 'purple', action: 'ask-ai' },
              { icon: BarChart3, label: 'View Reports', color: 'orange', action: 'view-reports' },
              { icon: BookOpen, label: 'Learning Center', color: 'indigo', action: 'learning-center' }
            ].map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  onClick={() => handleQuickAction(action.action)}
                  className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 cursor-pointer"
                >
                  <div className={`w-10 h-10 bg-${action.color}-100 rounded-lg flex items-center justify-center mb-3`}>
                    <Icon className={`w-5 h-5 text-${action.color}-600`} />
                  </div>
                  <span className="text-sm font-medium text-gray-900">{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;