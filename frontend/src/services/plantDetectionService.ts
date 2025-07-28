import { sessionsAPI } from './api';

export interface PlantDetection {
  id: string;
  session_id: string;
  plant_id: string;
  label: string;
  location: { x: number; y: number; z: number };
  health_status: string;
  timestamp?: string;
  detected_at?: string;
  created_at?: string;
  updated_at?: string;
  metadata?: any;
  notes?: string;
  insights?: string;
}

export interface PlantDetectionStats {
  totalDetections: number;
  unhealthyCount: number;
  healthyCount: number;
  recentDetections: PlantDetection[];
  healthScore: number;
}

class PlantDetectionService {
  private listeners: ((detection: PlantDetection) => void)[] = [];
  private stats: PlantDetectionStats = {
    totalDetections: 0,
    unhealthyCount: 0,
    healthyCount: 0,
    recentDetections: [],
    healthScore: 100
  };
  private pollingInterval: NodeJS.Timeout | null = null;
  private lastCheckedTimestamp: string | null = null;
  private isPolling = false;
  private alertTimeWindowMs = 5 * 60 * 1000; // 5 minutes default for testing
  private shownAlerts: Set<string> = new Set(); // Track which alerts have been shown

  // Subscribe to plant detection events
  subscribe(callback: (detection: PlantDetection) => void) {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Report a new plant detection
  async reportPlantDetection(plantData: {
    sessionId: string;
    plantId: string;
    label: string;
    location: { x: number; y: number; z: number };
    healthStatus: string;
    timestamp: string;
  }) {
    try {
      const response = await sessionsAPI.reportPlantDetection(plantData);
      const detection = response.data;
      
      // Ensure detection has an ID for tracking
      if (!detection.id) {
        detection.id = `detection_${Date.now()}`;
      }
      
      // Update stats
      this.updateStats(detection);
      
      // Notify listeners
      this.notifyListeners(detection);
      
      return detection;
    } catch (error) {
      console.error('Failed to report plant detection:', error);
      throw error;
    }
  }

  // Get current stats
  getStats(): PlantDetectionStats {
    return { ...this.stats };
  }

  // Get recent detections
  async getRecentDetections(limit = 10): Promise<PlantDetection[]> {
    try {
      const response = await sessionsAPI.getRecentPlantDetections(limit);
      return response.data || [];
    } catch (error) {
      console.error('Failed to get recent detections:', error);
      return [];
    }
  }

  // Update stats when new detection is reported
  private updateStats(detection: PlantDetection) {
    this.stats.totalDetections++;
    
    if (detection.health_status === 'diseased' || detection.health_status === 'unhealthy') {
      this.stats.unhealthyCount++;
    } else {
      this.stats.healthyCount++;
    }

    // Calculate health score (percentage of healthy plants)
    const total = this.stats.healthyCount + this.stats.unhealthyCount;
    this.stats.healthScore = total > 0 ? Math.round((this.stats.healthyCount / total) * 100) : 100;

    // Add to recent detections
    this.stats.recentDetections.unshift(detection);
    if (this.stats.recentDetections.length > 10) {
      this.stats.recentDetections = this.stats.recentDetections.slice(0, 10);
    }
  }

  // Notify all listeners
  private notifyListeners(detection: PlantDetection) {
    this.listeners.forEach(listener => {
      try {
        listener(detection);
      } catch (error) {
        console.error('Error in plant detection listener:', error);
      }
    });
  }

  // Mark an alert as shown (called when user dismisses the alert)
  markAlertAsShown(detectionId: string) {
    this.shownAlerts.add(detectionId);
    console.log(`Alert marked as shown for detection: ${detectionId}`);
  }

  // Check if an alert has already been shown
  private isAlertAlreadyShown(detectionId: string): boolean {
    return this.shownAlerts.has(detectionId);
  }

  // Start polling for new plant detections
  startPolling(intervalMs: number = 5000) {
    if (this.isPolling) {
      console.log('Polling already active');
      return;
    }

    this.isPolling = true;
    console.log(`Starting plant detection polling every ${intervalMs}ms`);

    // Initial check
    this.checkForNewDetections();

    // Set up polling interval
    this.pollingInterval = setInterval(() => {
      this.checkForNewDetections();
    }, intervalMs);
  }

  // Stop polling
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      this.isPolling = false;
      console.log('Stopped plant detection polling');
    }
  }

  // Check for new detections from the backend
  async checkForNewDetections() {
    try {
          console.log('Checking for new plant detections...');
    const recentDetections = await this.getRecentDetections(50);
    
          console.log(`Found ${recentDetections.length} total detections`);
      
      // Debug: Log all detections with their timestamp fields
      console.log('=== ALL DETECTIONS DEBUG ===');
      recentDetections.forEach((detection, index) => {
        console.log(`Detection ${index + 1}:`, {
          id: detection.id,
          label: detection.label,
          timestamp: detection.timestamp,
          created_at: detection.created_at,
          detected_at: detection.detected_at,
          allFields: Object.keys(detection)
        });
      });
      console.log('=== END DEBUG ===');
      
      if (!Array.isArray(recentDetections) || recentDetections.length === 0) {
        console.log('No detections found');
        return;
      }

      // Get current time for comparison
      const now = new Date();
      const timeWindowAgo = new Date(now.getTime() - this.alertTimeWindowMs);
      
      console.log(`Time window: ${Math.round(this.alertTimeWindowMs / 1000)}s ago (${timeWindowAgo.toISOString()})`);

      // Find new detections since last check AND created within the configured time window
      const newDetections = recentDetections.filter(detection => {
        // Use created_at for accurate timing (this is when the record was actually created)
        const timestamp = detection.created_at;
        if (!timestamp) {
          console.log(`Skipping detection without created_at: ${detection.label}`);
          return false; // Skip detections without created_at
        }

        // Parse timestamp - add 2 hours to compensate for timezone difference
        let detectionTime: Date;
        try {
          // Parse the timestamp and add 2 hours to fix timezone issue
          const baseTime = new Date(timestamp);
          detectionTime = new Date(baseTime.getTime() + (2 * 60 * 60 * 1000)); // Add 2 hours
        } catch (error) {
          console.log(`Error parsing timestamp: ${timestamp}`, error);
          return false;
        }
        
        const secondsAgo = Math.round((now.getTime() - detectionTime.getTime()) / 1000);
        
        console.log(`Checking detection: ${detection.label} (${secondsAgo}s ago) - created_at: ${timestamp}`);
        console.log(`Current time: ${now.toISOString()}, Detection time: ${detectionTime.toISOString()}`);
        
        // Check if timestamp is in the future (timezone issue)
        if (detectionTime > now) {
          console.log(`WARNING: Detection timestamp is in the future! This might be a timezone issue.`);
          console.log(`Detection time: ${detectionTime.toISOString()}, Current time: ${now.toISOString()}`);
        }
        
        // Check if detection is within the configured time window
        if (detectionTime < timeWindowAgo) {
          console.log(`Skipping old detection: ${detection.label} (created ${secondsAgo}s ago)`);
          return false;
        }

        // Check if it's a new detection since last check
        if (!this.lastCheckedTimestamp) {
          console.log(`First time check - considering recent detection: ${detection.label}`);
          return true; // First time, consider recent detections as new
        }
        
        const isNewSinceLastCheck = detectionTime > new Date(this.lastCheckedTimestamp);
        console.log(`Detection ${detection.label}: ${isNewSinceLastCheck ? 'NEW' : 'already seen'}`);
        return isNewSinceLastCheck;
      });

      console.log(`Found ${newDetections.length} new detections within time window`);

      // Update last checked timestamp
      if (recentDetections.length > 0) {
        const timestamp = recentDetections[0].created_at || recentDetections[0].timestamp || recentDetections[0].detected_at;
        if (timestamp) {
          this.lastCheckedTimestamp = timestamp;
          console.log(`Updated last checked timestamp: ${this.lastCheckedTimestamp}`);
        }
      }

      // Process new detections
      for (const detection of newDetections) {
        const detectionTime = new Date(detection.timestamp || detection.created_at || detection.detected_at || '');
        const secondsAgo = Math.round((now.getTime() - detectionTime.getTime()) / 1000);
        
        console.log(`New plant detection found: ${detection.label} at ${detection.location?.x || 0}, ${detection.location?.z || 0} (${secondsAgo}s ago)`);
        
        // Ensure detection has an ID
        if (!detection.id) {
          detection.id = `detection_${Date.now()}_${Math.random()}`;
        }

        // Check if this alert has already been shown
        if (this.isAlertAlreadyShown(detection.id)) {
          console.log(`Skipping already shown alert for detection: ${detection.id}`);
          continue;
        }

        // Update stats
        this.updateStats(detection);

        // Notify listeners (this will trigger the alert)
        this.notifyListeners(detection);
      }

    } catch (error) {
      console.error('Failed to check for new detections:', error);
    }
  }

  // Note: Removed hardcoded simulation - alerts now come from database
  // Use alertHistoryService for real alert management

  // Get polling status
  getPollingStatus() {
    return {
      isPolling: this.isPolling,
      lastChecked: this.lastCheckedTimestamp,
      alertTimeWindowMs: this.alertTimeWindowMs,
      shownAlertsCount: this.shownAlerts.size
    };
  }

  // Configure alert time window
  setAlertTimeWindow(seconds: number) {
    this.alertTimeWindowMs = seconds * 1000;
    console.log(`Alert time window set to ${seconds} seconds`);
  }

  // Reset polling state (useful for testing)
  resetPollingState() {
    this.lastCheckedTimestamp = null;
    console.log('Reset polling state - will check all recent detections');
  }

  // Clear shown alerts (useful for testing or resetting)
  clearShownAlerts() {
    this.shownAlerts.clear();
    console.log('Cleared shown alerts tracking');
  }

  // Get shown alerts count (for debugging)
  getShownAlertsCount(): number {
    return this.shownAlerts.size;
  }
}

// Export singleton instance
export const plantDetectionService = new PlantDetectionService(); 