import { sessionsAPI } from './api';

export interface AlertHistory {
  id: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  field_id?: number;
  metadata?: any;
  timestamp: string;
  is_read: boolean;
  is_dismissed: boolean;
  source: 'disease_detection' | 'plant_health' | 'weather' | 'sensor' | 'session';
}

export interface AlertStats {
  totalAlerts: number;
  unreadAlerts: number;
  criticalAlerts: number;
  recentAlerts: AlertHistory[];
}

class AlertHistoryService {
  private listeners: ((alert: AlertHistory) => void)[] = [];
  private stats: AlertStats = {
    totalAlerts: 0,
    unreadAlerts: 0,
    criticalAlerts: 0,
    recentAlerts: []
  };
  private pollingInterval: NodeJS.Timeout | null = null;
  private lastCheckedTimestamp: string | null = null;
  private isPolling = false;
  private alertTimeWindowMs = 5 * 60 * 1000; // 5 minutes

  // Subscribe to alert events
  subscribe(callback: (alert: AlertHistory) => void) {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Get alerts from disease detection history
  private async getDiseaseAlerts(limit = 50): Promise<AlertHistory[]> {
    try {
      const response = await fetch('/api/disease-history/public-history?limit=' + limit + '&only_sick=true');
      if (!response.ok) {
        throw new Error('Failed to fetch disease alerts');
      }
      
      const diseaseHistory = await response.json();
      
      return diseaseHistory
        .filter((detection: any) => detection.disease_type !== 'healthy' && detection.is_sick === true)
        .map((detection: any) => {
        // Handle timestamp with timezone fix (same as plantDetectionService)
        let timestamp = detection.detected_at || detection.created_at;
        if (timestamp) {
          try {
            const baseTime = new Date(timestamp);
            const adjustedTime = new Date(baseTime.getTime() + (2 * 60 * 60 * 1000)); // Add 2 hours
            timestamp = adjustedTime.toISOString();
          } catch (error) {
            console.error('Error parsing timestamp:', timestamp, error);
          }
        }

        return {
          id: `disease_${detection.id}`,
          alert_type: 'disease_detected',
          severity: detection.confidence > 0.8 ? 'critical' : 
                   detection.confidence > 0.6 ? 'high' : 
                   detection.confidence > 0.4 ? 'medium' : 'low',
          title: `${detection.disease_type} Detected`,
          message: `${detection.disease_type} detected with ${(detection.confidence * 100).toFixed(1)}% confidence. ${detection.description || ''}`,
          field_id: detection.field_id,
          metadata: {
            disease_type: detection.disease_type,
            confidence: detection.confidence,
            is_sick: detection.is_sick,
            model_type: detection.model_type,
            model_version: detection.model_version
          },
          timestamp: timestamp,
          is_read: false,
          is_dismissed: false,
          source: 'disease_detection' as const
        };
      });
    } catch (error) {
      console.error('Failed to get disease alerts:', error);
      return [];
    }
  }

  // Get alerts from plant health monitoring
  private async getPlantHealthAlerts(limit = 50): Promise<AlertHistory[]> {
    try {
      // Since plant health requires a field_id, we'll skip this for now
      // and rely on disease detection history which is more comprehensive
      return [];
    } catch (error) {
      console.error('Failed to get plant health alerts:', error);
      return [];
    }
  }

  // Get alerts from weather data
  private async getWeatherAlerts(limit = 50): Promise<AlertHistory[]> {
    try {
      // Since weather requires a field_id, we'll skip this for now
      // Weather alerts can be handled through the main alerts API
      return [];
    } catch (error) {
      console.error('Failed to get weather alerts:', error);
      return [];
    }
  }

  // Get alerts from sensor data
  private async getSensorAlerts(limit = 50): Promise<AlertHistory[]> {
    try {
      // Since sensors require a field_id, we'll skip this for now
      // Sensor alerts can be handled through the main alerts API
      return [];
    } catch (error) {
      console.error('Failed to get sensor alerts:', error);
      return [];
    }
  }

  // Get alerts from session data
  private async getSessionAlerts(limit = 50): Promise<AlertHistory[]> {
    try {
      const response = await fetch('/api/sessions/plant-detection?limit=' + limit);
      if (!response.ok) {
        throw new Error('Failed to fetch session alerts');
      }
      
      const sessionData = await response.json();
      
      return sessionData
        .filter((session: any) => session.health_status === 'diseased' || session.health_status === 'unhealthy')
        .map((session: any) => {
          // Handle timestamp with timezone fix
          let timestamp = session.detected_at || session.created_at;
          if (timestamp) {
            try {
              const baseTime = new Date(timestamp);
              const adjustedTime = new Date(baseTime.getTime() + (2 * 60 * 60 * 1000)); // Add 2 hours
              timestamp = adjustedTime.toISOString();
            } catch (error) {
              console.error('Error parsing timestamp:', timestamp, error);
            }
          }

          // Handle location properly
          const location = {
            x: session.location_x || session.location?.x || 0,
            y: session.location_y || session.location?.y || 0,
            z: session.location_z || session.location?.z || 0
          };

          return {
            id: `session_${session.id}`,
            alert_type: 'disease_detected',
            severity: 'high',
            title: `Plant Detection: ${session.label}`,
            message: `${session.label} detected at location (${location.x.toFixed(1)}, ${location.z.toFixed(1)}). Health status: ${session.health_status}`,
            field_id: 1, // Default field ID
            metadata: {
              plant_id: session.plant_id,
              label: session.label,
              health_status: session.health_status,
              location: location
            },
            timestamp: timestamp,
            is_read: false,
            is_dismissed: false,
            source: 'session' as const
          };
        });
    } catch (error) {
      console.error('Failed to get session alerts:', error);
      return [];
    }
  }

  // Get alert history from all sources
  async getAlertHistory(limit = 50): Promise<AlertHistory[]> {
    try {
      // Fetch alerts from all sources in parallel
      const [diseaseAlerts, healthAlerts, weatherAlerts, sensorAlerts, sessionAlerts] = await Promise.all([
        this.getDiseaseAlerts(limit),
        this.getPlantHealthAlerts(limit),
        this.getWeatherAlerts(limit),
        this.getSensorAlerts(limit),
        this.getSessionAlerts(limit)
      ]);

      // Combine all alerts and sort by timestamp
      const allAlerts = [
        ...diseaseAlerts,
        ...healthAlerts,
        ...weatherAlerts,
        ...sensorAlerts,
        ...sessionAlerts
      ];

      // Sort by timestamp (newest first) and limit
      return allAlerts
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);

    } catch (error) {
      console.error('Failed to get alert history:', error);
      return [];
    }
  }

  // Get recent alerts (last 24 hours)
  async getRecentAlerts(hours = 24): Promise<AlertHistory[]> {
    try {
      const alerts = await this.getAlertHistory(100);
      const cutoffTime = new Date(Date.now() - (hours * 60 * 60 * 1000));
      
      return alerts.filter(alert => {
        const alertTime = new Date(alert.timestamp);
        return alertTime > cutoffTime;
      });
    } catch (error) {
      console.error('Failed to get recent alerts:', error);
      return [];
    }
  }

  // Get current stats
  async getStats(): Promise<AlertStats> {
    try {
      const alerts = await this.getAlertHistory(100);
      
      const unreadAlerts = alerts.filter(alert => !alert.is_read).length;
      const criticalAlerts = alerts.filter(alert => alert.severity === 'critical').length;
      
      this.stats = {
        totalAlerts: alerts.length,
        unreadAlerts,
        criticalAlerts,
        recentAlerts: alerts.slice(0, 10)
      };
      
      return this.stats;
    } catch (error) {
      console.error('Failed to get alert stats:', error);
      return this.stats;
    }
  }

  // Mark alert as read
  async markAlertAsRead(alertId: string): Promise<void> {
    // In a real implementation, this would update the backend
    // For now, we'll just update local state
    const alert = this.stats.recentAlerts.find(a => a.id === alertId);
    if (alert) {
      alert.is_read = true;
    }
  }

  // Mark alert as dismissed
  async markAlertAsDismissed(alertId: string): Promise<void> {
    // In a real implementation, this would update the backend
    // For now, we'll just update local state
    const alert = this.stats.recentAlerts.find(a => a.id === alertId);
    if (alert) {
      alert.is_dismissed = true;
    }
  }

  // Start polling for new alerts
  startPolling(intervalMs: number = 10000) {
    if (this.isPolling) {
      console.log('Alert polling already active');
      return;
    }

    this.isPolling = true;
    console.log(`Starting alert polling every ${intervalMs}ms`);

    // Initial check
    this.checkForNewAlerts();

    // Set up polling interval
    this.pollingInterval = setInterval(() => {
      this.checkForNewAlerts();
    }, intervalMs);
  }

  // Stop polling
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      this.isPolling = false;
      console.log('Stopped alert polling');
    }
  }

  // Check for new alerts
  async checkForNewAlerts() {
    try {
      console.log('Checking for new alerts...');
      
      const recentAlerts = await this.getRecentAlerts(1); // Last hour
      console.log(`Found ${recentAlerts.length} recent alerts`);
      
      if (recentAlerts.length === 0) {
        return;
      }

      // Get current time for comparison
      const now = new Date();
      const timeWindowAgo = new Date(now.getTime() - this.alertTimeWindowMs);
      
      // Find new alerts since last check
      const newAlerts = recentAlerts.filter(alert => {
        const alertTime = new Date(alert.timestamp);
        
        // Check if alert is within time window
        if (alertTime < timeWindowAgo) {
          return false;
        }

        // Check if it's a new alert since last check
        if (!this.lastCheckedTimestamp) {
          return true; // First time, consider recent alerts as new
        }
        
        return alertTime > new Date(this.lastCheckedTimestamp);
      });

      console.log(`Found ${newAlerts.length} new alerts`);

      // Update last checked timestamp
      if (recentAlerts.length > 0) {
        this.lastCheckedTimestamp = recentAlerts[0].timestamp;
      }

      // Notify listeners for new alerts
      for (const alert of newAlerts) {
        this.notifyListeners(alert);
      }

    } catch (error) {
      console.error('Failed to check for new alerts:', error);
    }
  }

  // Notify all listeners
  private notifyListeners(alert: AlertHistory) {
    this.listeners.forEach(listener => {
      try {
        listener(alert);
      } catch (error) {
        console.error('Error in alert listener:', error);
      }
    });
  }

  // Get polling status
  getPollingStatus() {
    return {
      isPolling: this.isPolling,
      lastChecked: this.lastCheckedTimestamp,
      alertTimeWindowMs: this.alertTimeWindowMs
    };
  }

  // Reset polling state
  resetPollingState() {
    this.lastCheckedTimestamp = null;
    console.log('Reset alert polling state');
  }
}

// Export singleton instance
export const alertHistoryService = new AlertHistoryService(); 