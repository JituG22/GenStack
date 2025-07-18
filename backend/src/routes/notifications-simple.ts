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
 * Get user notifications (simplified version)
 * GET /api/notifications-simple
 */
router.get("/", auth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { limit = 10, unreadOnly = false } = req.query;

    const result = await notificationService.getUserNotifications(userId, {
      page: 1,
      limit: Number(limit),
      unreadOnly: unreadOnly === "true",
    });

    return sendSuccess(res, result, "Notifications retrieved successfully");
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return sendError(res, "Failed to fetch notifications", 500);
  }
});

/**
 * Get unread notification count
 * GET /api/notifications-simple/count
 */
router.get("/count", auth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const stats = await notificationService.getNotificationStats(userId);

    return sendSuccess(
      res,
      { unreadCount: stats.unread },
      "Notification count retrieved successfully"
    );
  } catch (error) {
    console.error("Error fetching notification count:", error);
    return sendError(res, "Failed to fetch notification count", 500);
  }
});

/**
 * Mark a notification as read
 * PUT /api/notifications-simple/:id/read
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
 * PUT /api/notifications-simple/read-all
 */
router.put(
  "/read-all",
  auth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const result = await notificationService.markAllAsRead(userId);

      return sendSuccess(res, result, "All notifications marked as read");
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      return sendError(res, "Failed to mark all notifications as read", 500);
    }
  }
);

/**
 * Create a simple notification (for testing)
 * POST /api/notifications-simple
 */
router.post("/", auth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { type = "system_update", title, message } = req.body;

    if (!title || !message) {
      return sendError(res, "Title and message are required", 400);
    }

    const notification = await notificationService.createNotification({
      userId,
      type,
      title,
      message,
      category: type,
      data: {},
    });

    return sendSuccess(res, notification, "Notification created successfully");
  } catch (error) {
    console.error("Error creating notification:", error);
    return sendError(res, "Failed to create notification", 500);
  }
});

/**
 * Archive a notification
 * DELETE /api/notifications-simple/:id
 */
router.delete(
  "/:id",
  auth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
        return sendError(res, "Invalid notification ID", 400);
      }

      const result = await notificationService.archiveNotification(id, userId);

      if (!result) {
        return sendError(res, "Notification not found", 404);
      }

      return sendSuccess(res, null, "Notification archived successfully");
    } catch (error) {
      console.error("Error archiving notification:", error);
      return sendError(res, "Failed to archive notification", 500);
    }
  }
);

export default router;
