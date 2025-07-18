import React, { useState, useEffect, useCallback } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  X,
} from "lucide-react";

interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  threshold: number;
  status: "good" | "warning" | "error";
  trend: "up" | "down" | "stable";
  history: number[];
  timestamp: Date;
}

interface PerformanceAlert {
  id: string;
  type: "performance" | "error" | "warning";
  message: string;
  metric: string;
  value: number;
  threshold: number;
  timestamp: Date;
  severity: "low" | "medium" | "high";
}

interface PerformanceMonitorProps {
  isOpen: boolean;
  onClose: () => void;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  isOpen,
  onClose,
  autoRefresh = true,
  refreshInterval = 5000,
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch performance metrics
  const fetchMetrics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/errors/metrics");
      if (!response.ok) {
        throw new Error("Failed to fetch metrics");
      }

      const data = await response.json();
      setMetrics(data.metrics || []);
      setAlerts(data.alerts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch metrics");
      console.error("Error fetching performance metrics:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-refresh effect
  useEffect(() => {
    if (isOpen) {
      fetchMetrics();

      if (autoRefresh) {
        const interval = setInterval(fetchMetrics, refreshInterval);
        return () => clearInterval(interval);
      }
    }
  }, [isOpen, autoRefresh, refreshInterval, fetchMetrics]);

  // Get browser performance metrics
  const getBrowserMetrics = useCallback(() => {
    if (typeof window === "undefined" || !window.performance) return [];

    const navigation = window.performance.getEntriesByType(
      "navigation"
    )[0] as PerformanceNavigationTiming;
    const memory = (window.performance as any).memory;

    const browserMetrics: PerformanceMetric[] = [];

    if (navigation) {
      // Page load time
      const loadTime = navigation.loadEventEnd - navigation.fetchStart;
      browserMetrics.push({
        id: "page-load-time",
        name: "Page Load Time",
        value: loadTime,
        unit: "ms",
        threshold: 3000,
        status:
          loadTime > 3000 ? "error" : loadTime > 1000 ? "warning" : "good",
        trend: "stable",
        history: [loadTime],
        timestamp: new Date(),
      });

      // DOM content loaded
      const domLoadTime =
        navigation.domContentLoadedEventEnd - navigation.fetchStart;
      browserMetrics.push({
        id: "dom-load-time",
        name: "DOM Load Time",
        value: domLoadTime,
        unit: "ms",
        threshold: 2000,
        status:
          domLoadTime > 2000 ? "error" : domLoadTime > 800 ? "warning" : "good",
        trend: "stable",
        history: [domLoadTime],
        timestamp: new Date(),
      });

      // First Paint
      const firstPaint = navigation.responseStart - navigation.fetchStart;
      browserMetrics.push({
        id: "first-paint",
        name: "First Paint",
        value: firstPaint,
        unit: "ms",
        threshold: 1000,
        status:
          firstPaint > 1000 ? "error" : firstPaint > 500 ? "warning" : "good",
        trend: "stable",
        history: [firstPaint],
        timestamp: new Date(),
      });
    }

    if (memory) {
      // Memory usage
      const memoryUsage = memory.usedJSHeapSize / (1024 * 1024); // MB
      browserMetrics.push({
        id: "memory-usage",
        name: "Memory Usage",
        value: memoryUsage,
        unit: "MB",
        threshold: 100,
        status:
          memoryUsage > 100 ? "error" : memoryUsage > 50 ? "warning" : "good",
        trend: "stable",
        history: [memoryUsage],
        timestamp: new Date(),
      });
    }

    return browserMetrics;
  }, []);

  // Combine server and browser metrics
  const allMetrics = [...metrics, ...getBrowserMetrics()];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "good":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case "error":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-red-500" />;
      case "down":
        return <TrendingDown className="w-4 h-4 text-green-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "text-red-600 bg-red-50 border-red-200";
      case "medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "low":
        return "text-blue-600 bg-blue-50 border-blue-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const dismissAlert = async (alertId: string) => {
    try {
      await fetch(`/api/errors/alerts/${alertId}/dismiss`, {
        method: "POST",
      });
      setAlerts(alerts.filter((alert) => alert.id !== alertId));
    } catch (err) {
      console.error("Failed to dismiss alert:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center">
            <Activity className="w-6 h-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold">Performance Monitor</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading metrics...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                <span className="text-red-700">{error}</span>
              </div>
            </div>
          )}

          {/* Alerts Section */}
          {alerts.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3">Active Alerts</h3>
              <div className="space-y-2">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-lg border ${getAlertSeverityColor(
                      alert.severity
                    )}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-1">
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          <span className="font-medium">{alert.message}</span>
                        </div>
                        <div className="text-sm opacity-75">
                          <span className="font-medium">Metric:</span>{" "}
                          {alert.metric} |{" "}
                          <span className="font-medium">Value:</span>{" "}
                          {alert.value} |{" "}
                          <span className="font-medium">Threshold:</span>{" "}
                          {alert.threshold}
                        </div>
                        <div className="text-xs opacity-60 mt-1">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {alert.timestamp.toLocaleString()}
                        </div>
                      </div>
                      <button
                        onClick={() => dismissAlert(alert.id)}
                        className="ml-2 p-1 hover:bg-black hover:bg-opacity-10 rounded transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allMetrics.map((metric) => (
              <div key={metric.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{metric.name}</h4>
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(metric.status)}
                    {getTrendIcon(metric.trend)}
                  </div>
                </div>

                <div className="mb-2">
                  <span className="text-2xl font-bold text-gray-900">
                    {metric.value.toFixed(metric.unit === "ms" ? 0 : 2)}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">
                    {metric.unit}
                  </span>
                </div>

                <div className="text-xs text-gray-500 mb-2">
                  Threshold: {metric.threshold} {metric.unit}
                </div>

                {/* Simple trend visualization */}
                {metric.history.length > 1 && (
                  <div className="h-8 flex items-end space-x-1">
                    {metric.history.slice(-10).map((value, index) => (
                      <div
                        key={index}
                        className={`flex-1 rounded-t ${
                          value > metric.threshold
                            ? "bg-red-300"
                            : value > metric.threshold * 0.8
                            ? "bg-yellow-300"
                            : "bg-green-300"
                        }`}
                        style={{
                          height: `${Math.max(
                            4,
                            (value / Math.max(...metric.history)) * 100
                          )}%`,
                        }}
                      />
                    ))}
                  </div>
                )}

                <div className="text-xs text-gray-400 mt-2">
                  <Clock className="w-3 h-3 inline mr-1" />
                  {metric.timestamp.toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          {/* No Data State */}
          {!isLoading && !error && allMetrics.length === 0 && (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No performance metrics available</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Auto-refresh: {autoRefresh ? "On" : "Off"}
              {autoRefresh && ` (${refreshInterval / 1000}s)`}
            </div>
            <button
              onClick={fetchMetrics}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMonitor;
