import React, { useState, useEffect } from "react";
import PersonalAnalytics from "./PersonalAnalytics";
import PlatformAnalytics from "./PlatformAnalytics";
import {
  BarChart3,
  TrendingUp,
  Users,
  Activity,
  RefreshCw,
  Download,
  Calendar,
} from "lucide-react";

interface QuickStats {
  personalStats: {
    totalProjects: number;
    totalNodes: number;
    weeklyActivity: number;
    rank: number;
  };
  platformStats: {
    totalUsers: number;
    activeUsers: number;
    totalProjects: number;
    growthRate: number;
  };
}

const AnalyticsDashboard: React.FC = () => {
  const [activeView, setActiveView] = useState<"personal" | "platform">(
    "personal"
  );
  const [quickStats, setQuickStats] = useState<QuickStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchQuickStats();
  }, []);

  const fetchQuickStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/analytics/quick-stats", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setQuickStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch quick stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchQuickStats();
    setRefreshing(false);
  };

  const handleExport = () => {
    // Implementation for exporting analytics data
    console.log("Exporting analytics data...");
  };

  const quickStatsCards = [
    {
      title: "Your Projects",
      value: quickStats?.personalStats.totalProjects || 0,
      icon: <BarChart3 className="w-5 h-5" />,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      change: "+12%",
    },
    {
      title: "Your Nodes",
      value: quickStats?.personalStats.totalNodes || 0,
      icon: <Activity className="w-5 h-5" />,
      color: "text-green-600",
      bgColor: "bg-green-50",
      change: "+8%",
    },
    {
      title: "Platform Users",
      value: quickStats?.platformStats.totalUsers || 0,
      icon: <Users className="w-5 h-5" />,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      change: "+15%",
    },
    {
      title: "Growth Rate",
      value: `${quickStats?.platformStats.growthRate || 0}%`,
      icon: <TrendingUp className="w-5 h-5" />,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      change: "+3%",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Comprehensive insights into your activity and platform metrics
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
            <span className="text-sm font-medium text-gray-700">Refresh</span>
          </button>
          <button
            onClick={handleExport}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm font-medium">Export</span>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      {!loading && quickStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickStatsCards.map((card, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {card.value}
                  </p>
                  <div className="flex items-center mt-2">
                    <span className="text-sm text-green-600 font-medium">
                      {card.change}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">
                      from last week
                    </span>
                  </div>
                </div>
                <div
                  className={`${card.bgColor} ${card.color} p-3 rounded-full`}
                >
                  {card.icon}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Toggle */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1">
        <div className="flex">
          <button
            onClick={() => setActiveView("personal")}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md transition-colors ${
              activeView === "personal"
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <Activity className="w-5 h-5" />
            <span className="font-medium">Personal Analytics</span>
          </button>
          <button
            onClick={() => setActiveView("platform")}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md transition-colors ${
              activeView === "platform"
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="font-medium">Platform Analytics</span>
          </button>
        </div>
      </div>

      {/* Analytics Content */}
      {activeView === "personal" && <PersonalAnalytics />}
      {activeView === "platform" && <PlatformAnalytics />}

      {/* Last Updated */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>Last updated: {new Date().toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
