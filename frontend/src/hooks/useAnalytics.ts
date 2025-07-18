import { useState, useEffect, useCallback } from "react";
import {
  analyticsService,
  PersonalMetrics,
  PlatformMetrics,
  QuickStats,
  AnalyticsFilters,
} from "../services/analyticsService";

export const usePersonalAnalytics = (filters?: AnalyticsFilters) => {
  const [metrics, setMetrics] = useState<PersonalMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await analyticsService.getPersonalMetrics(filters);
      setMetrics(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch personal analytics"
      );
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const refresh = useCallback(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return { metrics, loading, error, refresh };
};

export const usePlatformAnalytics = (filters?: AnalyticsFilters) => {
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await analyticsService.getPlatformMetrics(filters);
      setMetrics(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch platform analytics"
      );
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const refresh = useCallback(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return { metrics, loading, error, refresh };
};

export const useQuickStats = () => {
  const [stats, setStats] = useState<QuickStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await analyticsService.getQuickStats();
      setStats(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch quick stats"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const refresh = useCallback(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refresh };
};

export const useAnalyticsTracking = () => {
  const trackActivity = useCallback(
    async (activity: {
      userId: string;
      projectId?: string;
      activityType: string;
      duration?: number;
      nodeType?: string;
      metadata?: Record<string, any>;
    }) => {
      try {
        await analyticsService.trackActivity(activity);
      } catch (error) {
        console.error("Failed to track activity:", error);
      }
    },
    []
  );

  return { trackActivity };
};

export const useRealtimeAnalytics = (interval: number = 30000) => {
  const [realtimeStats, setRealtimeStats] = useState<{
    activeUsers: number;
    onlineUsers: number;
    currentProjects: number;
    systemLoad: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRealtimeStats = useCallback(async () => {
    try {
      setError(null);
      const data = await analyticsService.getRealtimeStats();
      setRealtimeStats(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch realtime stats"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRealtimeStats();
    const intervalId = setInterval(fetchRealtimeStats, interval);

    return () => clearInterval(intervalId);
  }, [fetchRealtimeStats, interval]);

  return { realtimeStats, loading, error, refresh: fetchRealtimeStats };
};

export const useAnalyticsExport = () => {
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const exportAnalytics = useCallback(
    async (
      type: "personal" | "platform" | "project",
      filters?: AnalyticsFilters,
      filename?: string
    ) => {
      try {
        setExporting(true);
        setExportError(null);

        const blob = await analyticsService.exportAnalytics(type, filters);

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download =
          filename ||
          `analytics-${type}-${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (err) {
        setExportError(
          err instanceof Error ? err.message : "Failed to export analytics"
        );
      } finally {
        setExporting(false);
      }
    },
    []
  );

  return { exportAnalytics, exporting, exportError };
};

export const useAchievements = (userId?: string) => {
  const [achievements, setAchievements] = useState<
    Array<{
      id: string;
      title: string;
      description: string;
      earned: boolean;
      earnedAt?: string;
      progress: number;
      maxProgress: number;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAchievements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await analyticsService.getAchievements(userId);
      setAchievements(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch achievements"
      );
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  const refresh = useCallback(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  return { achievements, loading, error, refresh };
};

export const useLeaderboard = (
  category: "projects" | "nodes" | "connections" | "time",
  limit = 10
) => {
  const [leaderboard, setLeaderboard] = useState<
    Array<{
      userId: string;
      username: string;
      value: number;
      rank: number;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await analyticsService.getLeaderboard(category, limit);
      setLeaderboard(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch leaderboard"
      );
    } finally {
      setLoading(false);
    }
  }, [category, limit]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const refresh = useCallback(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return { leaderboard, loading, error, refresh };
};
