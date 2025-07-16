import React, { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { api } from "../lib/api";

interface DashboardMetrics {
  totalEvents: number;
  uniqueUsers: number;
  averageSessionTime: number;
  topActions: Array<{ action: string; count: number }>;
  eventTrends: Array<{ date: string; events: number }>;
  performanceMetrics: {
    averageResponseTime: number;
    errorRate: number;
    throughput: number;
  };
}

interface RealTimeEvent {
  eventType: string;
  eventCategory: string;
  eventAction: string;
  timestamp: Date;
  type?: string;
}

interface AnalyticsDashboardProps {
  className?: string;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  className = "",
}) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [timeRange, setTimeRange] = useState("7d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [realTimeEvents, setRealTimeEvents] = useState<RealTimeEvent[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "disconnected" | "connecting"
  >("disconnected");

  useEffect(() => {
    fetchAnalyticsData();
    initializeWebSocket();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [timeRange]);

  const initializeWebSocket = () => {
    setConnectionStatus("connecting");
    const newSocket = io("http://localhost:5000", {
      withCredentials: true,
    });

    newSocket.on("connect", () => {
      console.log("Analytics Dashboard connected to WebSocket");
      setConnectionStatus("connected");
      // Join organization room for real-time updates
      newSocket.emit("join_organization", "test-org-123");
    });

    newSocket.on("disconnect", () => {
      console.log("Analytics Dashboard disconnected from WebSocket");
      setConnectionStatus("disconnected");
    });

    // Listen for real-time analytics updates
    newSocket.on("analytics_update", (data: any) => {
      console.log("Real-time analytics update:", data);
      const newEvent: RealTimeEvent = {
        eventType: data.data?.eventType || data.type || "unknown",
        eventCategory: data.data?.eventCategory || "real-time",
        eventAction: data.data?.eventAction || "update",
        timestamp: new Date(data.timestamp),
        type: data.type,
      };

      setRealTimeEvents((prev) => [newEvent, ...prev].slice(0, 10)); // Keep only last 10 events

      // Update metrics if needed
      if (metrics) {
        setMetrics((prev) =>
          prev
            ? {
                ...prev,
                totalEvents: prev.totalEvents + 1,
              }
            : null
        );
      }
    });

    // Listen for performance alerts
    newSocket.on("performance_alert", (data: any) => {
      console.log("Performance alert received:", data);
      const alertEvent: RealTimeEvent = {
        eventType: "performance_alert",
        eventCategory: "system",
        eventAction: data.alert?.type || "threshold_exceeded",
        timestamp: new Date(data.timestamp),
        type: "performance_alert",
      };

      setRealTimeEvents((prev) => [alertEvent, ...prev].slice(0, 10));
    });

    setSocket(newSocket);
  };

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = (await api.get(
        `/analytics/dashboard?timeRange=${timeRange}`
      )) as any;
      setMetrics(response.data.data);
    } catch (err) {
      setError("Failed to load analytics data");
      console.error("Analytics fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Analytics Dashboard
          </h1>
          <div className="flex items-center mt-2">
            <div
              className={`inline-block w-2 h-2 rounded-full mr-2 ${
                connectionStatus === "connected"
                  ? "bg-green-500"
                  : connectionStatus === "connecting"
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }`}
            ></div>
            <span className="text-sm text-gray-600">
              Real-time:{" "}
              {connectionStatus === "connected"
                ? "Connected"
                : connectionStatus === "connecting"
                ? "Connecting..."
                : "Disconnected"}
            </span>
          </div>
        </div>
        <div className="flex space-x-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="1d">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>
      </div>

      {metrics && (
        <>
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-6 w-6 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Events
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {metrics.totalEvents.toLocaleString()}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-6 w-6 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                      />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Unique Users
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {metrics.uniqueUsers.toLocaleString()}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-6 w-6 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Avg Session Time
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {Math.round(metrics.averageSessionTime / 60)}m
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-6 w-6 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Avg Response Time
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {metrics.performanceMetrics.averageResponseTime}ms
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Event Trends Chart */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Event Trends
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metrics.eventTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="events"
                    stroke="#8884d8"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Top Actions Chart */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Top Actions
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metrics.topActions}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="action" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Performance Overview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {metrics.performanceMetrics.averageResponseTime}ms
                </div>
                <div className="text-sm text-gray-500">
                  Average Response Time
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {(metrics.performanceMetrics.errorRate * 100).toFixed(2)}%
                </div>
                <div className="text-sm text-gray-500">Error Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {metrics.performanceMetrics.throughput.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">Requests/Hour</div>
              </div>
            </div>
          </div>

          {/* Real-time Events */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Real-time Events
              </h3>
              <div
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  connectionStatus === "connected"
                    ? "bg-green-100 text-green-800"
                    : connectionStatus === "connecting"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {connectionStatus === "connected"
                  ? "Live"
                  : connectionStatus === "connecting"
                  ? "Connecting"
                  : "Offline"}
              </div>
            </div>

            {realTimeEvents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📊</div>
                <p>Waiting for real-time events...</p>
                <p className="text-sm">
                  Try the WebSocket test page to generate events
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {realTimeEvents.map((event, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded border-l-4 ${
                      event.type === "performance_alert"
                        ? "border-l-red-500 bg-red-50"
                        : "border-l-blue-500 bg-blue-50"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-sm">
                          {event.eventCategory} • {event.eventAction}
                        </div>
                        <div className="text-xs text-gray-600">
                          Type: {event.eventType}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {event.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
