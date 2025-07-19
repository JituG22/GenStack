import React from "react";
import {
  ChartBarIcon,
  CubeIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ServerIcon,
} from "@heroicons/react/24/outline";
import { GitHubAccount } from "../types";

interface GitHubAccountStatsProps {
  accounts: GitHubAccount[];
}

export const GitHubAccountStats: React.FC<GitHubAccountStatsProps> = ({
  accounts,
}) => {
  const calculateStats = () => {
    const totalAccounts = accounts.length;
    const validAccounts = accounts.filter(
      (account) => account.validationStatus === "valid"
    ).length;
    const invalidAccounts = accounts.filter(
      (account) => account.validationStatus === "invalid"
    ).length;
    const pendingAccounts = accounts.filter(
      (account) => account.validationStatus === "pending"
    ).length;

    const totalRepositories = accounts.reduce(
      (sum, account) => sum + account.stats.repositoriesCreated,
      0
    );
    const totalApiCalls = accounts.reduce(
      (sum, account) => sum + account.stats.totalApiCalls,
      0
    );

    const recentlyUsed = accounts.filter((account) => {
      if (!account.lastUsedAt) return false;
      const lastUsed = new Date(account.lastUsedAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return lastUsed > weekAgo;
    }).length;

    const organizationAccounts = accounts.filter(
      (account) => account.githubType === "Organization"
    ).length;
    const personalAccounts = accounts.filter(
      (account) => account.githubType === "User"
    ).length;

    // Calculate average repositories per account
    const avgRepositories =
      totalAccounts > 0 ? Math.round(totalRepositories / totalAccounts) : 0;

    // Find most active account
    const mostActiveAccount = accounts.reduce((most, current) => {
      return current.stats.repositoriesCreated > most.stats.repositoriesCreated
        ? current
        : most;
    }, accounts[0]);

    // Calculate account health score (percentage of valid accounts)
    const healthScore =
      totalAccounts > 0 ? Math.round((validAccounts / totalAccounts) * 100) : 0;

    return {
      totalAccounts,
      validAccounts,
      invalidAccounts,
      pendingAccounts,
      totalRepositories,
      totalApiCalls,
      recentlyUsed,
      organizationAccounts,
      personalAccounts,
      avgRepositories,
      mostActiveAccount,
      healthScore,
    };
  };

  const stats = calculateStats();

  const getHealthScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600 bg-green-100";
    if (score >= 70) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "k";
    }
    return num.toString();
  };

  if (accounts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="text-center">
          <ServerIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No GitHub Accounts
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Add your first GitHub account to see statistics here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Accounts */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ServerIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900">
                Total Accounts
              </p>
              <p className="text-2xl font-semibold text-blue-600">
                {stats.totalAccounts}
              </p>
            </div>
          </div>
        </div>

        {/* Account Health */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900">
                Account Health
              </p>
              <div className="flex items-center space-x-2">
                <p className="text-2xl font-semibold text-green-600">
                  {stats.healthScore}%
                </p>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getHealthScoreColor(
                    stats.healthScore
                  )}`}
                >
                  {stats.validAccounts}/{stats.totalAccounts} Valid
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Total Repositories */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CubeIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900">
                Repositories Created
              </p>
              <p className="text-2xl font-semibold text-purple-600">
                {formatNumber(stats.totalRepositories)}
              </p>
            </div>
          </div>
        </div>

        {/* Recently Active */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900">
                Recently Active
              </p>
              <p className="text-2xl font-semibold text-indigo-600">
                {stats.recentlyUsed}
              </p>
              <p className="text-xs text-gray-500">Past 7 days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Status Breakdown */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <ChartBarIcon className="h-5 w-5 mr-2" />
            Account Status
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-700">Valid Accounts</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {stats.validAccounts}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-700">Invalid Accounts</span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {stats.invalidAccounts}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-700">
                  Pending Validation
                </span>
              </div>
              <span className="text-sm font-medium text-gray-900">
                {stats.pendingAccounts}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex text-xs text-gray-600 mb-1">
              <span>Account Health</span>
              <span className="ml-auto">{stats.healthScore}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  stats.healthScore >= 90
                    ? "bg-green-500"
                    : stats.healthScore >= 70
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
                style={{ width: `${stats.healthScore}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Account Types & Usage */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Usage Statistics
          </h3>
          <div className="space-y-4">
            {/* Account Types */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Account Types
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded">
                  <p className="text-2xl font-semibold text-blue-600">
                    {stats.personalAccounts}
                  </p>
                  <p className="text-xs text-gray-600">Personal</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded">
                  <p className="text-2xl font-semibold text-purple-600">
                    {stats.organizationAccounts}
                  </p>
                  <p className="text-xs text-gray-600">Organizations</p>
                </div>
              </div>
            </div>

            {/* API Usage */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                API Usage
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total API Calls</span>
                  <span className="text-sm font-medium">
                    {formatNumber(stats.totalApiCalls)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    Avg Repositories/Account
                  </span>
                  <span className="text-sm font-medium">
                    {stats.avgRepositories}
                  </span>
                </div>
              </div>
            </div>

            {/* Most Active Account */}
            {stats.mostActiveAccount && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Most Active Account
                </h4>
                <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                  {stats.mostActiveAccount.avatarUrl ? (
                    <img
                      src={stats.mostActiveAccount.avatarUrl}
                      alt={stats.mostActiveAccount.nickname}
                      className="h-6 w-6 rounded-full"
                    />
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-gray-600 text-xs">
                        {stats.mostActiveAccount.nickname
                          .charAt(0)
                          .toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {stats.mostActiveAccount.nickname}
                    </p>
                    <p className="text-xs text-gray-500">
                      {stats.mostActiveAccount.stats.repositoriesCreated}{" "}
                      repositories
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Issues & Warnings */}
      {stats.invalidAccounts > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Attention Required
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  You have {stats.invalidAccounts} invalid account
                  {stats.invalidAccounts !== 1 ? "s" : ""} that need attention.
                  Please check the account details and update the tokens if
                  necessary.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
