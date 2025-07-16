import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import { analyticsService } from "../services/analyticsService";

const router = Router();

// Test endpoint for WebSocket analytics integration
router.post(
  "/test-websocket",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { organizationId, eventType = "user_action" } = req.body;

      if (!organizationId) {
        res.status(400).json({
          success: false,
          error: "organizationId is required",
        });
        return;
      }

      // Track a test analytics event that will trigger WebSocket broadcast
      await analyticsService.trackEvent({
        eventType,
        eventCategory: "testing",
        eventAction: "websocket_test",
        eventLabel: "WebSocket Integration Test",
        userId: new mongoose.Types.ObjectId(),
        organizationId: new mongoose.Types.ObjectId(organizationId),
        sessionId: `test-session-${Date.now()}`,
        timestamp: new Date(),
        metadata: {
          source: "test_endpoint",
          testData: "This is a WebSocket test event",
          timestamp: new Date().toISOString(),
        },
      });

      res.json({
        success: true,
        message: "Test analytics event tracked and broadcast via WebSocket",
        data: {
          eventType,
          organizationId,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      console.error("WebSocket test error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to test WebSocket analytics integration",
      });
    }
  }
);

// Test endpoint for performance alert
router.post(
  "/test-performance-alert",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { organizationId, value = 5500 } = req.body;

      if (!organizationId) {
        res.status(400).json({
          success: false,
          error: "organizationId is required",
        });
        return;
      }

      // Track a performance metric that will trigger an alert
      await analyticsService.trackPerformance({
        metricType: "query",
        metricName: "database_query_time",
        value: Number(value), // This should trigger a critical alert
        unit: "ms",
        timestamp: new Date(),
        organizationId: new mongoose.Types.ObjectId(organizationId),
        metadata: {
          query: "SELECT * FROM large_table",
          connection: "primary_db",
          testAlert: true,
        },
        tags: ["database", "performance", "test"],
      });

      res.json({
        success: true,
        message:
          "Performance metric tracked, alert should be broadcast if threshold exceeded",
        data: {
          metricType: "query",
          value,
          organizationId,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      console.error("Performance alert test error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to test performance alert",
      });
    }
  }
);

export default router;
