import { api } from './api';

export interface HealthScore {
  global_score: number;
  disease_impact_score: number;
  confidence_weight: number;
  time_window_days: number;
  field_id?: number;
  calculation_timestamp: string;
  breakdown: any;
}

export interface HealthScoreTrend {
  trend_data: Array<{
    date: string;
    score: number;
    disease_impact: number;
    confidence_weight: number;
  }>;
  field_id?: number;
  days: number;
}

export interface HealthScoreBreakdown {
  score_summary: {
    global_score: number;
    disease_impact_score: number;
    confidence_weight: number;
    time_window_days: number;
  };
  detailed_breakdown: {
    cnn_detections: any;
    session_detections: any;
    calculation: any;
    severity_weights: any;
  };
  calculation_timestamp: string;
  field_id?: number;
}

class HealthScoreService {
  /**
   * Get global health score
   */
  async getGlobalHealthScore(
    fieldId?: number,
    timeWindowDays: number = 7
  ): Promise<HealthScore> {
    try {
      const params = new URLSearchParams();
      if (fieldId) params.append('field_id', fieldId.toString());
      params.append('time_window_days', timeWindowDays.toString());

      const response = await api.get(`/api/health-score/global?${params}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get global health score:', error);
      throw error;
    }
  }

  /**
   * Get health score trend over time
   */
  async getHealthScoreTrend(
    fieldId?: number,
    days: number = 30
  ): Promise<HealthScoreTrend> {
    try {
      const params = new URLSearchParams();
      if (fieldId) params.append('field_id', fieldId.toString());
      params.append('days', days.toString());

      const response = await api.get(`/api/health-score/trend?${params}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get health score trend:', error);
      throw error;
    }
  }

  /**
   * Get detailed breakdown of health score calculation
   */
  async getHealthScoreBreakdown(
    fieldId?: number,
    timeWindowDays: number = 7
  ): Promise<HealthScoreBreakdown> {
    try {
      const params = new URLSearchParams();
      if (fieldId) params.append('field_id', fieldId.toString());
      params.append('time_window_days', timeWindowDays.toString());

      const response = await api.get(`/api/health-score/breakdown?${params}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get health score breakdown:', error);
      throw error;
    }
  }

  /**
   * Get health score color based on score value
   */
  getHealthScoreColor(score: number): string {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  }

  /**
   * Get health score status text
   */
  getHealthScoreStatus(score: number): string {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    if (score >= 20) return 'Poor';
    return 'Critical';
  }

  /**
   * Get health score status color
   */
  getHealthScoreStatusColor(score: number): string {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    if (score >= 40) return 'bg-orange-100 text-orange-800';
    if (score >= 20) return 'bg-red-100 text-red-800';
    return 'bg-red-100 text-red-800';
  }

  /**
   * Format disease breakdown for display
   */
  formatDiseaseBreakdown(breakdown: any): Array<{
    disease: string;
    count: number;
    avgConfidence: number;
    severityWeight: number;
    impact: number;
  }> {
    const diseases = breakdown?.cnn_detections?.diseases || {};
    const severityWeights = breakdown?.severity_weights || {};

    return Object.entries(diseases)
      .filter(([disease]) => disease !== 'healthy')
      .map(([disease, stats]: [string, any]) => ({
        disease: disease.charAt(0).toUpperCase() + disease.slice(1),
        count: stats.count,
        avgConfidence: Math.round(stats.avg_confidence * 100),
        severityWeight: severityWeights[disease] || 0,
        impact: Math.round(stats.count * stats.avg_confidence * (severityWeights[disease] || 0))
      }))
      .sort((a, b) => b.impact - a.impact);
  }

  /**
   * Format session breakdown for display
   */
  formatSessionBreakdown(breakdown: any): Array<{
    status: string;
    count: number;
    percentage: number;
  }> {
    const sessions = breakdown?.session_detections?.statuses || {};
    const totalSessions = breakdown?.session_detections?.total || 0;

    return Object.entries(sessions)
      .map(([status, stats]: [string, any]) => ({
        status: status.charAt(0).toUpperCase() + status.slice(1),
        count: stats.count,
        percentage: totalSessions > 0 ? Math.round((stats.count / totalSessions) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count);
  }
}

// Export singleton instance
export const healthScoreService = new HealthScoreService(); 