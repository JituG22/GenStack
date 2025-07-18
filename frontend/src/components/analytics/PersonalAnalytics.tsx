import React, { useState, useEffect } from "react";
import AnalyticsChart from "./AnalyticsChart";
import { User, Activity, TrendingUp, Clock, Award, Target } from "lucide-react";

interface PersonalMetrics {
  overview: {
    totalProjects: number;
    totalNodes: number;
    totalConnections: number;
    totalTimeSpent: number;
    rankPosition: number;
    totalUsers: number;
  };
  activity: {
    daily: Array<{
      date: string;
      projects: number;
      nodes: number;
      time: number;
    }>;
    weekly: Array<{
      week: string;
      projects: number;
      nodes: number;
      time: number;
    }>;
    monthly: Array<{
      month: string;
      projects: number;
      nodes: number;
      time: number;
    }>;
  };
  performance: {
    projectsCreated: Array<{ date: string; count: number }>;
    nodesCreated: Array<{ date: string; count: number }>;
    timeSpent: Array<{ date: string; hours: number }>;
  };
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    earned: boolean;
    earnedAt?: string;
    progress: number;
    maxProgress: number;
  }>;
}

const PersonalAnalytics: React.FC = () => {
  const [metrics, setMetrics] = useState<PersonalMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<"daily" | "weekly" | "monthly">(
    "daily"
  );

  useEffect(() => {
    fetchPersonalMetrics();
  }, []);

  const fetchPersonalMetrics = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/analytics/personal", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch personal metrics");
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
      title: "Total Projects",
      value: metrics.overview.totalProjects,
      icon: <User className="w-5 h-5" />,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Total Nodes",
      value: metrics.overview.totalNodes,
      icon: <Activity className="w-5 h-5" />,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Connections",
      value: metrics.overview.totalConnections,
      icon: <TrendingUp className="w-5 h-5" />,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Time Spent",
      value: `${Math.round(metrics.overview.totalTimeSpent / 60)}h`,
      icon: <Clock className="w-5 h-5" />,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  const currentActivity = metrics.activity[timeRange];
  const activityData = currentActivity.map((item) => {
    let name: string;
    if (timeRange === "daily") {
      name = (item as any).date;
    } else if (timeRange === "weekly") {
      name = (item as any).week;
    } else {
      name = (item as any).month;
    }

    return {
      name,
      projects: item.projects,
      nodes: item.nodes,
      time: Math.round(item.time / 60), // Convert to hours
    };
  });

  const projectsData = metrics.performance.projectsCreated.map((item) => ({
    name: item.date,
    value: item.count,
  }));

  const nodesData = metrics.performance.nodesCreated.map((item) => ({
    name: item.date,
    value: item.count,
  }));

  const timeData = metrics.performance.timeSpent.map((item) => ({
    name: item.date,
    value: item.hours,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Personal Analytics
          </h1>
          <p className="text-gray-600 mt-1">
            Track your progress and achievements
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Award className="w-5 h-5 text-yellow-500" />
          <span className="text-sm font-medium text-gray-700">
            Rank #{metrics.overview.rankPosition} of{" "}
            {metrics.overview.totalUsers}
          </span>
        </div>
      </div>

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

      {/* Activity Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Activity Overview
            </h3>
            <div className="flex bg-gray-100 rounded-lg p-1">
              {(["daily", "weekly", "monthly"] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 text-sm font-medium rounded-md capitalize transition-colors ${
                    timeRange === range
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
          <AnalyticsChart
            data={activityData}
            type="bar"
            xAxisKey="name"
            yAxisKey="projects"
            height={250}
            showLegend={false}
          />
        </div>

        {/* Projects Created */}
        <AnalyticsChart
          data={projectsData}
          type="line"
          title="Projects Created"
          xAxisKey="name"
          yAxisKey="value"
          height={300}
          showLegend={false}
        />

        {/* Nodes Created */}
        <AnalyticsChart
          data={nodesData}
          type="area"
          title="Nodes Created"
          xAxisKey="name"
          yAxisKey="value"
          height={300}
          showLegend={false}
        />

        {/* Time Spent */}
        <AnalyticsChart
          data={timeData}
          type="bar"
          title="Time Spent (Hours)"
          xAxisKey="name"
          yAxisKey="value"
          height={300}
          showLegend={false}
        />
      </div>

      {/* Achievements */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Achievements</h3>
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-green-500" />
            <span className="text-sm font-medium text-gray-700">
              {metrics.achievements.filter((a) => a.earned).length} /{" "}
              {metrics.achievements.length} Unlocked
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {metrics.achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`p-4 rounded-lg border-2 transition-all ${
                achievement.earned
                  ? "border-green-200 bg-green-50"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4
                  className={`font-medium ${
                    achievement.earned ? "text-green-900" : "text-gray-700"
                  }`}
                >
                  {achievement.title}
                </h4>
                {achievement.earned && (
                  <Award className="w-5 h-5 text-yellow-500" />
                )}
              </div>
              <p
                className={`text-sm mb-3 ${
                  achievement.earned ? "text-green-700" : "text-gray-600"
                }`}
              >
                {achievement.description}
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    achievement.earned ? "bg-green-500" : "bg-blue-500"
                  }`}
                  style={{
                    width: `${
                      (achievement.progress / achievement.maxProgress) * 100
                    }%`,
                  }}
                />
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-500">
                  {achievement.progress} / {achievement.maxProgress}
                </span>
                {achievement.earned && achievement.earnedAt && (
                  <span className="text-xs text-green-600">
                    Earned {new Date(achievement.earnedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PersonalAnalytics;
