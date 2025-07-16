import { Request, Response, NextFunction } from "express";
import { analyticsService } from "../services/analyticsService";
import os from "os";

// Extend Request interface to include performance data
declare global {
  namespace Express {
    interface Request {
      startTime?: number;
      user?: {
        id: string;
        organizationId: string;
        [key: string]: any;
      };
      performanceMetrics?: {
        requestId: string;
        method: string;
        url: string;
        userAgent?: string;
        ip?: string;
      };
    }
  }
}

export interface PerformanceData {
  requestDuration: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: number;
  timestamp: Date;
}

class PerformanceMonitor {
  private requestCount = 0;
  private totalRequestTime = 0;
  private slowRequestThreshold = 1000; // ms
  private slowRequests: Array<{
    url: string;
    duration: number;
    timestamp: Date;
  }> = [];

  // Middleware to track request performance
  trackRequest() {
    return (req: Request, res: Response, next: NextFunction) => {
      req.startTime = Date.now();
      req.performanceMetrics = {
        requestId: this.generateRequestId(),
        method: req.method,
        url: req.originalUrl,
        userAgent: req.get("User-Agent"),
        ip: req.ip,
      };

      // Override res.end to capture response time
      const originalEnd = res.end;
      res.end = function (chunk?: any, encoding?: any): any {
        const endTime = Date.now();
        const duration = endTime - (req.startTime || endTime);

        // Track request metrics
        performanceMonitor.recordRequest(req, res, duration);

        // Call original end method
        return originalEnd.call(this, chunk, encoding);
      };

      next();
    };
  }

  // Record request performance data
  private recordRequest(req: Request, res: Response, duration: number) {
    this.requestCount++;
    this.totalRequestTime += duration;

    // Track slow requests
    if (duration > this.slowRequestThreshold) {
      this.slowRequests.push({
        url: req.originalUrl,
        duration,
        timestamp: new Date(),
      });

      // Keep only last 100 slow requests
      if (this.slowRequests.length > 100) {
        this.slowRequests = this.slowRequests.slice(-100);
      }
    }

    // Track performance metrics if user is authenticated
    if (req.user && req.user.organizationId) {
      this.trackPerformanceMetric(req.user.organizationId, {
        metricType: "request",
        metricName: "request_duration",
        value: duration,
        unit: "ms",
        timestamp: new Date(),
        organizationId: req.user.organizationId,
        metadata: {
          method: req.method,
          url: req.originalUrl,
          statusCode: res.statusCode,
          userAgent: req.get("User-Agent"),
          ip: req.ip,
        },
        tags: [
          `method:${req.method}`,
          `status:${res.statusCode}`,
          `slow:${duration > this.slowRequestThreshold}`,
        ],
      });
    }
  }

  // Track database query performance
  trackDatabaseQuery(
    organizationId: string,
    queryType: string,
    duration: number,
    metadata: any = {}
  ) {
    this.trackPerformanceMetric(organizationId, {
      metricType: "query",
      metricName: `db_${queryType}`,
      value: duration,
      unit: "ms",
      timestamp: new Date(),
      organizationId,
      metadata: {
        queryType,
        ...metadata,
      },
      tags: [`query_type:${queryType}`, `slow:${duration > 500}`],
    });
  }

  // Track cache performance
  trackCacheOperation(
    organizationId: string,
    operation: "hit" | "miss",
    key: string,
    duration?: number
  ) {
    this.trackPerformanceMetric(organizationId, {
      metricType: "cache",
      metricName: `cache_${operation}`,
      value: operation === "hit" ? 1 : 0,
      unit: "count",
      timestamp: new Date(),
      organizationId,
      metadata: {
        operation,
        key,
        duration: duration || 0,
      },
      tags: [
        `operation:${operation}`,
        `key_prefix:${key.split(":")[0] || "unknown"}`,
      ],
    });
  }

  // Track system performance
  async trackSystemMetrics(organizationId: string) {
    try {
      const memoryUsage = process.memoryUsage();
      const cpuUsage = await this.getCpuUsage();
      const loadAverage = os.loadavg();

      // Memory usage
      this.trackPerformanceMetric(organizationId, {
        metricType: "system",
        metricName: "memory_usage",
        value: memoryUsage.heapUsed / 1024 / 1024, // MB
        unit: "mb",
        timestamp: new Date(),
        organizationId,
        metadata: {
          heapTotal: memoryUsage.heapTotal,
          heapUsed: memoryUsage.heapUsed,
          external: memoryUsage.external,
          rss: memoryUsage.rss,
        },
        tags: ["type:memory"],
      });

      // CPU usage
      this.trackPerformanceMetric(organizationId, {
        metricType: "system",
        metricName: "cpu_usage",
        value: cpuUsage,
        unit: "percentage",
        timestamp: new Date(),
        organizationId,
        metadata: {
          loadAverage: loadAverage,
          platform: os.platform(),
          arch: os.arch(),
        },
        tags: ["type:cpu"],
      });

      // Active connections (approximation based on request count)
      this.trackPerformanceMetric(organizationId, {
        metricType: "system",
        metricName: "active_connections",
        value: this.getActiveConnections(),
        unit: "count",
        timestamp: new Date(),
        organizationId,
        metadata: {
          totalRequests: this.requestCount,
          averageResponseTime: this.getAverageResponseTime(),
        },
        tags: ["type:connections"],
      });
    } catch (error) {
      console.error("Error tracking system metrics:", error);
    }
  }

  // Get current performance stats
  getPerformanceStats() {
    return {
      totalRequests: this.requestCount,
      averageResponseTime: this.getAverageResponseTime(),
      slowRequests: this.slowRequests.length,
      recentSlowRequests: this.slowRequests.slice(-10),
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
    };
  }

  // Helper method to track performance metrics
  private async trackPerformanceMetric(
    organizationId: string,
    metricData: any
  ) {
    try {
      await analyticsService.trackPerformance(metricData);
    } catch (error) {
      console.error("Error tracking performance metric:", error);
    }
  }

  // Generate unique request ID
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Calculate average response time
  private getAverageResponseTime(): number {
    return this.requestCount > 0
      ? Math.round(this.totalRequestTime / this.requestCount)
      : 0;
  }

  // Get CPU usage percentage
  private async getCpuUsage(): Promise<number> {
    return new Promise((resolve) => {
      const startUsage = process.cpuUsage();
      const startTime = process.hrtime();

      setTimeout(() => {
        const endUsage = process.cpuUsage(startUsage);
        const endTime = process.hrtime(startTime);

        const totalTime = endTime[0] * 1000000 + endTime[1] / 1000; // microseconds
        const totalUsage = endUsage.user + endUsage.system;
        const cpuPercent = (totalUsage / totalTime) * 100;

        resolve(Math.round(cpuPercent * 100) / 100);
      }, 100);
    });
  }

  // Estimate active connections
  private getActiveConnections(): number {
    // This is a simple approximation - in production you might want to use actual connection pools
    const recentRequestsWindow = 60000; // 1 minute
    const recentRequests = this.slowRequests.filter(
      (req) => Date.now() - req.timestamp.getTime() < recentRequestsWindow
    ).length;

    return Math.max(1, Math.ceil(recentRequests / 10)); // Rough estimate
  }

  // Clear old performance data periodically
  cleanup() {
    setInterval(() => {
      // Keep only last 24 hours of slow requests
      const cutoff = Date.now() - 24 * 60 * 60 * 1000;
      this.slowRequests = this.slowRequests.filter(
        (req) => req.timestamp.getTime() > cutoff
      );
    }, 60 * 60 * 1000); // Run every hour
  }

  // Database query wrapper for performance tracking
  wrapDatabaseQuery<T>(
    organizationId: string,
    queryType: string,
    queryFn: () => Promise<T>,
    metadata: any = {}
  ): Promise<T> {
    const startTime = Date.now();

    return queryFn()
      .then((result) => {
        const duration = Date.now() - startTime;
        this.trackDatabaseQuery(organizationId, queryType, duration, {
          ...metadata,
          success: true,
          resultSize: Array.isArray(result) ? result.length : 1,
        });
        return result;
      })
      .catch((error) => {
        const duration = Date.now() - startTime;
        this.trackDatabaseQuery(organizationId, queryType, duration, {
          ...metadata,
          success: false,
          error: error.message,
        });
        throw error;
      });
  }

  // Start system monitoring
  startSystemMonitoring(organizationId: string, interval: number = 60000) {
    setInterval(() => {
      this.trackSystemMetrics(organizationId);
    }, interval);
  }

  // Performance alert thresholds
  checkPerformanceAlerts() {
    const stats = this.getPerformanceStats();
    const alerts: string[] = [];

    if (stats.averageResponseTime > 2000) {
      alerts.push(`High average response time: ${stats.averageResponseTime}ms`);
    }

    if (stats.slowRequests > 50) {
      alerts.push(`High number of slow requests: ${stats.slowRequests}`);
    }

    const memoryUsageMB = stats.memoryUsage.heapUsed / 1024 / 1024;
    if (memoryUsageMB > 500) {
      // 500MB threshold
      alerts.push(`High memory usage: ${Math.round(memoryUsageMB)}MB`);
    }

    return alerts;
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Middleware function for express
export const performanceMiddleware = performanceMonitor.trackRequest();

// Start cleanup process
performanceMonitor.cleanup();
