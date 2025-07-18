import React, { useState, useEffect } from "react";
import AnalyticsChart from "./AnalyticsChart";
import {
  Users,
  Activity,
  TrendingUp,
  Database,
  Globe,
  Timer,
  Award,
  Zap,
} from "lucide-react";

interface PlatformMetrics {
  overview: {
    totalUsers: number;
    activeUsers: number;
    totalProjects: number;
    totalNodes: number;
    totalConnections: number;
    systemUptime: number;
  };
  growth: {
    userGrowth: Array<{ date: string; users: number; activeUsers: number }>;
    projectGrowth: Array<{ date: string; projects: number; nodes: number }>;
    engagementRate: Array<{ date: string; rate: number }>;
  };
  usage: {
    dailyActive: Array<{ date: string; users: number }>;
    projectsByCategory: Array<{ category: string; count: number }>;
    nodeTypeDistribution: Array<{ type: string; count: number }>;
    topFeatures: Array<{ feature: string; usage: number }>;
  };
  leaderboard: {
    topUsers: Array<{
      userId: string;
      username: string;
      totalProjects: number;
      totalNodes: number;
      totalConnections: number;
      lastActive: string;
    }>;
    topProjects: Array<{
      projectId: string;
      name: string;
      nodeCount: number;
      connectionCount: number;
      collaborators: number;
      lastUpdated: string;
    }>;
  };
}

const PlatformAnalytics: React.FC = () => {
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "growth" | "usage" | "leaderboard"
  >("overview");

  useEffect(() => {
    fetchPlatformMetrics();
  }, []);

  const fetchPlatformMetrics = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/analytics/platform", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch platform metrics");
      }

      const data = await response.json();
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="text-red-600 mr-3">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-red-800 font-medium">
              Error Loading Analytics
            </h3>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  const overviewCards = [
    {
      title: "Total Users",
      value: metrics.overview.totalUsers,
      icon: <Users className="w-5 h-5" />,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Active Users",
      value: metrics.overview.activeUsers,
      icon: <Activity className="w-5 h-5" />,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Total Projects",
      value: metrics.overview.totalProjects,
      icon: <Database className="w-5 h-5" />,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Total Nodes",
      value: metrics.overview.totalNodes,
      icon: <Globe className="w-5 h-5" />,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {overviewCards.map((card, index) => (
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
              </div>
              <div className={`${card.bgColor} ${card.color} p-3 rounded-full`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* System Health */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">System Health</h3>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">System Online</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-2">
              <Timer className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-sm font-medium text-gray-600">Uptime</p>
            <p className="text-lg font-bold text-gray-900">
              {Math.round(metrics.overview.systemUptime / 24)}d
            </p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-2">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-sm font-medium text-gray-600">Connections</p>
            <p className="text-lg font-bold text-gray-900">
              {metrics.overview.totalConnections}
            </p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mx-auto mb-2">
              <Zap className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-sm font-medium text-gray-600">Active Rate</p>
            <p className="text-lg font-bold text-gray-900">
              {Math.round(
                (metrics.overview.activeUsers / metrics.overview.totalUsers) *
                  100
              )}
              %
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderGrowth = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <AnalyticsChart
        data={metrics.growth.userGrowth}
        type="line"
        title="User Growth"
        xAxisKey="date"
        yAxisKey="users"
        height={300}
        showLegend={false}
      />
      <AnalyticsChart
        data={metrics.growth.projectGrowth}
        type="area"
        title="Project Growth"
        xAxisKey="date"
        yAxisKey="projects"
        height={300}
        showLegend={false}
      />
      <AnalyticsChart
        data={metrics.growth.engagementRate}
        type="bar"
        title="Engagement Rate"
        xAxisKey="date"
        yAxisKey="rate"
        height={300}
        showLegend={false}
      />
      <AnalyticsChart
        data={metrics.usage.dailyActive}
        type="line"
        title="Daily Active Users"
        xAxisKey="date"
        yAxisKey="users"
        height={300}
        showLegend={false}
      />
    </div>
  );

  const renderUsage = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <AnalyticsChart
        data={metrics.usage.projectsByCategory}
        type="pie"
        title="Projects by Category"
        xAxisKey="category"
        yAxisKey="count"
        height={300}
      />
      <AnalyticsChart
        data={metrics.usage.nodeTypeDistribution}
        type="bar"
        title="Node Type Distribution"
        xAxisKey="type"
        yAxisKey="count"
        height={300}
        showLegend={false}
      />
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Top Features
        </h3>
        <div className="space-y-3">
          {metrics.usage.topFeatures.map((feature, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                {feature.feature}
              </span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{
                      width: `${
                        (feature.usage /
                          Math.max(
                            ...metrics.usage.topFeatures.map((f) => f.usage)
                          )) *
                        100
                      }%`,
                    }}
                  />
                </div>
                <span className="text-sm text-gray-600">{feature.usage}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderLeaderboard = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top Users */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Users</h3>
        <div className="space-y-3">
          {metrics.leaderboard.topUsers.map((user, index) => (
            <div
              key={user.userId}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                  <span className="text-sm font-bold text-blue-600">
                    #{index + 1}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{user.username}</p>
                  <p className="text-sm text-gray-600">
                    {user.totalProjects} projects • {user.totalNodes} nodes
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Award className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium text-gray-700">
                  {user.totalConnections}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Projects */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Top Projects
        </h3>
        <div className="space-y-3">
          {metrics.leaderboard.topProjects.map((project, index) => (
            <div
              key={project.projectId}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                  <span className="text-sm font-bold text-green-600">
                    #{index + 1}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{project.name}</p>
                  <p className="text-sm text-gray-600">
                    {project.nodeCount} nodes • {project.collaborators}{" "}
                    collaborators
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700">
                  {project.connectionCount}
                </p>
                <p className="text-xs text-gray-500">connections</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Platform Analytics
          </h1>
          <p className="text-gray-600 mt-1">
            Monitor system performance and user engagement
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {(["overview", "growth", "usage", "leaderboard"] as const).map(
            (tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                  activeTab === tab
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab}
              </button>
            )
          )}
        </nav>
      </div>

      {/* Content */}
      {activeTab === "overview" && renderOverview()}
      {activeTab === "growth" && renderGrowth()}
      {activeTab === "usage" && renderUsage()}
      {activeTab === "leaderboard" && renderLeaderboard()}
    </div>
  );
};

export default PlatformAnalytics;
