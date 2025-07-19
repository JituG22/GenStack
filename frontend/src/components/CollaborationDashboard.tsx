import React, { useState, useEffect } from "react";
import { useCollaboration } from "../contexts/CollaborationContext";
import {
  UsersIcon,
  DocumentTextIcon,
  ClockIcon,
  ChartBarIcon,
  EyeIcon,
  PlayIcon,
  StopIcon,
} from "@heroicons/react/24/outline";

interface CollaborationStats {
  totalSessions: number;
  totalParticipants: number;
  activeProjects: number;
  averageParticipantsPerSession: number;
}

export const CollaborationDashboard: React.FC = () => {
  const { isConnected, activeSessions, getSessionStats, connectionError } =
    useCollaboration();
  const [stats, setStats] = useState<CollaborationStats>({
    totalSessions: 0,
    totalParticipants: 0,
    activeProjects: 0,
    averageParticipantsPerSession: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const collaborationStats = await getSessionStats();
        setStats(collaborationStats);
      } catch (error) {
        console.error("Error fetching collaboration stats:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isConnected) {
      fetchStats();
      // Refresh stats every 30 seconds
      const interval = setInterval(fetchStats, 30000);
      return () => clearInterval(interval);
    }
  }, [isConnected, getSessionStats]);

  const ConnectionStatus = () => (
    <div className="flex items-center space-x-2">
      <div
        className={`w-3 h-3 rounded-full ${
          isConnected ? "bg-green-500" : "bg-red-500"
        }`}
      ></div>
      <span
        className={`text-sm font-medium ${
          isConnected ? "text-green-700" : "text-red-700"
        }`}
      >
        {isConnected ? "Connected" : connectionError || "Disconnected"}
      </span>
    </div>
  );

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
  }> = ({ title, value, icon, color }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center">
        <div className={`flex-shrink-0 ${color}`}>{icon}</div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">
              {title}
            </dt>
            <dd className="text-lg font-medium text-gray-900">{value}</dd>
          </dl>
        </div>
      </div>
    </div>
  );

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-24 rounded-lg"></div>
            ))}
          </div>
          <div className="bg-gray-200 h-64 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Real-time Collaboration
          </h1>
          <p className="text-gray-600">
            Monitor and manage collaborative editing sessions
          </p>
        </div>
        <ConnectionStatus />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Active Sessions"
          value={stats.totalSessions}
          icon={<PlayIcon className="h-6 w-6" />}
          color="text-blue-600"
        />
        <StatCard
          title="Total Participants"
          value={stats.totalParticipants}
          icon={<UsersIcon className="h-6 w-6" />}
          color="text-green-600"
        />
        <StatCard
          title="Active Projects"
          value={stats.activeProjects}
          icon={<DocumentTextIcon className="h-6 w-6" />}
          color="text-purple-600"
        />
        <StatCard
          title="Avg. Participants/Session"
          value={stats.averageParticipantsPerSession.toFixed(1)}
          icon={<ChartBarIcon className="h-6 w-6" />}
          color="text-orange-600"
        />
      </div>

      {/* Active Sessions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Active Collaborative Sessions
            </h3>
            <span className="text-sm text-gray-500">
              {activeSessions.length} session
              {activeSessions.length !== 1 ? "s" : ""}
            </span>
          </div>

          {activeSessions.length === 0 ? (
            <div className="text-center py-12">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No active sessions
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Start a collaborative editing session to see it here.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Session
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Participants
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Activity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {activeSessions.map((session) => (
                    <tr key={session.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <div className="text-sm font-medium text-gray-900">
                            {session.fileName}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {session.projectId}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <UsersIcon className="h-4 w-4 text-gray-400 mr-1" />
                          <span className="text-sm text-gray-900">
                            {session.participantCount}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <ClockIcon className="h-4 w-4 text-gray-400 mr-1" />
                          <span className="text-sm text-gray-500">
                            {formatTimeAgo(session.lastActivity)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-500">
                          {formatTimeAgo(session.createdAt)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          className="text-indigo-600 hover:text-indigo-900 flex items-center"
                          title="View session"
                        >
                          <EyeIcon className="h-4 w-4 mr-1" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Connection Issues */}
      {!isConnected && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <StopIcon className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Connection Issue
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>
                  {connectionError ||
                    "Unable to connect to the collaboration server."}
                  Real-time features may not work properly.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollaborationDashboard;
