import { v4 as uuidv4 } from "uuid";

export interface ErrorReport {
  id: string;
  timestamp: Date;
  level: "error" | "warning" | "info";
  message: string;
  stack?: string;
  userId?: string;
  projectId?: string;
  context?: Record<string, any>;
  userAgent?: string;
  url?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export interface PerformanceMetric {
  id: string;
  timestamp: Date;
  type:
    | "api_response"
    | "websocket_latency"
    | "database_query"
    | "render_time"
    | "memory_usage";
  value: number;
  unit: "ms" | "bytes" | "count";
  labels?: Record<string, string>;
  metadata?: Record<string, any>;
}

export interface HealthCheck {
  id: string;
  service: string;
  status: "healthy" | "unhealthy" | "degraded";
  timestamp: Date;
  responseTime: number;
  details?: Record<string, any>;
  error?: string;
}

export interface Alert {
  id: string;
  type: "error_rate" | "performance" | "health" | "resource";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolved: boolean;
  resolvedAt?: Date;
  metadata?: Record<string, any>;
}

export interface MonitoringStats {
  errorCount: number;
  warningCount: number;
  averageResponseTime: number;
  healthyServices: number;
  totalServices: number;
  activeAlerts: number;
  criticalAlerts: number;
  uptime: number;
  memoryUsage: number;
  cpuUsage: number;
}

export class ErrorBoundaryService {
  private errors: Map<string, ErrorReport> = new Map();
  private metrics: Map<string, PerformanceMetric> = new Map();
  private healthChecks: Map<string, HealthCheck> = new Map();
  private alerts: Map<string, Alert> = new Map();
  private startTime: Date = new Date();
  private errorThresholds: Map<string, number> = new Map();
  private performanceThresholds: Map<string, number> = new Map();

  constructor() {
    this.initializeThresholds();
    this.startHealthChecks();
  }

  /**
   * Initialize monitoring thresholds
   */
  private initializeThresholds(): void {
    // Error rate thresholds (errors per minute)
    this.errorThresholds.set("error_rate_warning", 10);
    this.errorThresholds.set("error_rate_critical", 50);

    // Performance thresholds (milliseconds)
    this.performanceThresholds.set("api_response_warning", 1000);
    this.performanceThresholds.set("api_response_critical", 5000);
    this.performanceThresholds.set("websocket_latency_warning", 200);
    this.performanceThresholds.set("websocket_latency_critical", 1000);
    this.performanceThresholds.set("database_query_warning", 500);
    this.performanceThresholds.set("database_query_critical", 2000);
  }

  /**
   * Report an error
   */
  reportError(
    message: string,
    error?: Error,
    context?: {
      userId?: string;
      projectId?: string;
      userAgent?: string;
      url?: string;
      sessionId?: string;
      metadata?: Record<string, any>;
    }
  ): ErrorReport {
    const errorReport: ErrorReport = {
      id: uuidv4(),
      timestamp: new Date(),
      level: "error",
      message,
      stack: error?.stack,
      userId: context?.userId,
      projectId: context?.projectId,
      context: context?.metadata,
      userAgent: context?.userAgent,
      url: context?.url,
      sessionId: context?.sessionId,
      metadata: context?.metadata,
    };

    this.errors.set(errorReport.id, errorReport);

    // Check if error rate threshold is exceeded
    this.checkErrorRateThreshold();

    // Log error
    console.error("Error reported:", errorReport);

    return errorReport;
  }

  /**
   * Report a warning
   */
  reportWarning(
    message: string,
    context?: {
      userId?: string;
      projectId?: string;
      metadata?: Record<string, any>;
    }
  ): ErrorReport {
    const warningReport: ErrorReport = {
      id: uuidv4(),
      timestamp: new Date(),
      level: "warning",
      message,
      userId: context?.userId,
      projectId: context?.projectId,
      context: context?.metadata,
      metadata: context?.metadata,
    };

    this.errors.set(warningReport.id, warningReport);

    console.warn("Warning reported:", warningReport);

    return warningReport;
  }

  /**
   * Record performance metric
   */
  recordMetric(
    type: PerformanceMetric["type"],
    value: number,
    unit: PerformanceMetric["unit"],
    labels?: Record<string, string>,
    metadata?: Record<string, any>
  ): PerformanceMetric {
    const metric: PerformanceMetric = {
      id: uuidv4(),
      timestamp: new Date(),
      type,
      value,
      unit,
      labels,
      metadata,
    };

    this.metrics.set(metric.id, metric);

    // Check performance thresholds
    this.checkPerformanceThresholds(metric);

    return metric;
  }

  /**
   * Record health check
   */
  recordHealthCheck(
    service: string,
    status: HealthCheck["status"],
    responseTime: number,
    details?: Record<string, any>,
    error?: string
  ): HealthCheck {
    const healthCheck: HealthCheck = {
      id: uuidv4(),
      service,
      status,
      timestamp: new Date(),
      responseTime,
      details,
      error,
    };

    this.healthChecks.set(service, healthCheck);

    // Create alert if service is unhealthy
    if (status === "unhealthy") {
      this.createAlert(
        "health",
        "high",
        `Service ${service} is unhealthy`,
        `Service ${service} failed health check: ${error || "Unknown error"}`,
        { service, responseTime, details }
      );
    }

    return healthCheck;
  }

  /**
   * Create alert
   */
  createAlert(
    type: Alert["type"],
    severity: Alert["severity"],
    title: string,
    message: string,
    metadata?: Record<string, any>
  ): Alert {
    const alert: Alert = {
      id: uuidv4(),
      type,
      severity,
      title,
      message,
      timestamp: new Date(),
      acknowledged: false,
      resolved: false,
      metadata,
    };

    this.alerts.set(alert.id, alert);

    // Log alert
    console.log(
      `Alert created [${severity.toUpperCase()}]: ${title} - ${message}`
    );

    return alert;
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;

    alert.acknowledged = true;
    alert.acknowledgedBy = acknowledgedBy;
    alert.acknowledgedAt = new Date();

    this.alerts.set(alertId, alert);

    return true;
  }

  /**
   * Resolve alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;

    alert.resolved = true;
    alert.resolvedAt = new Date();

    this.alerts.set(alertId, alert);

    return true;
  }

  /**
   * Get errors with filters
   */
  getErrors(
    filter: {
      level?: ErrorReport["level"];
      userId?: string;
      projectId?: string;
      since?: Date;
      until?: Date;
      limit?: number;
    } = {}
  ): ErrorReport[] {
    let errors = Array.from(this.errors.values());

    // Apply filters
    if (filter.level) {
      errors = errors.filter((e) => e.level === filter.level);
    }

    if (filter.userId) {
      errors = errors.filter((e) => e.userId === filter.userId);
    }

    if (filter.projectId) {
      errors = errors.filter((e) => e.projectId === filter.projectId);
    }

    if (filter.since) {
      errors = errors.filter((e) => e.timestamp >= filter.since!);
    }

    if (filter.until) {
      errors = errors.filter((e) => e.timestamp <= filter.until!);
    }

    // Sort by timestamp (newest first)
    errors.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply limit
    if (filter.limit) {
      errors = errors.slice(0, filter.limit);
    }

    return errors;
  }

  /**
   * Get performance metrics
   */
  getMetrics(
    filter: {
      type?: PerformanceMetric["type"];
      since?: Date;
      until?: Date;
      limit?: number;
    } = {}
  ): PerformanceMetric[] {
    let metrics = Array.from(this.metrics.values());

    // Apply filters
    if (filter.type) {
      metrics = metrics.filter((m) => m.type === filter.type);
    }

    if (filter.since) {
      metrics = metrics.filter((m) => m.timestamp >= filter.since!);
    }

    if (filter.until) {
      metrics = metrics.filter((m) => m.timestamp <= filter.until!);
    }

    // Sort by timestamp (newest first)
    metrics.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply limit
    if (filter.limit) {
      metrics = metrics.slice(0, filter.limit);
    }

    return metrics;
  }

  /**
   * Get health checks
   */
  getHealthChecks(): HealthCheck[] {
    return Array.from(this.healthChecks.values());
  }

  /**
   * Get alerts
   */
  getAlerts(
    filter: {
      type?: Alert["type"];
      severity?: Alert["severity"];
      acknowledged?: boolean;
      resolved?: boolean;
      since?: Date;
      limit?: number;
    } = {}
  ): Alert[] {
    let alerts = Array.from(this.alerts.values());

    // Apply filters
    if (filter.type) {
      alerts = alerts.filter((a) => a.type === filter.type);
    }

    if (filter.severity) {
      alerts = alerts.filter((a) => a.severity === filter.severity);
    }

    if (filter.acknowledged !== undefined) {
      alerts = alerts.filter((a) => a.acknowledged === filter.acknowledged);
    }

    if (filter.resolved !== undefined) {
      alerts = alerts.filter((a) => a.resolved === filter.resolved);
    }

    if (filter.since) {
      alerts = alerts.filter((a) => a.timestamp >= filter.since!);
    }

    // Sort by timestamp (newest first)
    alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply limit
    if (filter.limit) {
      alerts = alerts.slice(0, filter.limit);
    }

    return alerts;
  }

  /**
   * Get monitoring statistics
   */
  getMonitoringStats(): MonitoringStats {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const recentErrors = this.getErrors({ since: oneHourAgo });
    const recentMetrics = this.getMetrics({ since: oneHourAgo });
    const healthChecks = this.getHealthChecks();
    const activeAlerts = this.getAlerts({ resolved: false });

    const errorCount = recentErrors.filter((e) => e.level === "error").length;
    const warningCount = recentErrors.filter(
      (e) => e.level === "warning"
    ).length;

    const apiResponseMetrics = recentMetrics.filter(
      (m) => m.type === "api_response"
    );
    const averageResponseTime =
      apiResponseMetrics.length > 0
        ? apiResponseMetrics.reduce((sum, m) => sum + m.value, 0) /
          apiResponseMetrics.length
        : 0;

    const healthyServices = healthChecks.filter(
      (h) => h.status === "healthy"
    ).length;
    const totalServices = healthChecks.length;

    const criticalAlerts = activeAlerts.filter(
      (a) => a.severity === "critical"
    ).length;

    const uptime = (now.getTime() - this.startTime.getTime()) / 1000; // seconds

    // Mock memory and CPU usage (in a real implementation, these would come from system metrics)
    const memoryUsage = 0.65; // 65%
    const cpuUsage = 0.35; // 35%

    return {
      errorCount,
      warningCount,
      averageResponseTime,
      healthyServices,
      totalServices,
      activeAlerts: activeAlerts.length,
      criticalAlerts,
      uptime,
      memoryUsage,
      cpuUsage,
    };
  }

  /**
   * Check error rate threshold
   */
  private checkErrorRateThreshold(): void {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

    const recentErrors = this.getErrors({
      level: "error",
      since: oneMinuteAgo,
    });

    const errorRate = recentErrors.length;
    const warningThreshold =
      this.errorThresholds.get("error_rate_warning") || 10;
    const criticalThreshold =
      this.errorThresholds.get("error_rate_critical") || 50;

    if (errorRate >= criticalThreshold) {
      this.createAlert(
        "error_rate",
        "critical",
        "Critical Error Rate",
        `Error rate is ${errorRate} errors per minute (threshold: ${criticalThreshold})`,
        { errorRate, threshold: criticalThreshold }
      );
    } else if (errorRate >= warningThreshold) {
      this.createAlert(
        "error_rate",
        "medium",
        "High Error Rate",
        `Error rate is ${errorRate} errors per minute (threshold: ${warningThreshold})`,
        { errorRate, threshold: warningThreshold }
      );
    }
  }

  /**
   * Check performance thresholds
   */
  private checkPerformanceThresholds(metric: PerformanceMetric): void {
    const warningKey = `${metric.type}_warning`;
    const criticalKey = `${metric.type}_critical`;

    const warningThreshold = this.performanceThresholds.get(warningKey);
    const criticalThreshold = this.performanceThresholds.get(criticalKey);

    if (criticalThreshold && metric.value >= criticalThreshold) {
      this.createAlert(
        "performance",
        "critical",
        "Critical Performance Issue",
        `${metric.type} took ${metric.value}${metric.unit} (threshold: ${criticalThreshold}${metric.unit})`,
        {
          metric: metric.type,
          value: metric.value,
          threshold: criticalThreshold,
        }
      );
    } else if (warningThreshold && metric.value >= warningThreshold) {
      this.createAlert(
        "performance",
        "medium",
        "Performance Warning",
        `${metric.type} took ${metric.value}${metric.unit} (threshold: ${warningThreshold}${metric.unit})`,
        {
          metric: metric.type,
          value: metric.value,
          threshold: warningThreshold,
        }
      );
    }
  }

  /**
   * Start health checks
   */
  private startHealthChecks(): void {
    // Run health checks every 30 seconds
    setInterval(() => {
      this.performHealthChecks();
    }, 30000);

    // Run initial health checks
    this.performHealthChecks();
  }

  /**
   * Perform health checks
   */
  private performHealthChecks(): void {
    // Database health check
    this.checkDatabaseHealth();

    // WebSocket health check
    this.checkWebSocketHealth();

    // Memory health check
    this.checkMemoryHealth();
  }

  /**
   * Check database health
   */
  private checkDatabaseHealth(): void {
    const startTime = Date.now();

    // Mock database health check
    setTimeout(() => {
      const responseTime = Date.now() - startTime;
      const isHealthy = responseTime < 1000; // Consider healthy if response time < 1s

      this.recordHealthCheck(
        "database",
        isHealthy ? "healthy" : "degraded",
        responseTime,
        { connection: "active", queries: "responsive" }
      );
    }, Math.random() * 100); // Random delay to simulate database response
  }

  /**
   * Check WebSocket health
   */
  private checkWebSocketHealth(): void {
    const startTime = Date.now();

    // Mock WebSocket health check
    setTimeout(() => {
      const responseTime = Date.now() - startTime;
      const isHealthy = responseTime < 500; // Consider healthy if response time < 0.5s

      this.recordHealthCheck(
        "websocket",
        isHealthy ? "healthy" : "degraded",
        responseTime,
        { connections: "active", latency: "normal" }
      );
    }, Math.random() * 50); // Random delay to simulate WebSocket response
  }

  /**
   * Check memory health
   */
  private checkMemoryHealth(): void {
    const startTime = Date.now();

    // Mock memory health check
    const memoryUsage = Math.random() * 100; // Random memory usage percentage
    const responseTime = Date.now() - startTime;

    this.recordHealthCheck(
      "memory",
      memoryUsage > 90
        ? "unhealthy"
        : memoryUsage > 80
        ? "degraded"
        : "healthy",
      responseTime,
      { usage: `${memoryUsage.toFixed(1)}%`, threshold: "90%" }
    );

    // Create alert if memory usage is high
    if (memoryUsage > 90) {
      this.createAlert(
        "resource",
        "high",
        "High Memory Usage",
        `Memory usage is ${memoryUsage.toFixed(1)}% (threshold: 90%)`,
        { usage: memoryUsage, threshold: 90 }
      );
    }
  }

  /**
   * Clean up old data
   */
  cleanup(retentionDays: number = 7): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    // Clean up old errors
    for (const [id, error] of this.errors.entries()) {
      if (error.timestamp < cutoffDate) {
        this.errors.delete(id);
      }
    }

    // Clean up old metrics
    for (const [id, metric] of this.metrics.entries()) {
      if (metric.timestamp < cutoffDate) {
        this.metrics.delete(id);
      }
    }

    // Clean up resolved alerts older than retention period
    for (const [id, alert] of this.alerts.entries()) {
      if (alert.resolved && alert.resolvedAt && alert.resolvedAt < cutoffDate) {
        this.alerts.delete(id);
      }
    }
  }
}

export default ErrorBoundaryService;
