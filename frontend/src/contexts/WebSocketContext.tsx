import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connectedUsers: string[];
  notifications: Notification[];
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;
}

interface Notification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  data?: any;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(
  undefined
);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
};

interface WebSocketProviderProps {
  children: React.ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
}) => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (user && token) {
      // Initialize socket connection
      const newSocket = io("http://localhost:5000", {
        auth: {
          token: token,
        },
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000,
      });

      newSocket.on("connect", () => {
        console.log("✅ Connected to WebSocket server");
        setIsConnected(true);
      });

      newSocket.on("disconnect", (reason) => {
        console.log("❌ Disconnected from WebSocket server:", reason);
        setIsConnected(false);
      });

      newSocket.on("connect_error", (error) => {
        console.error("❌ WebSocket connection error:", error);
        setIsConnected(false);
      });

      newSocket.on("reconnect_failed", () => {
        console.log("❌ WebSocket reconnection failed");
        setIsConnected(false);
      });

      // Listen for user connection events
      newSocket.on("user_connected", (data) => {
        setConnectedUsers((prev) => [
          ...prev.filter((userId) => userId !== data.userId),
          data.userId,
        ]);
      });

      newSocket.on("user_disconnected", (data) => {
        setConnectedUsers((prev) =>
          prev.filter((userId) => userId !== data.userId)
        );
      });

      newSocket.on("connected_users", (data) => {
        setConnectedUsers(data.users || []);
      });

      // Listen for project events
      newSocket.on("project_created", (data) => {
        addNotification({
          type: "success",
          title: "New Project Created",
          message: `${data.createdBy.name} created project "${data.project.name}"`,
          data: data.project,
        });
      });

      newSocket.on("project_updated", (data) => {
        addNotification({
          type: "info",
          title: "Project Updated",
          message: `${data.updatedBy.name} updated project "${
            data.project?.name || data.projectId
          }"`,
          data,
        });
      });

      newSocket.on("project_deleted", (data) => {
        addNotification({
          type: "warning",
          title: "Project Deleted",
          message: `${data.deletedBy.name} deleted a project`,
          data,
        });
      });

      newSocket.on("projects_bulk_deleted", (data) => {
        addNotification({
          type: "warning",
          title: "Multiple Projects Deleted",
          message: `${data.deletedBy.name} deleted ${data.count} projects`,
          data,
        });
      });

      // Listen for node events
      newSocket.on("node_created", (data) => {
        addNotification({
          type: "success",
          title: "New Node Created",
          message: `${data.createdBy.name} created node "${data.node.name}"`,
          data: data.node,
        });
      });

      newSocket.on("node_updated", (data) => {
        addNotification({
          type: "info",
          title: "Node Updated",
          message: `${data.updatedBy.name} updated node "${
            data.node?.name || data.nodeId
          }"`,
          data,
        });
      });

      // Listen for template events
      newSocket.on("template_created", (data) => {
        addNotification({
          type: "success",
          title: "New Template Created",
          message: `${data.createdBy.name} created template "${data.template.name}"`,
          data: data.template,
        });
      });

      newSocket.on("template_updated", (data) => {
        addNotification({
          type: "info",
          title: "Template Updated",
          message: `${data.updatedBy.name} updated template "${
            data.template?.name || data.templateId
          }"`,
          data,
        });
      });

      // Listen for user activity
      newSocket.on("user_activity_update", (data) => {
        console.log("User activity update:", data);
        // You can implement activity tracking here
      });

      newSocket.on("user_disconnected", (data) => {
        addNotification({
          type: "info",
          title: "User Disconnected",
          message: `${data.user} went offline`,
          data,
        });
      });

      // Listen for direct notifications
      newSocket.on("notification", (data) => {
        addNotification({
          type: data.type || "info",
          title: data.title || "Notification",
          message: data.message,
          data,
        });
      });

      // Listen for project collaboration events
      newSocket.on("user_joined_project", (data) => {
        addNotification({
          type: "info",
          title: "User Joined Project",
          message: `${data.user.name} joined project collaboration`,
          data,
        });
      });

      newSocket.on("user_left_project", (data) => {
        addNotification({
          type: "info",
          title: "User Left Project",
          message: `${data.user.name} left project collaboration`,
          data,
        });
      });

      setSocket(newSocket);

      return () => {
        console.log("🧹 Cleaning up WebSocket connection");
        newSocket.disconnect();
        setSocket(null);
        setIsConnected(false);
        setConnectedUsers([]);
        setNotifications([]);
      };
    } else {
      // User logged out or no token - cleanup any existing connections
      if (socket) {
        console.log("🚪 User logged out, disconnecting WebSocket");
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
        setConnectedUsers([]);
        setNotifications([]);
      }
    }
  }, [user, token]);

  const addNotification = (
    notification: Omit<Notification, "id" | "timestamp" | "read">
  ) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      read: false,
    };

    setNotifications((prev) => [newNotification, ...prev].slice(0, 50)); // Keep only last 50 notifications
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const value: WebSocketContextType = {
    socket,
    isConnected,
    connectedUsers,
    notifications,
    markNotificationAsRead,
    clearAllNotifications,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};
