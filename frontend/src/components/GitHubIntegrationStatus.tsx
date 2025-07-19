import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  Cog6ToothIcon as SettingsIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { enhancedGitHubProjectsService } from "../services/enhancedGitHubProjectsService";

interface GitHubIntegrationStatusProps {
  className?: string;
}

export const GitHubIntegrationStatus: React.FC<
  GitHubIntegrationStatusProps
> = ({ className = "" }) => {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkIntegrationStatus();
  }, []);

  const checkIntegrationStatus = async () => {
    try {
      setLoading(true);
      const statusData =
        await enhancedGitHubProjectsService.checkAccountsReadiness();
      setStatus(statusData);
    } catch (error) {
      console.error("Error checking GitHub integration status:", error);
      setStatus({
        hasAccounts: false,
        hasActiveAccounts: false,
        canCreateRepos: false,
        recommendations: [
          "Failed to check GitHub status. Please try refreshing.",
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}
      >
        <div className="animate-pulse">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
          <div className="mt-3 space-y-2">
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  const getStatusIcon = () => {
    if (status?.canCreateRepos) {
      return <CheckCircleIcon className="w-6 h-6 text-green-500" />;
    }
    return <ExclamationTriangleIcon className="w-6 h-6 text-yellow-500" />;
  };

  const getStatusText = () => {
    if (status?.canCreateRepos) {
      return "GitHub Integration Ready";
    }
    if (status?.hasAccounts) {
      return "GitHub Integration Needs Attention";
    }
    return "GitHub Integration Not Configured";
  };

  const getStatusColor = () => {
    if (status?.canCreateRepos) {
      return "text-green-800 bg-green-50 border-green-200";
    }
    if (status?.hasAccounts) {
      return "text-yellow-800 bg-yellow-50 border-yellow-200";
    }
    return "text-red-800 bg-red-50 border-red-200";
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              {getStatusText()}
            </h3>
            <div className="mt-1 text-sm text-gray-600">
              {status?.totalAccounts || 0} account(s) configured,{" "}
              {status?.activeAccounts || 0} active
            </div>
          </div>
        </div>
        <Link
          to="/github-config"
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <SettingsIcon className="w-4 h-4 mr-2" />
          Configure
        </Link>
      </div>

      {/* Status Summary */}
      <div className={`mt-4 p-3 rounded-md border ${getStatusColor()}`}>
        <div className="text-sm space-y-1">
          {status?.recommendations?.map(
            (recommendation: string, index: number) => (
              <div key={index} className="flex items-start">
                <span className="mr-2">•</span>
                <span>{recommendation}</span>
              </div>
            )
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="text-center p-3 bg-gray-50 rounded-md">
          <div className="text-lg font-semibold text-gray-900">
            {status?.totalAccounts || 0}
          </div>
          <div className="text-sm text-gray-600">Total Accounts</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-md">
          <div className="text-lg font-semibold text-gray-900">
            {status?.activeAccounts || 0}
          </div>
          <div className="text-sm text-gray-600">Active Accounts</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-4 flex items-center justify-between text-sm">
        <div className="flex items-center space-x-4">
          {status?.hasDefaultAccount ? (
            <div className="flex items-center text-green-600">
              <CheckCircleIcon className="w-4 h-4 mr-1" />
              Default account set
            </div>
          ) : (
            <div className="flex items-center text-yellow-600">
              <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
              No default account
            </div>
          )}
        </div>
        {!status?.hasAccounts && (
          <Link
            to="/github-config"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-500 font-medium"
          >
            <PlusIcon className="w-4 h-4 mr-1" />
            Add GitHub Account
          </Link>
        )}
      </div>
    </div>
  );
};

export default GitHubIntegrationStatus;
