import { Router, Request, Response } from "express";
import { auth } from "../middleware/auth";
import { analyticsService } from "../services/analyticsService";
import { sendSuccess, sendError } from "../utils/response";

const router = Router();

/**
 * @route GET /api/analytics/dashboard
 * @desc Get dashboard analytics data
 * @access Private
 */
router.get("/dashboard", auth, async (req: any, res: Response) => {
  try {
    const { timeRange = "7d" } = req.query;
    const organizationId = req.user?.organization;

    if (!organizationId) {
      return sendError(res, "Organization ID is required", 400);
    }

    const dashboardData = await analyticsService.getDashboardMetrics(
      organizationId,
      timeRange as string
    );

    sendSuccess(res, {
      message: "Dashboard analytics retrieved successfully",
      data: dashboardData,
    });
  } catch (error) {
    console.error("Dashboard analytics error:", error);
    sendError(res, "Failed to retrieve dashboard analytics", 500);
  }
});

/**
 * @route GET /api/analytics/filters
 * @desc Get filter usage analytics
 * @access Private
 */
router.get("/filters", auth, async (req: any, res: Response) => {
  try {
    const { timeRange = "7d" } = req.query;
    const organizationId = req.user?.organization;

    if (!organizationId) {
      return sendError(res, "Organization ID is required", 400);
    }

    const filterData = await analyticsService.getFilterUsageStats(
      organizationId,
      timeRange as string
    );

    sendSuccess(res, {
      message: "Filter analytics retrieved successfully",
      data: filterData,
    });
  } catch (error) {
    console.error("Filter analytics error:", error);
    sendError(res, "Failed to retrieve filter analytics", 500);
  }
});

/**
 * @route GET /api/analytics/performance
 * @desc Get system performance analytics
 * @access Private
 */
router.get("/performance", auth, async (req: any, res: Response) => {
  try {
    const { timeRange = "7d" } = req.query;
    const organizationId = req.user?.organization;

    if (!organizationId) {
      return sendError(res, "Organization ID is required", 400);
    }

    const performanceData = await analyticsService.getSystemPerformanceStats(
      organizationId,
      timeRange as string
    );

    sendSuccess(res, {
      message: "Performance analytics retrieved successfully",
      data: performanceData,
    });
  } catch (error) {
    console.error("Performance analytics error:", error);
    sendError(res, "Failed to retrieve performance analytics", 500);
  }
});

/**
 * @route GET /api/analytics/behavior
 * @desc Get user behavior analytics
 * @access Private
 */
router.get("/behavior", auth, async (req: any, res: Response) => {
  try {
    const { timeRange = "7d" } = req.query;
    const organizationId = req.user?.organization;

    if (!organizationId) {
      return sendError(res, "Organization ID is required", 400);
    }

    const behaviorData = await analyticsService.getUserBehaviorStats(
      organizationId,
      timeRange as string
    );

    sendSuccess(res, {
      message: "Behavior analytics retrieved successfully",
      data: behaviorData,
    });
  } catch (error) {
    console.error("Behavior analytics error:", error);
    sendError(res, "Failed to retrieve behavior analytics", 500);
  }
});

/**
 * @route POST /api/analytics/events
 * @desc Track analytics event
 * @access Private
 */
router.post("/events", auth, async (req: any, res: Response) => {
  try {
    const { eventType, eventCategory, eventAction, eventLabel, metadata } =
      req.body;
    const userId = req.user?.id;
    const organizationId = req.user?.organization;

    if (!userId || !organizationId) {
      return sendError(res, "User ID and Organization ID are required", 400);
    }

    await analyticsService.trackEvent({
      eventType,
      eventCategory,
      eventAction,
      eventLabel,
      userId,
      organizationId,
      sessionId: req.sessionID || "anonymous",
      metadata,
      timestamp: new Date(),
    });

    sendSuccess(res, {
      message: "Event tracked successfully",
    });
  } catch (error) {
    console.error("Event tracking error:", error);
    sendError(res, "Failed to track event", 500);
  }
});

export default router;
