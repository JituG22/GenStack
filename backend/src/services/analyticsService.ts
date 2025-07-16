import {
  AnalyticsEvent,
  PerformanceMetric,
  FilterAnalytics,
  UserBehavior,
  IAnalyticsEvent,
  IPerformanceMetric,
  IFilterAnalytics,
  IUserBehavior,
} from "../models/Analytics";
import mongoose from "mongoose";

export interface DashboardMetrics {
  totalEvents: number;
  activeUsers: number;
  averagePerformance: number;
  topFilters: Array<{
    filterType: string;
    count: number;
    avgExecutionTime: number;
  }>;
  recentActivity: Array<{
    eventType: string;
    timestamp: Date;
    count: number;
  }>;
  performanceTrends: Array<{
    timestamp: Date;
    avgExecutionTime: number;
    queryCount: number;
  }>;
}

export interface FilterUsageStats {
  totalFilters: number;
  popularFilters: Array<{
    filterType: string;
    count: number;
    avgExecutionTime: number;
    successRate: number;
  }>;
  performanceMetrics: {
    averageExecutionTime: number;
    slowestQueries: Array<{
      filterId: string;
      executionTime: number;
      timestamp: Date;
    }>;
    fastestQueries: Array<{
      filterId: string;
      executionTime: number;
      timestamp: Date;
    }>;
  };
  usagePatterns: Array<{
    hour: number;
    count: number;
  }>;
}

export interface SystemPerformanceStats {
  queryMetrics: {
    averageTime: number;
    totalQueries: number;
    slowQueries: number;
    errorRate: number;
  };
  cacheMetrics: {
    hitRate: number;
    missRate: number;
    totalRequests: number;
  };
  systemMetrics: {
    cpuUsage: number;
    memoryUsage: number;
    activeConnections: number;
  };
}

export class AnalyticsService {
  // Track analytics events
  async trackEvent(
    eventData: Omit<IAnalyticsEvent, "_id" | "createdAt" | "updatedAt">
  ): Promise<void> {
    try {
      const event = new AnalyticsEvent(eventData);
      await event.save();
    } catch (error) {
      console.error("Error tracking analytics event:", error);
      // Don't throw error to avoid disrupting main application flow
    }
  }

  // Track performance metrics
  async trackPerformance(
    metricData: Omit<IPerformanceMetric, "_id" | "createdAt" | "updatedAt">
  ): Promise<void> {
    try {
      const metric = new PerformanceMetric(metricData);
      await metric.save();
    } catch (error) {
      console.error("Error tracking performance metric:", error);
    }
  }

  // Track filter analytics
  async trackFilterUsage(
    filterData: Omit<IFilterAnalytics, "_id" | "createdAt" | "updatedAt">
  ): Promise<void> {
    try {
      const analytics = new FilterAnalytics(filterData);
      await analytics.save();
    } catch (error) {
      console.error("Error tracking filter analytics:", error);
    }
  }

  // Track user behavior
  async trackUserBehavior(
    behaviorData: Omit<IUserBehavior, "_id" | "createdAt" | "updatedAt">
  ): Promise<void> {
    try {
      const behavior = new UserBehavior(behaviorData);
      await behavior.save();
    } catch (error) {
      console.error("Error tracking user behavior:", error);
    }
  }

  // Get dashboard metrics
  async getDashboardMetrics(
    organizationId: string,
    timeRange: string = "24h"
  ): Promise<DashboardMetrics> {
    const timeFilter = this.getTimeFilter(timeRange);

    try {
      // Total events
      const totalEvents = await AnalyticsEvent.countDocuments({
        organizationId: new mongoose.Types.ObjectId(organizationId),
        timestamp: timeFilter,
      });

      // Active users
      const activeUsers = await AnalyticsEvent.distinct("userId", {
        organizationId: new mongoose.Types.ObjectId(organizationId),
        timestamp: timeFilter,
      });

      // Average performance
      const performanceMetrics = await PerformanceMetric.aggregate([
        {
          $match: {
            organizationId: new mongoose.Types.ObjectId(organizationId),
            metricType: "query",
            timestamp: timeFilter,
          },
        },
        {
          $group: {
            _id: null,
            avgTime: { $avg: "$value" },
          },
        },
      ]);

      // Top filters
      const topFilters = await FilterAnalytics.aggregate([
        {
          $match: {
            organizationId: new mongoose.Types.ObjectId(organizationId),
            timestamp: timeFilter,
          },
        },
        {
          $group: {
            _id: "$filterType",
            count: { $sum: 1 },
            avgExecutionTime: { $avg: "$executionTime" },
          },
        },
        {
          $sort: { count: -1 },
        },
        {
          $limit: 10,
        },
        {
          $project: {
            filterType: "$_id",
            count: 1,
            avgExecutionTime: { $round: ["$avgExecutionTime", 2] },
            _id: 0,
          },
        },
      ]);

      // Recent activity
      const recentActivity = await AnalyticsEvent.aggregate([
        {
          $match: {
            organizationId: new mongoose.Types.ObjectId(organizationId),
            timestamp: timeFilter,
          },
        },
        {
          $group: {
            _id: {
              eventType: "$eventType",
              hour: { $hour: "$timestamp" },
            },
            count: { $sum: 1 },
            timestamp: { $first: "$timestamp" },
          },
        },
        {
          $sort: { timestamp: -1 },
        },
        {
          $limit: 20,
        },
        {
          $project: {
            eventType: "$_id.eventType",
            timestamp: 1,
            count: 1,
            _id: 0,
          },
        },
      ]);

      // Performance trends
      const performanceTrends = await PerformanceMetric.aggregate([
        {
          $match: {
            organizationId: new mongoose.Types.ObjectId(organizationId),
            metricType: "query",
            timestamp: timeFilter,
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$timestamp" },
              month: { $month: "$timestamp" },
              day: { $dayOfMonth: "$timestamp" },
              hour: { $hour: "$timestamp" },
            },
            avgExecutionTime: { $avg: "$value" },
            queryCount: { $sum: 1 },
          },
        },
        {
          $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1, "_id.hour": 1 },
        },
        {
          $project: {
            timestamp: {
              $dateFromParts: {
                year: "$_id.year",
                month: "$_id.month",
                day: "$_id.day",
                hour: "$_id.hour",
              },
            },
            avgExecutionTime: { $round: ["$avgExecutionTime", 2] },
            queryCount: 1,
            _id: 0,
          },
        },
      ]);

      return {
        totalEvents,
        activeUsers: activeUsers.length,
        averagePerformance: performanceMetrics[0]?.avgTime || 0,
        topFilters,
        recentActivity,
        performanceTrends,
      };
    } catch (error) {
      console.error("Error getting dashboard metrics:", error);
      throw new Error("Failed to fetch dashboard metrics");
    }
  }

  // Get filter usage statistics
  async getFilterUsageStats(
    organizationId: string,
    timeRange: string = "7d"
  ): Promise<FilterUsageStats> {
    const timeFilter = this.getTimeFilter(timeRange);

    try {
      // Total filters
      const totalFilters = await FilterAnalytics.countDocuments({
        organizationId: new mongoose.Types.ObjectId(organizationId),
        timestamp: timeFilter,
      });

      // Popular filters
      const popularFilters = await FilterAnalytics.aggregate([
        {
          $match: {
            organizationId: new mongoose.Types.ObjectId(organizationId),
            timestamp: timeFilter,
          },
        },
        {
          $group: {
            _id: "$filterType",
            count: { $sum: 1 },
            avgExecutionTime: { $avg: "$executionTime" },
            successCount: { $sum: { $cond: ["$successful", 1, 0] } },
          },
        },
        {
          $project: {
            filterType: "$_id",
            count: 1,
            avgExecutionTime: { $round: ["$avgExecutionTime", 2] },
            successRate: {
              $round: [
                { $multiply: [{ $divide: ["$successCount", "$count"] }, 100] },
                1,
              ],
            },
            _id: 0,
          },
        },
        {
          $sort: { count: -1 },
        },
      ]);

      // Performance metrics
      const performanceAgg = await FilterAnalytics.aggregate([
        {
          $match: {
            organizationId: new mongoose.Types.ObjectId(organizationId),
            timestamp: timeFilter,
          },
        },
        {
          $group: {
            _id: null,
            avgExecutionTime: { $avg: "$executionTime" },
          },
        },
      ]);

      // Slowest queries
      const slowestQueries = await FilterAnalytics.find({
        organizationId: new mongoose.Types.ObjectId(organizationId),
        timestamp: timeFilter,
        successful: true,
      })
        .sort({ executionTime: -1 })
        .limit(10)
        .select("filterId executionTime timestamp");

      // Fastest queries
      const fastestQueries = await FilterAnalytics.find({
        organizationId: new mongoose.Types.ObjectId(organizationId),
        timestamp: timeFilter,
        successful: true,
      })
        .sort({ executionTime: 1 })
        .limit(10)
        .select("filterId executionTime timestamp");

      // Usage patterns by hour
      const usagePatterns = await FilterAnalytics.aggregate([
        {
          $match: {
            organizationId: new mongoose.Types.ObjectId(organizationId),
            timestamp: timeFilter,
          },
        },
        {
          $group: {
            _id: { $hour: "$timestamp" },
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            hour: "$_id",
            count: 1,
            _id: 0,
          },
        },
        {
          $sort: { hour: 1 },
        },
      ]);

      return {
        totalFilters,
        popularFilters,
        performanceMetrics: {
          averageExecutionTime: performanceAgg[0]?.avgExecutionTime || 0,
          slowestQueries,
          fastestQueries,
        },
        usagePatterns,
      };
    } catch (error) {
      console.error("Error getting filter usage stats:", error);
      throw new Error("Failed to fetch filter usage statistics");
    }
  }

  // Get system performance statistics
  async getSystemPerformanceStats(
    organizationId: string,
    timeRange: string = "1h"
  ): Promise<SystemPerformanceStats> {
    const timeFilter = this.getTimeFilter(timeRange);

    try {
      // Query metrics
      const queryMetrics = await PerformanceMetric.aggregate([
        {
          $match: {
            organizationId: new mongoose.Types.ObjectId(organizationId),
            metricType: "query",
            timestamp: timeFilter,
          },
        },
        {
          $group: {
            _id: null,
            averageTime: { $avg: "$value" },
            totalQueries: { $sum: 1 },
            slowQueries: {
              $sum: { $cond: [{ $gt: ["$value", 1000] }, 1, 0] },
            },
          },
        },
      ]);

      // Cache metrics
      const cacheMetrics = await PerformanceMetric.aggregate([
        {
          $match: {
            organizationId: new mongoose.Types.ObjectId(organizationId),
            metricType: "cache",
            timestamp: timeFilter,
          },
        },
        {
          $group: {
            _id: "$metricName",
            totalValue: { $sum: "$value" },
          },
        },
      ]);

      // System metrics
      const systemMetrics = await PerformanceMetric.aggregate([
        {
          $match: {
            organizationId: new mongoose.Types.ObjectId(organizationId),
            metricType: "system",
            timestamp: timeFilter,
          },
        },
        {
          $group: {
            _id: "$metricName",
            averageValue: { $avg: "$value" },
          },
        },
      ]);

      // Process cache metrics
      const cacheHits =
        cacheMetrics.find((m) => m._id === "cache_hits")?.totalValue || 0;
      const cacheMisses =
        cacheMetrics.find((m) => m._id === "cache_misses")?.totalValue || 0;
      const totalCacheRequests = cacheHits + cacheMisses;

      // Process system metrics
      const cpuUsage =
        systemMetrics.find((m) => m._id === "cpu_usage")?.averageValue || 0;
      const memoryUsage =
        systemMetrics.find((m) => m._id === "memory_usage")?.averageValue || 0;
      const activeConnections =
        systemMetrics.find((m) => m._id === "active_connections")
          ?.averageValue || 0;

      const queryData = queryMetrics[0] || {
        averageTime: 0,
        totalQueries: 0,
        slowQueries: 0,
      };

      return {
        queryMetrics: {
          averageTime: Math.round(queryData.averageTime || 0),
          totalQueries: queryData.totalQueries || 0,
          slowQueries: queryData.slowQueries || 0,
          errorRate:
            queryData.totalQueries > 0
              ? Math.round(
                  (queryData.slowQueries / queryData.totalQueries) * 100 * 10
                ) / 10
              : 0,
        },
        cacheMetrics: {
          hitRate:
            totalCacheRequests > 0
              ? Math.round((cacheHits / totalCacheRequests) * 100 * 10) / 10
              : 0,
          missRate:
            totalCacheRequests > 0
              ? Math.round((cacheMisses / totalCacheRequests) * 100 * 10) / 10
              : 0,
          totalRequests: totalCacheRequests,
        },
        systemMetrics: {
          cpuUsage: Math.round(cpuUsage * 10) / 10,
          memoryUsage: Math.round(memoryUsage * 10) / 10,
          activeConnections: Math.round(activeConnections),
        },
      };
    } catch (error) {
      console.error("Error getting system performance stats:", error);
      throw new Error("Failed to fetch system performance statistics");
    }
  }

  // Get user behavior analytics
  async getUserBehaviorStats(organizationId: string, timeRange: string = "7d") {
    const timeFilter = this.getTimeFilter(timeRange);

    try {
      const behaviorStats = await UserBehavior.aggregate([
        {
          $match: {
            organizationId: new mongoose.Types.ObjectId(organizationId),
            sessionStart: timeFilter,
          },
        },
        {
          $group: {
            _id: null,
            totalSessions: { $sum: 1 },
            averageSessionDuration: { $avg: "$totalDuration" },
            totalPageViews: { $sum: { $size: "$pageViews" } },
            totalInteractions: { $sum: { $size: "$interactions" } },
            totalSearches: { $sum: { $size: "$searchQueries" } },
            totalFilters: { $sum: { $size: "$filtersUsed" } },
          },
        },
      ]);

      return (
        behaviorStats[0] || {
          totalSessions: 0,
          averageSessionDuration: 0,
          totalPageViews: 0,
          totalInteractions: 0,
          totalSearches: 0,
          totalFilters: 0,
        }
      );
    } catch (error) {
      console.error("Error getting user behavior stats:", error);
      throw new Error("Failed to fetch user behavior statistics");
    }
  }

  // Helper method to generate time filters
  private getTimeFilter(timeRange: string): { $gte: Date } {
    const now = new Date();
    let startTime: Date;

    switch (timeRange) {
      case "1h":
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case "24h":
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "7d":
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    return { $gte: startTime };
  }

  // Generate analytics insights
  async generateInsights(organizationId: string): Promise<string[]> {
    const insights: string[] = [];

    try {
      // Get recent filter analytics
      const recentFilters = await FilterAnalytics.find({
        organizationId: new mongoose.Types.ObjectId(organizationId),
        timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      });

      if (recentFilters.length > 0) {
        const avgExecutionTime =
          recentFilters.reduce((sum, f) => sum + f.executionTime, 0) /
          recentFilters.length;

        if (avgExecutionTime > 500) {
          insights.push(
            "Filter performance is slower than optimal. Consider optimizing database indexes."
          );
        }

        const failureRate =
          recentFilters.filter((f) => !f.successful).length /
          recentFilters.length;
        if (failureRate > 0.05) {
          insights.push(
            "Filter failure rate is above 5%. Review filter validation logic."
          );
        }

        const popularFilter = recentFilters.reduce((acc, filter) => {
          acc[filter.filterType] = (acc[filter.filterType] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const mostUsed = Object.entries(popularFilter).reduce((a, b) =>
          popularFilter[a[0]] > popularFilter[b[0]] ? a : b
        );

        insights.push(
          `Most popular filter type: ${mostUsed[0]} (${mostUsed[1]} uses)`
        );
      }

      return insights;
    } catch (error) {
      console.error("Error generating insights:", error);
      return ["Unable to generate insights at this time."];
    }
  }
}

export const analyticsService = new AnalyticsService();
