import { Notification, INotification } from "../models/Notification";
import { UserNew } from "../models/User-new";
import mongoose from "mongoose";

export interface NotificationData {
  userId: string;
  type:
    | "system"
    | "social"
    | "project"
    | "collaboration"
    | "achievement"
    | "reminder";
  title: string;
  message: string;
  priority?: "low" | "medium" | "high" | "urgent";
  category: string;
  data?: any;
  actionUrl?: string;
  actionText?: string;
  scheduledFor?: Date;
  expiresAt?: Date;
  sourceType?: "user" | "system" | "project" | "team";
  sourceId?: string;
  tags?: string[];
  channels?: Array<"app" | "email" | "push">;
}

export interface NotificationTemplate {
  type: string;
  title: string;
  message: string;
  priority: "low" | "medium" | "high" | "urgent";
  category: string;
  actionText?: string;
  channels: Array<"app" | "email" | "push">;
  tags: string[];
}

class NotificationService {
  private templates: Map<string, NotificationTemplate> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  /**
   * Initialize notification templates
   */
  private initializeTemplates() {
    const templates: Array<[string, NotificationTemplate]> = [
      // Social notifications
      [
        "user_followed",
        {
          type: "social",
          title: "New Follower",
          message: "{followerName} started following you",
          priority: "low",
          category: "social",
          actionText: "View Profile",
          channels: ["app"],
          tags: ["social", "followers"],
        },
      ],
      [
        "user_unfollowed",
        {
          type: "social",
          title: "Follower Update",
          message: "{followerName} unfollowed you",
          priority: "low",
          category: "social",
          channels: ["app"],
          tags: ["social", "followers"],
        },
      ],
      [
        "team_invitation",
        {
          type: "social",
          title: "Team Invitation",
          message: "You've been invited to join {teamName}",
          priority: "high",
          category: "team",
          actionText: "Accept Invitation",
          channels: ["app", "email"],
          tags: ["team", "invitation"],
        },
      ],

      // Project notifications
      [
        "project_shared",
        {
          type: "project",
          title: "Project Shared",
          message: "{userName} shared the project '{projectName}' with you",
          priority: "medium",
          category: "project",
          actionText: "View Project",
          channels: ["app", "email"],
          tags: ["project", "sharing"],
        },
      ],
      [
        "project_updated",
        {
          type: "project",
          title: "Project Updated",
          message: "Project '{projectName}' has been updated",
          priority: "low",
          category: "project",
          actionText: "View Changes",
          channels: ["app"],
          tags: ["project", "updates"],
        },
      ],
      [
        "project_deadline",
        {
          type: "reminder",
          title: "Project Deadline Approaching",
          message: "Project '{projectName}' is due in {days} days",
          priority: "high",
          category: "deadline",
          actionText: "View Project",
          channels: ["app", "email"],
          tags: ["project", "deadline", "reminder"],
        },
      ],

      // Collaboration notifications
      [
        "collaboration_invited",
        {
          type: "collaboration",
          title: "Collaboration Invitation",
          message: "{userName} invited you to collaborate on '{projectName}'",
          priority: "medium",
          category: "collaboration",
          actionText: "Join Session",
          channels: ["app", "email"],
          tags: ["collaboration", "invitation"],
        },
      ],
      [
        "collaboration_started",
        {
          type: "collaboration",
          title: "Collaboration Session Started",
          message: "A collaboration session for '{projectName}' has started",
          priority: "medium",
          category: "collaboration",
          actionText: "Join Now",
          channels: ["app"],
          tags: ["collaboration", "session"],
        },
      ],
      [
        "collaboration_ended",
        {
          type: "collaboration",
          title: "Collaboration Session Ended",
          message: "The collaboration session for '{projectName}' has ended",
          priority: "low",
          category: "collaboration",
          channels: ["app"],
          tags: ["collaboration", "session"],
        },
      ],

      // Achievement notifications
      [
        "achievement_unlocked",
        {
          type: "achievement",
          title: "Achievement Unlocked!",
          message:
            "Congratulations! You've earned the '{achievementName}' badge",
          priority: "medium",
          category: "achievement",
          actionText: "View Achievements",
          channels: ["app"],
          tags: ["achievement", "badge", "gamification"],
        },
      ],
      [
        "milestone_reached",
        {
          type: "achievement",
          title: "Milestone Reached",
          message: "Great job! You've reached {milestone}",
          priority: "medium",
          category: "milestone",
          actionText: "View Progress",
          channels: ["app"],
          tags: ["achievement", "milestone"],
        },
      ],

      // System notifications
      [
        "system_maintenance",
        {
          type: "system",
          title: "Scheduled Maintenance",
          message: "System maintenance is scheduled for {date} at {time}",
          priority: "high",
          category: "maintenance",
          channels: ["app", "email"],
          tags: ["system", "maintenance"],
        },
      ],
      [
        "feature_release",
        {
          type: "system",
          title: "New Feature Available",
          message: "Check out our new feature: {featureName}",
          priority: "medium",
          category: "feature",
          actionText: "Learn More",
          channels: ["app"],
          tags: ["system", "feature", "update"],
        },
      ],
      [
        "security_alert",
        {
          type: "system",
          title: "Security Alert",
          message: "{alertMessage}",
          priority: "urgent",
          category: "security",
          actionText: "Review Activity",
          channels: ["app", "email"],
          tags: ["system", "security", "alert"],
        },
      ],

      // Reminder notifications
      [
        "tutorial_reminder",
        {
          type: "reminder",
          title: "Complete Your Tutorial",
          message: "Don't forget to complete the {tutorialName} tutorial",
          priority: "low",
          category: "tutorial",
          actionText: "Continue Tutorial",
          channels: ["app"],
          tags: ["tutorial", "reminder", "onboarding"],
        },
      ],
      [
        "inactive_user",
        {
          type: "reminder",
          title: "We Miss You!",
          message: "You haven't been active recently. Check out what's new!",
          priority: "low",
          category: "engagement",
          actionText: "Explore Now",
          channels: ["app", "email"],
          tags: ["engagement", "retention"],
        },
      ],
      [
        "api_key_expiring",
        {
          type: "reminder",
          title: "API Key Expiring Soon",
          message: "Your API key '{keyName}' expires in {days} days",
          priority: "medium",
          category: "api",
          actionText: "Renew Key",
          channels: ["app", "email"],
          tags: ["api", "security", "expiration"],
        },
      ],
    ];

    templates.forEach(([key, template]) => {
      this.templates.set(key, template);
    });
  }

  /**
   * Create a notification from template
   */
  async createFromTemplate(
    templateKey: string,
    userId: string,
    replacements: Record<string, string> = {},
    options: Partial<NotificationData> = {}
  ): Promise<INotification> {
    const template = this.templates.get(templateKey);
    if (!template) {
      throw new Error(`Template not found: ${templateKey}`);
    }

    // Replace placeholders in title and message
    let title = template.title;
    let message = template.message;

    Object.entries(replacements).forEach(([key, value]) => {
      const placeholder = `{${key}}`;
      title = title.replace(new RegExp(placeholder, "g"), value);
      message = message.replace(new RegExp(placeholder, "g"), value);
    });

    const notificationData: NotificationData = {
      userId,
      type: template.type as any,
      title,
      message,
      priority: template.priority,
      category: template.category,
      actionText: template.actionText,
      channels: template.channels,
      tags: template.tags,
      ...options,
    };

    return this.createNotification(notificationData);
  }

  /**
   * Create a custom notification
   */
  async createNotification(data: NotificationData): Promise<INotification> {
    // Check user notification preferences
    const user = await UserNew.findById(data.userId)
      .select("preferences")
      .lean();
    if (!user) {
      throw new Error("User not found");
    }

    // Filter channels based on user preferences
    let allowedChannels = data.channels || ["app"];
    if (!user.preferences.notifications.email) {
      allowedChannels = allowedChannels.filter((c) => c !== "email");
    }
    if (!user.preferences.notifications.realTime) {
      allowedChannels = allowedChannels.filter((c) => c !== "app");
    }

    if (allowedChannels.length === 0) {
      // User has disabled all notifications for this type
      throw new Error("User has disabled notifications");
    }

    const notification = new Notification({
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      priority: data.priority || "medium",
      category: data.category,
      data: data.data || {},
      actionUrl: data.actionUrl,
      actionText: data.actionText,
      scheduledFor: data.scheduledFor || new Date(),
      expiresAt: data.expiresAt,
      sourceType: data.sourceType,
      sourceId: data.sourceId
        ? new mongoose.Types.ObjectId(data.sourceId)
        : undefined,
      tags: data.tags || [],
      channels: allowedChannels,
    });

    await notification.save();

    // Trigger real-time notification if app channel is enabled
    if (allowedChannels.includes("app")) {
      this.sendRealTimeNotification(notification);
    }

    return notification;
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      unreadOnly?: boolean;
      type?: string;
      category?: string;
    } = {}
  ): Promise<{
    notifications: INotification[];
    total: number;
    unreadCount: number;
    hasMore: boolean;
  }> {
    const {
      page = 1,
      limit = 20,
      unreadOnly = false,
      type,
      category,
    } = options;

    const filter: any = {
      userId,
      isArchived: false,
      $or: [
        { scheduledFor: { $lte: new Date() } },
        { scheduledFor: { $exists: false } },
      ],
    };

    if (unreadOnly) {
      filter.isRead = false;
    }
    if (type) {
      filter.type = type;
    }
    if (category) {
      filter.category = category;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ priority: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ userId, isRead: false, isArchived: false }),
    ]);

    return {
      notifications,
      total,
      unreadCount,
      hasMore: total > page * limit,
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(
    notificationId: string,
    userId: string
  ): Promise<INotification | null> {
    const notification = await Notification.findOne({
      _id: notificationId,
      userId,
    });

    if (notification) {
      notification.isRead = true;
      notification.deliveredAt = new Date();
      await notification.save();
    }

    return notification;
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<number> {
    const result = await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true, deliveredAt: new Date() }
    );

    return result.modifiedCount;
  }

  /**
   * Archive notification
   */
  async archiveNotification(
    notificationId: string,
    userId: string
  ): Promise<boolean> {
    const result = await Notification.updateOne(
      { _id: notificationId, userId },
      { isArchived: true }
    );

    return result.modifiedCount > 0;
  }

  /**
   * Delete old/expired notifications (cleanup job)
   */
  async cleanupNotifications(): Promise<number> {
    const result = await Notification.deleteMany({
      $or: [
        { expiresAt: { $lt: new Date() } },
        {
          isArchived: true,
          updatedAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      ],
    });

    return result.deletedCount;
  }

  /**
   * Send real-time notification via WebSocket
   */
  private sendRealTimeNotification(notification: INotification): void {
    this.sendRealTimeNotificationData(notification.userId.toString(), {
      id: notification._id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      priority: notification.priority,
      category: notification.category,
      actionUrl: notification.actionUrl,
      actionText: notification.actionText,
      createdAt: notification.createdAt,
    });
  }

  /**
   * Send real-time notification data via WebSocket
   */
  private sendRealTimeNotificationData(userId: string, data: any): void {
    // Integration with WebSocket service
    const wsService = (global as any).simpleWebSocketService;
    if (wsService) {
      wsService.sendToUser(userId, {
        type: "notification",
        data,
      });
    }
  }

  /**
   * Bulk create notifications (for system-wide announcements)
   */
  async createBulkNotifications(
    userIds: string[],
    notificationData: Omit<NotificationData, "userId">
  ): Promise<number> {
    const notifications = userIds.map((userId) => ({
      userId: new mongoose.Types.ObjectId(userId),
      type: notificationData.type,
      title: notificationData.title,
      message: notificationData.message,
      priority: notificationData.priority || "medium",
      category: notificationData.category,
      data: notificationData.data || {},
      actionUrl: notificationData.actionUrl,
      actionText: notificationData.actionText,
      scheduledFor: notificationData.scheduledFor || new Date(),
      expiresAt: notificationData.expiresAt,
      sourceType: notificationData.sourceType,
      sourceId: notificationData.sourceId
        ? new mongoose.Types.ObjectId(notificationData.sourceId)
        : undefined,
      tags: notificationData.tags || [],
      channels: notificationData.channels || ["app"],
    }));

    const result = await Notification.insertMany(notifications);

    // Send real-time notifications
    result.forEach((notification) => {
      if (notification.channels && notification.channels.includes("app")) {
        // Send real-time notification using notification data
        this.sendRealTimeNotificationData(notification.userId.toString(), {
          id: notification._id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          priority: notification.priority,
          category: notification.category,
          actionUrl: notification.actionUrl,
          actionText: notification.actionText,
          createdAt: notification.createdAt,
        });
      }
    });

    return result.length;
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(userId: string): Promise<{
    total: number;
    unread: number;
    byType: Record<string, number>;
    byCategory: Record<string, number>;
    recentActivity: number;
  }> {
    const [totalStats, typeStats, categoryStats] = await Promise.all([
      Notification.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            unread: { $sum: { $cond: ["$isRead", 0, 1] } },
            recent: {
              $sum: {
                $cond: [
                  {
                    $gte: [
                      "$createdAt",
                      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]),
      Notification.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        { $group: { _id: "$type", count: { $sum: 1 } } },
      ]),
      Notification.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
      ]),
    ]);

    const stats = totalStats[0] || { total: 0, unread: 0, recent: 0 };

    const byType: Record<string, number> = {};
    typeStats.forEach((stat) => {
      byType[stat._id] = stat.count;
    });

    const byCategory: Record<string, number> = {};
    categoryStats.forEach((stat) => {
      byCategory[stat._id] = stat.count;
    });

    return {
      total: stats.total,
      unread: stats.unread,
      byType,
      byCategory,
      recentActivity: stats.recent,
    };
  }
}

export const notificationService = new NotificationService();
