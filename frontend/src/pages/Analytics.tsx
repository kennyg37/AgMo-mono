import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  TrendingUp, 
  TrendingDown, 
  Filter,
  Download,
  Eye,
  EyeOff,
  Activity,
  Droplets,
  Thermometer,
  Cloud,
  AlertTriangle,
  CheckCircle,
  BarChart3 as BarChartIcon,
  Target,
  DollarSign,
  Clock as ClockIcon,
  Calendar as CalendarIcon
} from 'lucide-react';
import { monitoringAPI, farmsAPI } from '../services/api';
import MaizeDiseasePanel from '../components/MaizeDiseasePanel';
import SimulationViewer from '../components/SimulationViewer';
import { useSimulationStore } from '../store/simulationStore';

interface AnalyticsData {
  cropHealth: {
    healthy: number;
    sick: number;
    unknown: number;
  };
  yieldPrediction: {
    current: number;
    previous: number;
    trend: number;
  };
  waterUsage: {
    current: number;
    previous: number;
    efficiency: number;
  };
  weatherImpact: {
    temperature: number;
    humidity: number;
    rainfall: number;
  };
  costAnalysis: {
    total: number;
    perAcre: number;
    savings: number;
  };
  timeSeriesData: Array<{
    date: string;
    health: number;
    yield: number;
    water: number;
    cost: number;
  }>;
}

const Analytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedFarm, setSelectedFarm] = useState<number | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showSimulation, setShowSimulation] = useState(true);
  
  // Get simulation state for CNN results
  const { isConnected, maizeDiseaseResult } = useSimulationStore();

  // Fetch farms for selection
  const { data: farms } = useQuery({
    queryKey: ['farms'],
    queryFn: () => farmsAPI.getFarms(),
  });

  // Fetch analytics data
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['analytics', timeRange, selectedFarm],
    queryFn: async () => {
      if (selectedFarm) {
        const response = await monitoringAPI.getFieldAnalytics(selectedFarm);
        return response.data;
      }
      // Return mock data for now - replace with actual API call
      return getMockAnalyticsData();
    },
    enabled: !!selectedFarm || timeRange !== '30d',
  });

  const getMockAnalyticsData = (): AnalyticsData => ({
    cropHealth: {
      healthy: 75,
      sick: 15,
      unknown: 10,
    },
    yieldPrediction: {
      current: 94.2,
      previous: 87.8,
      trend: 7.3,
    },
    waterUsage: {
      current: 2340,
      previous: 2670,
      efficiency: 12.4,
    },
    weatherImpact: {
      temperature: 24.5,
      humidity: 68,
      rainfall: 45,
    },
    costAnalysis: {
      total: 45600,
      perAcre: 182.4,
      savings: 12.3,
    },
    timeSeriesData: [
      { date: '2024-01-01', health: 85, yield: 87, water: 2400, cost: 45000 },
      { date: '2024-01-08', health: 82, yield: 89, water: 2350, cost: 44800 },
      { date: '2024-01-15', health: 88, yield: 91, water: 2300, cost: 45200 },
      { date: '2024-01-22', health: 90, yield: 93, water: 2280, cost: 45500 },
      { date: '2024-01-29', health: 87, yield: 94, water: 2340, cost: 45600 },
    ],
  });

  const data = analyticsData || getMockAnalyticsData();

  const getHealthColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendIcon = (trend: number) => {
    return trend > 0 ? (
      <TrendingUp className="w-4 h-4 text-green-500" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-500" />
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Comprehensive insights and performance metrics</p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <select 
            value={selectedFarm || ''}
            onChange={(e) => setSelectedFarm(e.target.value ? Number(e.target.value) : null)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">All Farms</option>
            {farms?.data?.map((farm: any) => (
              <option key={farm.id} value={farm.id}>{farm.name}</option>
            ))}
          </select>
          
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center space-x-2 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{showDetails ? 'Hide' : 'Show'} Details</span>
          </button>
          
          <button
            onClick={() => setShowSimulation(!showSimulation)}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            {showSimulation ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{showSimulation ? 'Hide' : 'Show'} Simulation</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-green-100">
              <Activity className="w-5 h-5 text-green-600" />
            </div>
            <button className="p-1 hover:bg-gray-100 rounded transition-colors">
              <Filter className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-600">Crop Health Score</p>
            <p className={`text-2xl font-bold ${getHealthColor(data.cropHealth.healthy)}`}>
              {data.cropHealth.healthy}%
            </p>
            <div className="flex items-center space-x-1">
              {getTrendIcon(5.2)}
              <span className="text-xs font-medium text-green-600">+5.2%</span>
              <span className="text-xs text-gray-500">vs last period</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-blue-100">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <button className="p-1 hover:bg-gray-100 rounded transition-colors">
              <Filter className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-600">Yield Prediction</p>
            <p className="text-2xl font-bold text-gray-900">{data.yieldPrediction.current}%</p>
            <div className="flex items-center space-x-1">
              {getTrendIcon(data.yieldPrediction.trend)}
              <span className="text-xs font-medium text-green-600">+{data.yieldPrediction.trend}%</span>
              <span className="text-xs text-gray-500">vs last period</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-purple-100">
              <Droplets className="w-5 h-5 text-purple-600" />
            </div>
            <button className="p-1 hover:bg-gray-100 rounded transition-colors">
              <Filter className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-600">Water Efficiency</p>
            <p className="text-2xl font-bold text-gray-900">{data.waterUsage.efficiency}%</p>
            <div className="flex items-center space-x-1">
              {getTrendIcon(data.waterUsage.efficiency)}
              <span className="text-xs font-medium text-green-600">+{data.waterUsage.efficiency}%</span>
              <span className="text-xs text-gray-500">improvement</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-orange-100">
              <DollarSign className="w-5 h-5 text-orange-600" />
            </div>
            <button className="p-1 hover:bg-gray-100 rounded transition-colors">
              <Filter className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-600">Cost Savings</p>
            <p className="text-2xl font-bold text-gray-900">${data.costAnalysis.savings.toFixed(1)}k</p>
            <div className="flex items-center space-x-1">
              {getTrendIcon(data.costAnalysis.savings)}
              <span className="text-xs font-medium text-green-600">+{data.costAnalysis.savings}%</span>
              <span className="text-xs text-gray-500">vs budget</span>
            </div>
          </div>
        </div>
      </div>

      {/* Maize Disease Detection */}
      <MaizeDiseasePanel 
        diseaseResult={maizeDiseaseResult}
        isConnected={isConnected}
      />

      {/* Live Simulation with CNN Overlay */}
      {showSimulation && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Live Simulation with CNN Detection</h2>
              <p className="text-sm text-gray-600">Real-time drone monitoring with AI-powered disease detection</p>
            </div>
          </div>
          <div className="h-[500px] bg-gray-50 overflow-auto">
            <SimulationViewer />
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Crop Health Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Crop Health Distribution</h3>
                <p className="text-sm text-gray-600">Current health status across all fields</p>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Download className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-900">Healthy</span>
                </div>
                <span className="text-sm font-bold text-gray-900">{data.cropHealth.healthy}%</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-900">Sick</span>
                </div>
                <span className="text-sm font-bold text-gray-900">{data.cropHealth.sick}%</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-900">Unknown</span>
                </div>
                <span className="text-sm font-bold text-gray-900">{data.cropHealth.unknown}%</span>
              </div>
            </div>
            
            {/* Progress bars */}
            <div className="mt-4 space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${data.cropHealth.healthy}%` }}></div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-red-500 h-2 rounded-full" style={{ width: `${data.cropHealth.sick}%` }}></div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-gray-500 h-2 rounded-full" style={{ width: `${data.cropHealth.unknown}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Weather Impact */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Weather Impact</h3>
                <p className="text-sm text-gray-600">Environmental factors affecting crops</p>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Download className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <Thermometer className="w-6 h-6 text-orange-500" />
                </div>
                <p className="text-lg font-bold text-gray-900">{data.weatherImpact.temperature}°C</p>
                <p className="text-xs text-gray-500">Temperature</p>
              </div>
              
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <Droplets className="w-6 h-6 text-blue-500" />
                </div>
                <p className="text-lg font-bold text-gray-900">{data.weatherImpact.humidity}%</p>
                <p className="text-xs text-gray-500">Humidity</p>
              </div>
              
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <Cloud className="w-6 h-6 text-gray-500" />
                </div>
                <p className="text-lg font-bold text-gray-900">{data.weatherImpact.rainfall}mm</p>
                <p className="text-xs text-gray-500">Rainfall</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Time Series Data */}
      {showDetails && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Performance Trends</h3>
                <p className="text-sm text-gray-600">Historical data and trends over time</p>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Download className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
          
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 font-medium text-gray-900">Date</th>
                    <th className="text-left py-3 font-medium text-gray-900">Health Score</th>
                    <th className="text-left py-3 font-medium text-gray-900">Yield %</th>
                    <th className="text-left py-3 font-medium text-gray-900">Water Usage (L)</th>
                    <th className="text-left py-3 font-medium text-gray-900">Cost ($)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.timeSeriesData.map((item: any, index: any) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-3 text-gray-600">{new Date(item.date).toLocaleDateString()}</td>
                      <td className="py-3">
                        <span className={`font-medium ${getHealthColor(item.health)}`}>
                          {item.health}%
                        </span>
                      </td>
                      <td className="py-3 font-medium text-gray-900">{item.yield}%</td>
                      <td className="py-3 text-gray-600">{item.water.toLocaleString()}</td>
                      <td className="py-3 text-gray-600">${item.cost.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Insights and Recommendations */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">AI Insights & Recommendations</h3>
          <p className="text-sm text-gray-600">Data-driven recommendations for optimal farming</p>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="flex space-x-3">
            <div className="flex-shrink-0 mt-0.5">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Optimal Irrigation Schedule</p>
              <p className="text-sm text-gray-600 mt-1">
                Based on weather patterns, reduce irrigation frequency by 15% this week to improve water efficiency.
              </p>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <div className="flex-shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Pest Prevention Alert</p>
              <p className="text-sm text-gray-600 mt-1">
                High humidity conditions detected. Consider preventive pest treatment for Field A-3 within 48 hours.
              </p>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <div className="flex-shrink-0 mt-0.5">
              <Target className="w-5 h-5 text-blue-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Yield Optimization</p>
              <p className="text-sm text-gray-600 mt-1">
                Current conditions suggest 8.7% yield improvement potential with optimal fertilization timing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics; 