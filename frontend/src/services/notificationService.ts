import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

export interface Notification {
  id: string;
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
  priority: "low" | "medium" | "high" | "urgent";
  category: string;
  data?: any;
  actionUrl?: string;
  actionText?: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  read: number;
  byType: Record<string, number>;
  byCategory: Record<string, number>;
}

export interface NotificationListResponse {
  notifications: Notification[];
  totalCount: number;
  unreadCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

class NotificationService {
  private getAuthHeaders() {
    const token = localStorage.getItem("token");
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };
  }

  async getNotifications(
    options: {
      page?: number;
      limit?: number;
      unreadOnly?: boolean;
      type?: string;
      category?: string;
    } = {}
  ): Promise<NotificationListResponse> {
    const params = new URLSearchParams();

    if (options.page) params.append("page", options.page.toString());
    if (options.limit) params.append("limit", options.limit.toString());
    if (options.unreadOnly) params.append("unreadOnly", "true");
    if (options.type) params.append("type", options.type);
    if (options.category) params.append("category", options.category);

    const response = await axios.get(
      `${API_BASE_URL}/notifications-simple?${params.toString()}`,
      this.getAuthHeaders()
    );

    return response.data.data;
  }

  async getNotificationCount(): Promise<{ unreadCount: number }> {
    const response = await axios.get(
      `${API_BASE_URL}/notifications-simple/count`,
      this.getAuthHeaders()
    );

    return response.data.data;
  }

  async markAsRead(notificationId: string): Promise<Notification> {
    const response = await axios.put(
      `${API_BASE_URL}/notifications-simple/${notificationId}/read`,
      {},
      this.getAuthHeaders()
    );

    return response.data.data;
  }

  async markAllAsRead(): Promise<{ modifiedCount: number }> {
    const response = await axios.put(
      `${API_BASE_URL}/notifications-simple/read-all`,
      {},
      this.getAuthHeaders()
    );

    return response.data.data;
  }

  async createNotification(notification: {
    type?: string;
    title: string;
    message: string;
  }): Promise<Notification> {
    const response = await axios.post(
      `${API_BASE_URL}/notifications-simple`,
      notification,
      this.getAuthHeaders()
    );

    return response.data.data;
  }

  async archiveNotification(notificationId: string): Promise<void> {
    await axios.delete(
      `${API_BASE_URL}/notifications-simple/${notificationId}`,
      this.getAuthHeaders()
    );
  }

  async getNotificationStats(): Promise<NotificationStats> {
    const response = await axios.get(
      `${API_BASE_URL}/notifications/stats`,
      this.getAuthHeaders()
    );

    return response.data.data;
  }
}

export const notificationService = new NotificationService();
