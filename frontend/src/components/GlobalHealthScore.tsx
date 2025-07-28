import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Info
} from 'lucide-react';
import { healthScoreService, HealthScore, HealthScoreTrend, HealthScoreBreakdown } from '../services/healthScoreService';

interface GlobalHealthScoreProps {
  fieldId?: number;
  timeWindowDays?: number;
  showTrend?: boolean;
  showBreakdown?: boolean;
}

const GlobalHealthScore: React.FC<GlobalHealthScoreProps> = ({
  fieldId,
  timeWindowDays = 7,
  showTrend = false,
  showBreakdown = false
}) => {
  const [selectedTimeWindow, setSelectedTimeWindow] = useState(timeWindowDays);

  // Query for global health score
  const {
    data: healthScore,
    isLoading: scoreLoading,
    error: scoreError,
    refetch: refetchScore
  } = useQuery({
    queryKey: ['globalHealthScore', fieldId, selectedTimeWindow],
    queryFn: () => healthScoreService.getGlobalHealthScore(fieldId, selectedTimeWindow),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Query for health score trend
  const {
    data: trendData,
    isLoading: trendLoading,
    error: trendError
  } = useQuery({
    queryKey: ['healthScoreTrend', fieldId],
    queryFn: () => healthScoreService.getHealthScoreTrend(fieldId, 30),
    enabled: showTrend,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Query for detailed breakdown
  const {
    data: breakdownData,
    isLoading: breakdownLoading,
    error: breakdownError
  } = useQuery({
    queryKey: ['healthScoreBreakdown', fieldId, selectedTimeWindow],
    queryFn: () => healthScoreService.getHealthScoreBreakdown(fieldId, selectedTimeWindow),
    enabled: showBreakdown,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleTimeWindowChange = (days: number) => {
    setSelectedTimeWindow(days);
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-6 h-6 text-green-600" />;
    if (score >= 60) return <Activity className="w-6 h-6 text-yellow-600" />;
    if (score >= 40) return <AlertTriangle className="w-6 h-6 text-orange-600" />;
    return <AlertTriangle className="w-6 h-6 text-red-600" />;
  };

  const getTrendIcon = (currentScore: number, previousScore?: number) => {
    if (!previousScore) return <Info className="w-4 h-4 text-gray-400" />;
    if (currentScore > previousScore) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (currentScore < previousScore) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Activity className="w-4 h-4 text-gray-400" />;
  };

  if (scoreLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (scoreError) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-red-600">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
          <p>Failed to load health score</p>
          <button
            onClick={() => refetchScore()}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!healthScore) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-gray-500">
          <Info className="w-8 h-8 mx-auto mb-2" />
          <p>No health score data available</p>
        </div>
      </div>
    );
  }

  const { global_score, disease_impact_score, confidence_weight, calculation_timestamp } = healthScore;
  const scoreColor = healthScoreService.getHealthScoreColor(global_score);
  const scoreStatus = healthScoreService.getHealthScoreStatus(global_score);
  const statusColor = healthScoreService.getHealthScoreStatusColor(global_score);

  // Get trend data for comparison
  const currentTrend = trendData?.trend_data?.slice(-2);
  const previousScore = currentTrend?.[0]?.score;

  return (
    <div className="space-y-6">
      {/* Main Health Score Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Activity className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Global Crop Health Score
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <select
              value={selectedTimeWindow}
              onChange={(e) => handleTimeWindowChange(Number(e.target.value))}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value={1}>Last 24 hours</option>
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Score */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              {getScoreIcon(global_score)}
            </div>
            <div className={`text-4xl font-bold ${scoreColor}`}>
              {global_score.toFixed(1)}
            </div>
            <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${statusColor}`}>
              {scoreStatus}
            </div>
            {previousScore && (
              <div className="flex items-center justify-center mt-2 text-sm text-gray-600">
                {getTrendIcon(global_score, previousScore)}
                <span className="ml-1">
                  {global_score > previousScore ? '+' : ''}
                  {(global_score - previousScore).toFixed(1)} from previous
                </span>
              </div>
            )}
          </div>

          {/* Disease Impact */}
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-1">Disease Impact</div>
            <div className="text-2xl font-semibold text-red-600">
              {disease_impact_score.toFixed(1)}
            </div>
            <div className="text-xs text-gray-500">
              Higher = worse health
            </div>
          </div>

          {/* Confidence Weight */}
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-1">Confidence Weight</div>
            <div className="text-2xl font-semibold text-blue-600">
              {(confidence_weight * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500">
              Detection reliability
            </div>
          </div>
        </div>

        <div className="mt-4 text-xs text-gray-500 text-center">
          <Clock className="w-3 h-3 inline mr-1" />
          Calculated: {new Date(calculation_timestamp).toLocaleString()}
        </div>
      </div>

      {/* Trend Chart */}
      {showTrend && trendData && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-2 mb-4">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h4 className="text-lg font-semibold">Health Score Trend</h4>
          </div>
          
          {trendLoading ? (
            <div className="animate-pulse h-32 bg-gray-200 rounded"></div>
          ) : trendError ? (
            <div className="text-center text-red-600 py-8">
              Failed to load trend data
            </div>
          ) : (
            <div className="space-y-2">
              {trendData.trend_data.slice(-7).map((day, index) => (
                <div key={day.date} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">
                    {new Date(day.date).toLocaleDateString()}
                  </span>
                  <div className="flex items-center space-x-4">
                    <span className={`text-sm font-medium ${healthScoreService.getHealthScoreColor(day.score)}`}>
                      {day.score.toFixed(1)}
                    </span>
                    {getTrendIcon(day.score, trendData.trend_data[index - 1]?.score)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Detailed Breakdown */}
      {showBreakdown && breakdownData && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Info className="w-5 h-5 text-blue-600" />
            <h4 className="text-lg font-semibold">Detailed Breakdown</h4>
          </div>
          
          {breakdownLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ) : breakdownError ? (
            <div className="text-center text-red-600 py-4">
              Failed to load breakdown data
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Disease Breakdown */}
              <div>
                <h5 className="font-medium text-gray-900 mb-3">Disease Detections</h5>
                <div className="space-y-2">
                  {healthScoreService.formatDiseaseBreakdown(breakdownData.detailed_breakdown).map((disease) => (
                    <div key={disease.disease} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm font-medium">{disease.disease}</span>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">
                          {disease.count} detections ({disease.avgConfidence}% confidence)
                        </div>
                        <div className="text-xs text-red-600">
                          Impact: {disease.impact}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Session Breakdown */}
              <div>
                <h5 className="font-medium text-gray-900 mb-3">Session Detections</h5>
                <div className="space-y-2">
                  {healthScoreService.formatSessionBreakdown(breakdownData.detailed_breakdown).map((session) => (
                    <div key={session.status} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm font-medium">{session.status}</span>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">
                          {session.count} detections
                        </div>
                        <div className="text-xs text-blue-600">
                          {session.percentage}% of total
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalHealthScore; 