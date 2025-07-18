import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Analytics interfaces
export interface PersonalMetrics {
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

export interface PlatformMetrics {
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

export interface QuickStats {
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

export interface AnalyticsFilters {
  timeRange?: "7d" | "30d" | "90d" | "1y";
  userId?: string;
  projectId?: string;
  nodeType?: string;
  category?: string;
}

class AnalyticsService {
  // Personal Analytics
  async getPersonalMetrics(
    filters?: AnalyticsFilters
  ): Promise<PersonalMetrics> {
    const params = new URLSearchParams();
    if (filters?.timeRange) params.append("timeRange", filters.timeRange);
    if (filters?.projectId) params.append("projectId", filters.projectId);

    const response = await api.get(`/api/analytics/personal?${params}`);
    return response.data;
  }

  // Platform Analytics
  async getPlatformMetrics(
    filters?: AnalyticsFilters
  ): Promise<PlatformMetrics> {
    const params = new URLSearchParams();
    if (filters?.timeRange) params.append("timeRange", filters.timeRange);
    if (filters?.category) params.append("category", filters.category);

    const response = await api.get(`/api/analytics/platform?${params}`);
    return response.data;
  }

  // Quick Stats
  async getQuickStats(): Promise<QuickStats> {
    const response = await api.get("/api/analytics/quick-stats");
    return response.data;
  }

  // Activity Tracking
  async trackActivity(activity: {
    userId: string;
    projectId?: string;
    activityType: string;
    duration?: number;
    nodeType?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    await api.post("/api/analytics/track", activity);
  }

  // User Analytics
  async getUserAnalytics(
    userId: string,
    filters?: AnalyticsFilters
  ): Promise<PersonalMetrics> {
    const params = new URLSearchParams();
    if (filters?.timeRange) params.append("timeRange", filters.timeRange);
    if (filters?.projectId) params.append("projectId", filters.projectId);

    const response = await api.get(`/api/analytics/user/${userId}?${params}`);
    return response.data;
  }

  // Project Analytics
  async getProjectAnalytics(
    projectId: string,
    filters?: AnalyticsFilters
  ): Promise<{
    overview: {
      totalNodes: number;
      totalConnections: number;
      totalCollaborators: number;
      lastUpdated: string;
    };
    activity: Array<{
      date: string;
      nodes: number;
      connections: number;
      collaborators: number;
    }>;
    nodeTypes: Array<{ type: string; count: number }>;
    collaboratorActivity: Array<{
      userId: string;
      username: string;
      contributions: number;
    }>;
  }> {
    const params = new URLSearchParams();
    if (filters?.timeRange) params.append("timeRange", filters.timeRange);

    const response = await api.get(
      `/api/analytics/project/${projectId}?${params}`
    );
    return response.data;
  }

  // Export Analytics
  async exportAnalytics(
    type: "personal" | "platform" | "project",
    filters?: AnalyticsFilters
  ): Promise<Blob> {
    const params = new URLSearchParams();
    params.append("type", type);
    if (filters?.timeRange) params.append("timeRange", filters.timeRange);
    if (filters?.userId) params.append("userId", filters.userId);
    if (filters?.projectId) params.append("projectId", filters.projectId);

    const response = await api.get(`/api/analytics/export?${params}`, {
      responseType: "blob",
    });
    return response.data;
  }

  // Real-time Analytics
  async getRealtimeStats(): Promise<{
    activeUsers: number;
    onlineUsers: number;
    currentProjects: number;
    systemLoad: number;
  }> {
    const response = await api.get("/api/analytics/realtime");
    return response.data;
  }

  // Achievements
  async getAchievements(userId?: string): Promise<
    Array<{
      id: string;
      title: string;
      description: string;
      earned: boolean;
      earnedAt?: string;
      progress: number;
      maxProgress: number;
    }>
  > {
    const url = userId
      ? `/api/analytics/achievements/${userId}`
      : "/api/analytics/achievements";
    const response = await api.get(url);
    return response.data;
  }

  // Leaderboard
  async getLeaderboard(
    category: "projects" | "nodes" | "connections" | "time",
    limit = 10
  ): Promise<
    Array<{
      userId: string;
      username: string;
      value: number;
      rank: number;
    }>
  > {
    const response = await api.get(
      `/api/analytics/leaderboard/${category}?limit=${limit}`
    );
    return response.data;
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;
