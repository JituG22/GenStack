import React, { useState, useEffect } from "react";
import { useWebSocket } from "../contexts/WebSocketContext";
import {
  CheckCircleIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  XMarkIcon,
  BellIcon,
} from "@heroicons/react/24/outline";

interface NotificationToastProps {
  notification: {
    id: string;
    type: "info" | "success" | "warning" | "error";
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
  };
  onClose: (id: string) => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onClose,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(notification.id);
    }, 5000); // Auto-dismiss after 5 seconds

    return () => clearTimeout(timer);
  }, [notification.id, onClose]);

  const getIcon = () => {
    switch (notification.type) {
      case "success":
        return <CheckCircleIcon className="h-5 w-5 text-green-400" />;
      case "warning":
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />;
      case "error":
        return <XCircleIcon className="h-5 w-5 text-red-400" />;
      default:
        return <InformationCircleIcon className="h-5 w-5 text-blue-400" />;
    }
  };

  const getBgColor = () => {
    switch (notification.type) {
      case "success":
        return "bg-green-50 border-green-200";
      case "warning":
        return "bg-yellow-50 border-yellow-200";
      case "error":
        return "bg-red-50 border-red-200";
      default:
        return "bg-blue-50 border-blue-200";
    }
  };

  return (
    <div
      className={`max-w-sm w-full ${getBgColor()} border shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 transform transition-all duration-300 ease-in-out`}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">{getIcon()}</div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className="text-sm font-medium text-gray-900">
              {notification.title}
            </p>
            <p className="mt-1 text-sm text-gray-500">{notification.message}</p>
            <p className="mt-1 text-xs text-gray-400">
              {notification.timestamp.toLocaleTimeString()}
            </p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={() => onClose(notification.id)}
            >
              <span className="sr-only">Close</span>
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
}) => {
  const { notifications, markNotificationAsRead, clearAllNotifications } =
    useWebSocket();

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
          <div className="flex space-x-2">
            {notifications.length > 0 && (
              <button
                onClick={clearAllNotifications}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear All
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <BellIcon className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-2">No notifications</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    notification.read
                      ? "bg-gray-50 border-gray-200"
                      : "bg-white border-blue-200 shadow-sm"
                  }`}
                  onClick={() => markNotificationAsRead(notification.id)}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      {notification.type === "success" && (
                        <CheckCircleIcon className="h-4 w-4 text-green-400" />
                      )}
                      {notification.type === "warning" && (
                        <ExclamationTriangleIcon className="h-4 w-4 text-yellow-400" />
                      )}
                      {notification.type === "error" && (
                        <XCircleIcon className="h-4 w-4 text-red-400" />
                      )}
                      {notification.type === "info" && (
                        <InformationCircleIcon className="h-4 w-4 text-blue-400" />
                      )}
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-500">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {notification.timestamp.toLocaleString()}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="flex-shrink-0">
                        <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const NotificationSystem: React.FC = () => {
  const { notifications } = useWebSocket();
  const [visibleToasts, setVisibleToasts] = useState<string[]>([]);
  const [showCenter, setShowCenter] = useState(false);

  useEffect(() => {
    // Show new notifications as toasts
    const unreadNotifications = notifications
      .filter((n) => !n.read)
      .slice(0, 3) // Show max 3 toasts at once
      .map((n) => n.id);

    setVisibleToasts(unreadNotifications);
  }, [notifications]);

  const closeToast = (id: string) => {
    setVisibleToasts((prev) => prev.filter((toastId) => toastId !== id));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      {/* Notification Bell */}
      <div className="relative">
        <button
          onClick={() => setShowCenter(!showCenter)}
          className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-md"
        >
          <BellIcon className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        {/* Notification Center */}
        <NotificationCenter
          isOpen={showCenter}
          onClose={() => setShowCenter(false)}
        />
      </div>

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-4">
        {visibleToasts.map((toastId) => {
          const notification = notifications.find((n) => n.id === toastId);
          return notification ? (
            <NotificationToast
              key={toastId}
              notification={notification}
              onClose={closeToast}
            />
          ) : null;
        })}
      </div>
    </>
  );
};

export default NotificationSystem;
