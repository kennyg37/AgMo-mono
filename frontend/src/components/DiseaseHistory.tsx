import React, { useState, useEffect } from 'react';
import { 
  History, 
  Calendar, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Filter,
  Download,
  RefreshCw,
  BarChart3,
  Clock
} from 'lucide-react';
import api from '../services/api';

interface DiseaseHistoryRecord {
  id: number;
  field_id?: number;
  user_id: number;
  disease_type: string;
  confidence: number;
  is_sick: boolean;
  description: string;
  model_type: string;
  model_version: string;
  image_filename?: string;
  image_size?: number;
  image_dimensions?: string;
  health_record_id?: number;
  detected_at: string;
  created_at: string;
}

interface DetectionStats {
  total_detections: number;
  disease_counts: Record<string, number>;
  confidence_stats: {
    average: number;
    minimum: number;
    maximum: number;
  };
  sick_count: number;
  healthy_count: number;
  sick_percentage: number;
}

interface DiseaseHistoryProps {
  refreshTrigger?: number;
}

const DiseaseHistory: React.FC<DiseaseHistoryProps> = ({ refreshTrigger = 0 }) => {
  const [history, setHistory] = useState<DiseaseHistoryRecord[]>([]);
  const [stats, setStats] = useState<DetectionStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    field_id: '',
    disease_type: '',
    days: 30,
    limit: 50
  });

  useEffect(() => {
    fetchHistory();
    fetchStats();
  }, [filters]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchHistory();
      fetchStats();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [filters]);

  // Refresh when refreshTrigger changes (triggered from parent component)
  useEffect(() => {
    if (refreshTrigger > 0) {
      console.log('🔄 Refreshing history due to new prediction...');
      fetchHistory();
      fetchStats();
    }
  }, [refreshTrigger]);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.field_id) params.append('field_id', filters.field_id);
      if (filters.disease_type) params.append('disease_type', filters.disease_type);
      params.append('days', filters.days.toString());
      params.append('limit', filters.limit.toString());
      params.append('only_sick', 'true');

      console.log('Fetching history from:', `/api/disease-history/public-history?${params}`);
      const response = await api.get(`/api/disease-history/public-history?${params}`);
      console.log('History response:', response.data);
      
      // Check if we have new records
      const newRecordCount = response.data.length - history.length;
      if (newRecordCount > 0) {
        console.log(`🆕 Found ${newRecordCount} new detection records`);
      }
      
      setHistory(response.data);
    } catch (error) {
      console.error('Failed to fetch disease history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.field_id) params.append('field_id', filters.field_id);
      params.append('days', filters.days.toString());

      console.log('Fetching stats from:', `/api/disease-history/public-stats?${params}`);
      const response = await api.get(`/api/disease-history/public-stats?${params}`);
      console.log('Stats response:', response.data);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch detection stats:', error);
    }
  };

  const getDiseaseColor = (diseaseType: string) => {
    switch (diseaseType) {
      case 'healthy':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'blight':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'common rust':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'gray leaf spot':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getDiseaseIcon = (diseaseType: string) => {
    switch (diseaseType) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'blight':
      case 'common rust':
      case 'gray leaf spot':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      default:
        return <CheckCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const formatConfidence = (confidence: number) => {
    return (confidence * 100).toFixed(1);
  };

  const getSeverityColor = (confidence: number) => {
    if (confidence > 0.8) return 'text-red-600';
    if (confidence > 0.6) return 'text-orange-600';
    return 'text-yellow-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Disease Detection History</h1>
          <p className="text-gray-600">View and analyze past disease detection results</p>
        </div>
        
        <button
          onClick={() => { 
            fetchHistory(); 
            fetchStats(); 
          }}
          disabled={isLoading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          <span>Refresh</span>
        </button>
      </div>

      {/* Statistics */}
      {stats && (
        <>
          {console.log('Rendering stats:', stats)}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Detection Statistics</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{stats.total_detections}</div>
              <div className="text-sm text-gray-600">Total Detections</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{stats.healthy_count}</div>
              <div className="text-sm text-gray-600">Healthy Plants</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{stats.sick_count}</div>
              <div className="text-sm text-gray-600">Diseased Plants</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{stats.sick_percentage.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Disease Rate</div>
            </div>
          </div>

          {/* Disease Type Breakdown */}
          <div className="mt-6">
            <h4 className="text-md font-semibold text-gray-900 mb-3">Disease Type Breakdown</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(stats.disease_counts).map(([disease, count]) => (
                <div key={disease} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">{disease}</span>
                  <span className="text-sm font-bold text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Confidence Statistics */}
          <div className="mt-6">
            <h4 className="text-md font-semibold text-gray-900 mb-3">Confidence Statistics</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-bold text-gray-900">{stats.confidence_stats.average.toFixed(3)}</div>
                <div className="text-sm text-gray-600">Average</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-bold text-gray-900">{stats.confidence_stats.minimum.toFixed(3)}</div>
                <div className="text-sm text-gray-600">Minimum</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-bold text-gray-900">{stats.confidence_stats.maximum.toFixed(3)}</div>
                <div className="text-sm text-gray-600">Maximum</div>
              </div>
            </div>
          </div>
        </div>
        </>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Field ID</label>
            <input
              type="number"
              value={filters.field_id}
              onChange={(e) => setFilters(prev => ({ ...prev, field_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="All fields"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Disease Type</label>
            <select
              value={filters.disease_type}
              onChange={(e) => setFilters(prev => ({ ...prev, disease_type: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All diseases</option>
              <option value="healthy">Healthy</option>
              <option value="blight">Blight</option>
              <option value="common rust">Common Rust</option>
              <option value="gray leaf spot">Gray Leaf Spot</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Days Back</label>
            <select
              value={filters.days}
              onChange={(e) => setFilters(prev => ({ ...prev, days: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
              <option value={365}>Last year</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Limit</label>
            <select
              value={filters.limit}
              onChange={(e) => setFilters(prev => ({ ...prev, limit: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={25}>25 records</option>
              <option value={50}>50 records</option>
              <option value={100}>100 records</option>
            </select>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Detection History</h3>
          </div>
          
          <div className="text-sm text-gray-600">
            {history.length} records found
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading...</span>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8">
            <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No detection history found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Disease</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Confidence</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Field</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {history.map((record) => (
                  <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        {getDiseaseIcon(record.disease_type)}
                        <span className="font-medium text-gray-900">{record.disease_type}</span>
                      </div>
                    </td>
                    
                    <td className="py-3 px-4">
                      <div className={`font-semibold ${getSeverityColor(record.confidence)}`}>
                        {formatConfidence(record.confidence)}%
                      </div>
                    </td>
                    
                    <td className="py-3 px-4">
                      <span className="text-gray-600">Field {record.field_id}</span>
                    </td>
                    
                    <td className="py-3 px-4">
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        record.is_sick 
                          ? 'bg-red-100 text-red-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {record.is_sick ? 'Diseased' : 'Healthy'}
                      </div>
                    </td>
                    
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{formatDate(record.detected_at)}</span>
                      </div>
                    </td>
                    
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        {record.health_record_id && (
                          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            Health Record #{record.health_record_id}
                          </span>
                        )}
                        {record.image_filename && (
                          <span className="text-xs text-gray-500">
                            {record.image_filename}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiseaseHistory; 