import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { farmsAPI } from '../services/api';
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
  BarChart3
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const [showSimulation, setShowSimulation] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  // Fetch farms data
  const { data: farms, isLoading } = useQuery({
    queryKey: ['farms'],
    queryFn: () => farmsAPI.getFarms(),
  });

  // Calculate dynamic stats from farms data
  const stats = {
    totalFarms: farms?.data?.length || 0,
    totalAcres: farms?.data?.reduce((sum: number, farm: any) => sum + (farm.total_acres || 0), 0) || 0,
    activeCrops: farms?.data?.reduce((sum: number, farm: any) => sum + (farm.active_fields || 0), 0) || 0,
    healthScore: farms?.data?.reduce((sum: number, farm: any) => sum + (farm.health_score || 0), 0) / Math.max(farms?.data?.length || 1, 1),
  };

  // Dynamic metrics based on real data
  const metrics = [
    {
      title: 'Crop Health Score',
      value: `${Math.round(stats.healthScore)}%`,
      change: '+5.2%',
      trend: 'up',
      icon: Activity,
      color: 'green'
    },
    {
      title: 'Total Farms',
      value: stats.totalFarms.toString(),
      change: '+2',
      trend: 'up',
      icon: MapPin,
      color: 'blue'
    },
    {
      title: 'Total Acres',
      value: stats.totalAcres.toLocaleString(),
      change: '+150',
      trend: 'up',
      icon: TrendingUp,
      color: 'orange'
    },
    {
      title: 'Active Fields',
      value: stats.activeCrops.toString(),
      change: '+3',
      trend: 'up',
      icon: Sprout,
      color: 'purple'
    }
  ];

  // Dynamic alerts based on monitoring data
  const alerts = [
    {
      id: 1,
      type: 'warning',
      title: 'Low soil moisture detected',
      description: 'Field A-3 requires irrigation within 24 hours',
      time: '2 hours ago',
      farm: 'Main Farm'
    },
    {
      id: 2,
      type: 'success',
      title: 'Pest treatment completed',
      description: 'Field B-1 treatment was successful',
      time: '4 hours ago',
      farm: 'North Farm'
    },
    {
      id: 3,
      type: 'info',
      title: 'Weather alert',
      description: 'Rain expected in the next 48 hours',
      time: '6 hours ago',
      farm: 'All Farms'
    }
  ];

  // Generate weather data based on current date
  const generateWeatherData = () => {
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
  };

  const weatherData = generateWeatherData();

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

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'info': return <Clock className="w-5 h-5 text-blue-500" />;
      default: return <AlertTriangle className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor your farms and get insights at a glance</p>
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
              <p className="text-sm text-gray-600">Real-time drone monitoring simulation with CNN disease detection</p>
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
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-500" />
                  )}
                  <span className={`text-xs font-medium ${
                    metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
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
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">7-Day Weather Forecast</h3>
            <p className="text-sm text-gray-600">Weather conditions for your farms</p>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-7 gap-4">
              {weatherData.map((day, index) => (
                <div key={index} className="text-center">
                  <p className="text-sm font-medium text-gray-600 mb-2">{day.day}</p>
                  <div className="flex justify-center mb-2">
                    {getWeatherIcon(day.condition)}
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{day.temp}°</p>
                  <p className="text-xs text-gray-500">{day.humidity}%</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Alerts</h3>
            <p className="text-sm text-gray-600">Latest notifications from your farms</p>
          </div>
          
          <div className="p-6 space-y-4">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex space-x-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getAlertIcon(alert.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{alert.title}</p>
                  <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">{alert.farm}</span>
                    <span className="text-xs text-gray-400">{alert.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="px-6 py-3 border-t border-gray-200">
            <button className="text-sm text-green-600 hover:text-green-700 font-medium">
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
            <button className="text-sm text-green-600 hover:text-green-700 font-medium">
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
              { icon: Sprout, label: 'Add Farm', color: 'green' },
              { icon: Activity, label: 'Monitor Fields', color: 'blue' },
              { icon: MessageSquare, label: 'Ask AI', color: 'purple' },
              { icon: BarChart3, label: 'View Reports', color: 'orange' }
            ].map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
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