import React, { useState, useMemo } from "react";
import {
  BellIcon,
  CheckIcon,
  TrashIcon,
  FunnelIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { useNotifications } from "../hooks/useNotifications";
import { Notification } from "../services/notificationService";

interface NotificationCenterProps {
  className?: string;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  className = "",
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>(
    []
  );

  const {
    notifications,
    unreadCount,
    totalCount,
    stats,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    refetch,
  } = useNotifications({
    page: currentPage,
    limit: 20,
    unreadOnly: showUnreadOnly,
    type: selectedType !== "all" ? selectedType : undefined,
    category: selectedCategory !== "all" ? selectedCategory : undefined,
    autoRefresh: true,
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case "warning":
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case "error":
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <InformationCircleIcon className="h-5 w-5 text-blue-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "border-l-red-500 bg-red-50";
      case "high":
        return "border-l-orange-500 bg-orange-50";
      case "medium":
        return "border-l-blue-500 bg-blue-50";
      default:
        return "border-l-gray-300 bg-gray-50";
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    if (notification.actionUrl) {
      window.open(notification.actionUrl, "_blank");
    }
  };

  const handleMarkAsRead = async (
    e: React.MouseEvent,
    notificationId: string
  ) => {
    e.stopPropagation();
    await markAsRead(notificationId);
  };

  const handleArchive = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    await archiveNotification(notificationId);
  };

  const handleSelectNotification = (notificationId: string) => {
    setSelectedNotifications((prev) =>
      prev.includes(notificationId)
        ? prev.filter((id) => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const handleSelectAll = () => {
    const allIds = notifications.map((n) => n.id);
    setSelectedNotifications((prev) =>
      prev.length === allIds.length ? [] : allIds
    );
  };

  const handleBulkMarkAsRead = async () => {
    const promises = selectedNotifications.map((id) => markAsRead(id));
    await Promise.all(promises);
    setSelectedNotifications([]);
  };

  const handleBulkArchive = async () => {
    const promises = selectedNotifications.map((id) => archiveNotification(id));
    await Promise.all(promises);
    setSelectedNotifications([]);
  };

  const typeOptions = useMemo(() => {
    if (!stats) return [];
    return Object.keys(stats.byType).map((type) => ({
      value: type,
      label: type.charAt(0).toUpperCase() + type.slice(1),
      count: stats.byType[type],
    }));
  }, [stats]);

  const categoryOptions = useMemo(() => {
    if (!stats) return [];
    return Object.keys(stats.byCategory).map((category) => ({
      value: category,
      label: category.charAt(0).toUpperCase() + category.slice(1),
      count: stats.byCategory[category],
    }));
  }, [stats]);

  const totalPages = Math.ceil(totalCount / 20);

  return (
    <div className={`max-w-4xl mx-auto p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <BellIcon className="h-8 w-8 mr-3" />
              Notifications
            </h1>
            <p className="text-gray-600 mt-1">
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"} •{" "}
              {totalCount} total
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => refetch()}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg border border-gray-200"
              disabled={loading}
            >
              <svg
                className={`h-5 w-5 ${loading ? "animate-spin" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 border border-blue-200 rounded-lg hover:bg-blue-50"
              >
                Mark all read
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center space-x-4 mb-4">
          <FunnelIcon className="h-5 w-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filters</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              {typeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} ({option.count})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} ({option.count})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <div className="flex items-center h-10">
              <input
                type="checkbox"
                id="unread-only"
                checked={showUnreadOnly}
                onChange={(e) => setShowUnreadOnly(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="unread-only"
                className="ml-2 text-sm text-gray-700"
              >
                Unread only
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bulk Actions
            </label>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleSelectAll}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {selectedNotifications.length === notifications.length
                  ? "Deselect all"
                  : "Select all"}
              </button>
              {selectedNotifications.length > 0 && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleBulkMarkAsRead}
                    className="text-sm text-green-600 hover:text-green-800"
                  >
                    Mark read ({selectedNotifications.length})
                  </button>
                  <button
                    onClick={handleBulkArchive}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Archive ({selectedNotifications.length})
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Notifications List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading && notifications.length === 0 ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <BellIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No notifications found</p>
          </div>
        ) : (
          <div>
            {notifications.map((notification, index) => (
              <div
                key={notification.id}
                className={`relative border-l-4 ${
                  notification.read
                    ? "border-l-transparent"
                    : "border-l-blue-500"
                } ${getPriorityColor(notification.priority)} ${
                  index !== notifications.length - 1
                    ? "border-b border-gray-200"
                    : ""
                }`}
              >
                <div
                  className="p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedNotifications.includes(notification.id)}
                      onChange={() => handleSelectNotification(notification.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />

                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p
                            className={`text-sm font-medium ${
                              notification.read
                                ? "text-gray-900"
                                : "text-gray-900 font-semibold"
                            }`}
                          >
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <div className="flex items-center space-x-4 mt-2">
                            <span className="text-xs text-gray-400">
                              {formatTimeAgo(notification.createdAt)}
                            </span>
                            <span className="text-xs text-gray-400">
                              {notification.category}
                            </span>
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                notification.priority === "urgent"
                                  ? "bg-red-100 text-red-800"
                                  : notification.priority === "high"
                                  ? "bg-orange-100 text-orange-800"
                                  : notification.priority === "medium"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {notification.priority}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center space-x-2 ml-4">
                          {!notification.read && (
                            <button
                              onClick={(e) =>
                                handleMarkAsRead(e, notification.id)
                              }
                              className="p-2 text-gray-400 hover:text-blue-600 rounded-lg"
                              title="Mark as read"
                            >
                              <CheckIcon className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={(e) => handleArchive(e, notification.id)}
                            className="p-2 text-gray-400 hover:text-red-600 rounded-lg"
                            title="Archive"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {(currentPage - 1) * 20 + 1} to{" "}
            {Math.min(currentPage * 20, totalCount)} of {totalCount}{" "}
            notifications
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <span className="px-3 py-1 text-sm text-gray-700">
              {currentPage} of {totalPages}
            </span>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
