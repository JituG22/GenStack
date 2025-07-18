import { Router, Request, Response } from "express";
import { auth } from "../middleware/auth";
import ErrorBoundaryService from "../services/errorBoundaryService";

const router = Router();
const errorBoundaryService = new ErrorBoundaryService();

// Report an error
router.post("/report", auth, async (req: Request, res: Response) => {
  try {
    const {
      message,
      stack,
      componentStack,
      userId,
      userAgent,
      url,
      timestamp,
      errorId,
      context,
    } = req.body;

    const errorReport = errorBoundaryService.reportError(
      message,
      stack ? new Error(stack) : undefined,
      {
        userId: userId || (req as any).user?.id,
        userAgent,
        url,
        sessionId: errorId,
        metadata: {
          componentStack,
          timestamp,
          context,
        },
      }
    );

    res.status(201).json({
      success: true,
      errorId: errorReport.id,
      message: "Error reported successfully",
    });
  } catch (error) {
    console.error("Error reporting error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to report error",
    });
  }
});

// Get performance metrics
router.get("/metrics", auth, async (req: Request, res: Response) => {
  try {
    const metrics = errorBoundaryService.getMetrics();
    const alerts = errorBoundaryService.getAlerts();

    res.json({
      success: true,
      metrics,
      alerts,
    });
  } catch (error) {
    console.error("Error fetching metrics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch metrics",
    });
  }
});

// Get health status
router.get("/health", async (req: Request, res: Response) => {
  try {
    const health = errorBoundaryService.getHealthChecks();
    res.json({
      success: true,
      health,
    });
  } catch (error) {
    console.error("Error getting health status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get health status",
    });
  }
});

// Get error logs
router.get("/logs", auth, async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 50,
      level,
      startDate,
      endDate,
      userId,
    } = req.query;

    const filters = {
      level: level as "error" | "warning" | "info" | undefined,
      since: startDate ? new Date(startDate as string) : undefined,
      until: endDate ? new Date(endDate as string) : undefined,
      userId: userId as string,
      limit: parseInt(limit as string),
    };

    const logs = errorBoundaryService.getErrors(filters);

    res.json({
      success: true,
      logs,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: logs.length,
        totalPages: Math.ceil(logs.length / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error("Error fetching error logs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch error logs",
    });
  }
});

// Get error details
router.get("/errors/:errorId", auth, async (req: Request, res: Response) => {
  try {
    const { errorId } = req.params;
    const errors = errorBoundaryService.getErrors();
    const errorDetails = errors.find((e) => e.id === errorId);

    if (!errorDetails) {
      return res.status(404).json({
        success: false,
        message: "Error not found",
      });
    }

    return res.json({
      success: true,
      error: errorDetails,
    });
  } catch (error) {
    console.error("Error fetching error details:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch error details",
    });
  }
});

// Dismiss an alert
router.post(
  "/alerts/:alertId/dismiss",
  auth,
  async (req: Request, res: Response) => {
    try {
      const { alertId } = req.params;
      const { userId } = req.body;

      const success = errorBoundaryService.acknowledgeAlert(
        alertId,
        userId || (req as any).user?.id
      );

      if (!success) {
        return res.status(404).json({
          success: false,
          message: "Alert not found",
        });
      }

      return res.json({
        success: true,
        message: "Alert dismissed successfully",
      });
    } catch (error) {
      console.error("Error dismissing alert:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to dismiss alert",
      });
    }
  }
);

// Get system statistics
router.get("/stats", auth, async (req: Request, res: Response) => {
  try {
    const errors = errorBoundaryService.getErrors();
    const metrics = errorBoundaryService.getMetrics();
    const alerts = errorBoundaryService.getAlerts();
    const healthChecks = errorBoundaryService.getHealthChecks();

    const stats = {
      errorCount: errors.filter((e) => e.level === "error").length,
      warningCount: errors.filter((e) => e.level === "warning").length,
      totalMetrics: metrics.length,
      activeAlerts: alerts.filter((a) => !a.acknowledged).length,
      healthyServices: Object.values(healthChecks).filter(
        (h) => h.status === "healthy"
      ).length,
      totalServices: Object.keys(healthChecks).length,
      uptime: Date.now() - (errorBoundaryService as any)["startTime"].getTime(),
    };

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Error fetching system stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch system stats",
    });
  }
});

export default router;
