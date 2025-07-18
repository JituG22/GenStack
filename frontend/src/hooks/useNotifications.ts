import { useState, useEffect, useCallback, useMemo } from "react";
import {
  notificationService,
  Notification,
  NotificationStats,
} from "../services/notificationService";
import { useWebSocket } from "../contexts/WebSocketContext";

export interface UseNotificationsOptions {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
  type?: string;
  category?: string;
  autoRefresh?: boolean;
}

export interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  totalCount: number;
  stats: NotificationStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  archiveNotification: (id: string) => Promise<void>;
  createTestNotification: (title: string, message: string) => Promise<void>;
}

export const useNotifications = (
  options: UseNotificationsOptions = {}
): UseNotificationsReturn => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { socket } = useWebSocket();

  // Memoize options to prevent unnecessary re-renders
  const memoizedOptions = useMemo(
    () => options,
    [
      options.page,
      options.limit,
      options.unreadOnly,
      options.type,
      options.category,
      options.autoRefresh,
    ]
  );

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await notificationService.getNotifications(
        memoizedOptions
      );
      setNotifications(response.notifications);
      setUnreadCount(response.unreadCount);
      setTotalCount(response.totalCount);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch notifications"
      );
    } finally {
      setLoading(false);
    }
  }, [memoizedOptions]);

  const fetchStats = useCallback(async () => {
    try {
      const statsData = await notificationService.getNotificationStats();
      setStats(statsData);
    } catch (err) {
      console.error("Failed to fetch notification stats:", err);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const countData = await notificationService.getNotificationCount();
      setUnreadCount(countData.unreadCount);
    } catch (err) {
      console.error("Failed to fetch unread count:", err);
    }
  }, []);

  const markAsRead = useCallback(
    async (id: string) => {
      try {
        await notificationService.markAsRead(id);

        // Update local state
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === id
              ? { ...notification, read: true }
              : notification
          )
        );

        // Update unread count
        setUnreadCount((prev) => Math.max(0, prev - 1));

        // Refresh stats
        await fetchStats();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to mark notification as read"
        );
      }
    },
    [fetchStats]
  );

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();

      // Update local state
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, read: true }))
      );

      setUnreadCount(0);
      await fetchStats();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to mark all notifications as read"
      );
    }
  }, [fetchStats]);

  const archiveNotification = useCallback(
    async (id: string) => {
      try {
        await notificationService.archiveNotification(id);

        // Remove from local state and update unread count if needed
        setNotifications((prev) => {
          const notification = prev.find((n) => n.id === id);
          if (notification && !notification.read) {
            setUnreadCount((currentUnreadCount) =>
              Math.max(0, currentUnreadCount - 1)
            );
          }
          return prev.filter((notification) => notification.id !== id);
        });
        setTotalCount((prev) => prev - 1);

        await fetchStats();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to archive notification"
        );
      }
    },
    [fetchStats]
  );

  const createTestNotification = useCallback(
    async (title: string, message: string) => {
      try {
        const newNotification = await notificationService.createNotification({
          title,
          message,
          type: "system_update",
        });

        // Add to local state
        setNotifications((prev) => [newNotification, ...prev]);
        setTotalCount((prev) => prev + 1);

        if (!newNotification.read) {
          setUnreadCount((prev) => prev + 1);
        }

        await fetchStats();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to create test notification"
        );
      }
    },
    [fetchStats]
  );

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
    fetchStats();
  }, [fetchNotifications, fetchStats]); // WebSocket listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setTotalCount((prev) => prev + 1);
      if (!notification.read) {
        setUnreadCount((prev) => prev + 1);
      }
    };

    const handleNotificationRead = (data: { notificationId: string }) => {
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === data.notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    };

    const handleNotificationDeleted = (data: { notificationId: string }) => {
      setNotifications((prev) =>
        prev.filter((n) => n.id !== data.notificationId)
      );
      setTotalCount((prev) => prev - 1);
      // Check if deleted notification was unread
      setNotifications((currentNotifications) => {
        const notification = currentNotifications.find(
          (n) => n.id === data.notificationId
        );
        if (notification && !notification.read) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
        return currentNotifications.filter((n) => n.id !== data.notificationId);
      });
    };

    socket.on("notification:new", handleNewNotification);
    socket.on("notification:read", handleNotificationRead);
    socket.on("notification:deleted", handleNotificationDeleted);

    return () => {
      socket.off("notification:new", handleNewNotification);
      socket.off("notification:read", handleNotificationRead);
      socket.off("notification:deleted", handleNotificationDeleted);
    };
  }, [socket]); // Remove notifications dependency

  // Auto-refresh if enabled
  useEffect(() => {
    if (!memoizedOptions.autoRefresh) return;

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [memoizedOptions.autoRefresh, fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    totalCount,
    stats,
    loading,
    error,
    refetch: fetchNotifications,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    createTestNotification,
  };
};
