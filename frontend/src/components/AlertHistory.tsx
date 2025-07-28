import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, Check, Clock, MapPin, Eye, EyeOff } from 'lucide-react';
import { alertHistoryService, AlertHistory as AlertHistoryType } from '../services/alertHistoryService';

interface AlertHistoryProps {
  isVisible: boolean;
  onClose: () => void;
}

const AlertHistory: React.FC<AlertHistoryProps> = ({ isVisible, onClose }) => {
  const [alerts, setAlerts] = useState<AlertHistoryType[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'critical' | 'disease_detection' | 'plant_health' | 'weather' | 'sensor' | 'session'>('all');

  useEffect(() => {
    if (isVisible) {
      loadAlerts();
    }
  }, [isVisible]);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const alertHistory = await alertHistoryService.getAlertHistory(50);
      setAlerts(alertHistory);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (alertId: string) => {
    await alertHistoryService.markAlertAsRead(alertId);
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, is_read: true } : alert
    ));
  };

  const handleMarkAsDismissed = async (alertId: string) => {
    await alertHistoryService.markAlertAsDismissed(alertId);
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, is_dismissed: true } : alert
    ));
  };

  const getFilteredAlerts = () => {
    let filtered = alerts;
    
    switch (filter) {
      case 'unread':
        filtered = alerts.filter(alert => !alert.is_read);
        break;
      case 'critical':
        filtered = alerts.filter(alert => alert.severity === 'critical');
        break;
      case 'disease_detection':
        filtered = alerts.filter(alert => alert.source === 'disease_detection');
        break;
      case 'plant_health':
        filtered = alerts.filter(alert => alert.source === 'plant_health');
        break;
      case 'weather':
        filtered = alerts.filter(alert => alert.source === 'weather');
        break;
      case 'sensor':
        filtered = alerts.filter(alert => alert.source === 'sensor');
        break;
      case 'session':
        filtered = alerts.filter(alert => alert.source === 'session');
        break;
      default:
        filtered = alerts;
    }
    
    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case 'medium':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'low':
        return <AlertTriangle className="w-5 h-5 text-blue-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-600" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.round(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else if (diffSeconds > 0) {
      return `${diffSeconds} second${diffSeconds > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  if (!isVisible) return null;

  const filteredAlerts = getFilteredAlerts();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Alert History</h2>
            <p className="text-sm text-gray-600 mt-1">
              {alerts.length} total alerts • {alerts.filter(a => !a.is_read).length} unread
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4 p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                filter === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              All ({alerts.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                filter === 'unread' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              Unread ({alerts.filter(a => !a.is_read).length})
            </button>
            <button
              onClick={() => setFilter('critical')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                filter === 'critical' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              Critical ({alerts.filter(a => a.severity === 'critical').length})
            </button>
            <button
              onClick={() => setFilter('disease_detection')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                filter === 'disease_detection' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              Disease ({alerts.filter(a => a.source === 'disease_detection').length})
            </button>
            <button
              onClick={() => setFilter('plant_health')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                filter === 'plant_health' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              Health ({alerts.filter(a => a.source === 'plant_health').length})
            </button>
            <button
              onClick={() => setFilter('weather')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                filter === 'weather' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              Weather ({alerts.filter(a => a.source === 'weather').length})
            </button>
            <button
              onClick={() => setFilter('sensor')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                filter === 'sensor' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              Sensors ({alerts.filter(a => a.source === 'sensor').length})
            </button>
            <button
              onClick={() => setFilter('session')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                filter === 'session' 
                  ? 'bg-orange-600 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              Sessions ({alerts.filter(a => a.source === 'session').length})
            </button>
          </div>
          
          <button
            onClick={loadAlerts}
            disabled={loading}
            className="ml-auto px-3 py-1 bg-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-300 transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {/* Alert List */}
        <div className="overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="text-center p-8">
              <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No alerts found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    !alert.is_read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Alert Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {getSeverityIcon(alert.severity)}
                    </div>

                    {/* Alert Content */}
                                      <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <h3 className={`text-sm font-semibold capitalize ${getSeverityColor(alert.severity).split(' ')[0]}`}>
                          {alert.title}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                          {alert.severity}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          alert.source === 'disease_detection' ? 'bg-red-100 text-red-700' :
                          alert.source === 'plant_health' ? 'bg-green-100 text-green-700' :
                          alert.source === 'weather' ? 'bg-blue-100 text-blue-700' :
                          alert.source === 'sensor' ? 'bg-purple-100 text-purple-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {alert.source.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatTimestamp(alert.timestamp)}
                        </span>
                        {alert.field_id && (
                          <span className="text-xs text-gray-500 flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            Field {alert.field_id}
                          </span>
                        )}
                      </div>
                    </div>

                      <p className="text-sm text-gray-700 mb-3">{alert.message}</p>

                      {/* Alert Actions */}
                      <div className="flex items-center space-x-2">
                        {!alert.is_read && (
                          <button
                            onClick={() => handleMarkAsRead(alert.id)}
                            className="flex items-center space-x-1 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          >
                            <Check className="w-3 h-3" />
                            <span>Mark as read</span>
                          </button>
                        )}
                        {!alert.is_dismissed && (
                          <button
                            onClick={() => handleMarkAsDismissed(alert.id)}
                            className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded transition-colors"
                          >
                            <X className="w-3 h-3" />
                            <span>Dismiss</span>
                          </button>
                        )}
                        {alert.is_read && (
                          <span className="flex items-center space-x-1 px-2 py-1 text-xs text-green-600">
                            <Eye className="w-3 h-3" />
                            <span>Read</span>
                          </span>
                        )}
                        {alert.is_dismissed && (
                          <span className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-500">
                            <EyeOff className="w-3 h-3" />
                            <span>Dismissed</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Showing {filteredAlerts.length} of {alerts.length} alerts
            </span>
            <span>
              Last updated: {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertHistory; 