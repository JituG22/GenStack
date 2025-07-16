import { Router } from "express";
import { Request, Response } from "express";
import { auth } from "../middleware/auth";
import { notificationService } from "../services/notificationService";
import { sendSuccess, sendError } from "../utils/response";

const router = Router();

// Extended request interface for authenticated requests
interface AuthenticatedRequest extends Request {
  user?: any;
}

/**
 * Get user notifications with pagination and filtering
 * GET /api/notifications
 */
router.get("/", auth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      page = 1,
      limit = 20,
      unreadOnly = false,
      type,
      category,
    } = req.query;

    const result = await notificationService.getUserNotifications(userId, {
      page: Number(page),
      limit: Number(limit),
      unreadOnly: unreadOnly === "true",
      type: type as string,
      category: category as string,
    });

    return sendSuccess(res, result, "Notifications retrieved successfully");
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return sendError(res, "Failed to fetch notifications", 500);
  }
});

/**
 * Get notification statistics
 * GET /api/notifications/stats
 */
router.get("/stats", auth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const stats = await notificationService.getNotificationStats(userId);

    return sendSuccess(
      res,
      stats,
      "Notification statistics retrieved successfully"
    );
  } catch (error) {
    console.error("Error fetching notification stats:", error);
    return sendError(res, "Failed to fetch notification statistics", 500);
  }
});

/**
 * Mark a specific notification as read
 * PUT /api/notifications/:id/read
 */
router.put(
  "/:id/read",
  auth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
        return sendError(res, "Invalid notification ID", 400);
      }

      const notification = await notificationService.markAsRead(id, userId);

      if (!notification) {
        return sendError(res, "Notification not found", 404);
      }

      return sendSuccess(res, notification, "Notification marked as read");
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return sendError(res, "Failed to mark notification as read", 500);
    }
  }
);

/**
 * Mark all notifications as read
 * PUT /api/notifications/read-all
 */
router.put(
  "/read-all",
  auth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const count = await notificationService.markAllAsRead(userId);

      return sendSuccess(
        res,
        { markedCount: count },
        `${count} notifications marked as read`
      );
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      return sendError(res, "Failed to mark all notifications as read", 500);
    }
  }
);

/**
 * Archive a notification
 * PUT /api/notifications/:id/archive
 */
router.put(
  "/:id/archive",
  auth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
        return sendError(res, "Invalid notification ID", 400);
      }

      const success = await notificationService.archiveNotification(id, userId);

      if (!success) {
        return sendError(res, "Notification not found", 404);
      }

      return sendSuccess(
        res,
        { archived: true },
        "Notification archived successfully"
      );
    } catch (error) {
      console.error("Error archiving notification:", error);
      return sendError(res, "Failed to archive notification", 500);
    }
  }
);

/**
 * Create a custom notification (admin only)
 * POST /api/notifications/create
 */
router.post(
  "/create",
  auth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Check if user is admin
      if (req.user!.role !== "admin") {
        return sendError(res, "Admin access required", 403);
      }

      const {
        userId,
        type,
        title,
        message,
        priority = "medium",
        category,
        data = {},
        actionUrl,
        actionText,
        scheduledFor,
        expiresAt,
        sourceType,
        sourceId,
        tags = [],
        channels = ["app"],
      } = req.body;

      // Basic validation
      if (!userId || !type || !title || !message || !category) {
        return sendError(
          res,
          "Missing required fields: userId, type, title, message, category",
          400
        );
      }

      const validTypes = [
        "system",
        "social",
        "project",
        "collaboration",
        "achievement",
        "reminder",
      ];
      if (!validTypes.includes(type)) {
        return sendError(res, "Invalid notification type", 400);
      }

      const notificationData = {
        userId,
        type,
        title,
        message,
        priority,
        category,
        data,
        actionUrl,
        actionText,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        sourceType,
        sourceId,
        tags,
        channels,
      };

      const notification = await notificationService.createNotification(
        notificationData
      );

      return sendSuccess(
        res,
        notification,
        "Notification created successfully",
        201
      );
    } catch (error: any) {
      console.error("Error creating notification:", error);
      if (error.message === "User not found") {
        return sendError(res, "Target user not found", 404);
      }
      if (error.message === "User has disabled notifications") {
        return sendError(res, "User has disabled notifications", 400);
      }
      return sendError(res, "Failed to create notification", 500);
    }
  }
);

/**
 * Create notification from template (admin only)
 * POST /api/notifications/template
 */
router.post(
  "/template",
  auth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Check if user is admin
      if (req.user!.role !== "admin") {
        return sendError(res, "Admin access required", 403);
      }

      const { templateKey, userId, replacements = {}, options = {} } = req.body;

      if (!templateKey || !userId) {
        return sendError(res, "TemplateKey and userId are required", 400);
      }

      const notification = await notificationService.createFromTemplate(
        templateKey,
        userId,
        replacements,
        options
      );

      return sendSuccess(
        res,
        notification,
        "Notification created from template",
        201
      );
    } catch (error: any) {
      console.error("Error creating notification from template:", error);
      if (error.message.includes("Template not found")) {
        return sendError(res, "Notification template not found", 404);
      }
      if (error.message === "User not found") {
        return sendError(res, "Target user not found", 404);
      }
      return sendError(res, "Failed to create notification from template", 500);
    }
  }
);

/**
 * Create bulk notifications (admin only)
 * POST /api/notifications/bulk
 */
router.post("/bulk", auth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Check if user is admin
    if (req.user!.role !== "admin") {
      return sendError(res, "Admin access required", 403);
    }

    const { userIds, ...notificationData } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return sendError(res, "UserIds array is required", 400);
    }

    if (
      !notificationData.type ||
      !notificationData.title ||
      !notificationData.message ||
      !notificationData.category
    ) {
      return sendError(
        res,
        "Missing required fields: type, title, message, category",
        400
      );
    }

    const count = await notificationService.createBulkNotifications(
      userIds,
      notificationData
    );

    return sendSuccess(
      res,
      { createdCount: count, targetUsers: userIds.length },
      `${count} notifications created successfully`,
      201
    );
  } catch (error) {
    console.error("Error creating bulk notifications:", error);
    return sendError(res, "Failed to create bulk notifications", 500);
  }
});

/**
 * Test notification endpoint (development only)
 * POST /api/notifications/test
 */
router.post("/test", auth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === "production") {
      return sendError(res, "Endpoint not available", 404);
    }

    const userId = req.user!.id;
    const { templateKey, title, message } = req.body;

    let notification;

    if (templateKey) {
      // Test with template
      notification = await notificationService.createFromTemplate(
        templateKey,
        userId,
        { userName: "Test User", projectName: "Test Project" }
      );
    } else {
      // Test with custom notification
      notification = await notificationService.createNotification({
        userId,
        type: "system",
        title: title || "Test Notification",
        message: message || "This is a test notification message",
        priority: "medium",
        category: "test",
      });
    }

    return sendSuccess(res, notification, "Test notification created", 201);
  } catch (error: any) {
    console.error("Error creating test notification:", error);
    return sendError(res, "Failed to create test notification", 500);
  }
});

/**
 * Get available notification templates (admin only)
 * GET /api/notifications/templates
 */
router.get(
  "/templates",
  auth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Check if user is admin
      if (req.user!.role !== "admin") {
        return sendError(res, "Admin access required", 403);
      }

      const templates = [
        "user_followed",
        "user_unfollowed",
        "team_invitation",
        "project_shared",
        "project_updated",
        "project_deadline",
        "collaboration_invited",
        "collaboration_started",
        "collaboration_ended",
        "achievement_unlocked",
        "milestone_reached",
        "system_maintenance",
        "feature_release",
        "security_alert",
        "tutorial_reminder",
        "inactive_user",
        "api_key_expiring",
      ];

      return sendSuccess(res, templates, "Available notification templates");
    } catch (error) {
      console.error("Error fetching notification templates:", error);
      return sendError(res, "Failed to fetch notification templates", 500);
    }
  }
);

export default router;
