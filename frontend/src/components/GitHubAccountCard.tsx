import React, { useState } from "react";
import {
  StarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  TrashIcon,
  CogIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import { GitHubAccount } from "../types";
import gitHubAccountsService from "../services/gitHubAccountsService";

interface GitHubAccountCardProps {
  account: GitHubAccount;
  isDefault: boolean;
  onSetDefault: (accountId: string) => void;
  onDelete: (accountId: string, accountName: string) => void;
}

export const GitHubAccountCard: React.FC<GitHubAccountCardProps> = ({
  account,
  isDefault,
  onSetDefault,
  onDelete,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const isActive = account.isActive && account.validationStatus === "valid";

  const getStatusDisplay = (status: string) => {
    return gitHubAccountsService.getValidationStatusDisplay(status);
  };

  const getPermissionsDisplay = () => {
    const { canCreateRepo, canDeleteRepo, missingPermissions } =
      gitHubAccountsService.hasRequiredPermissions(account);

    return {
      canCreateRepo,
      canDeleteRepo,
      missingPermissions,
    };
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString();
  };

  const statusDisplay = getStatusDisplay(account.validationStatus);
  const permissions = getPermissionsDisplay();

  return (
    <div
      className={`bg-white rounded-lg shadow-md border-2 transition-all duration-200 ${
        isActive
          ? "border-emerald-400 ring-2 ring-emerald-100 bg-gradient-to-r from-emerald-50 to-white"
          : isDefault
          ? "border-yellow-300 ring-2 ring-yellow-100"
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      {/* Header */}
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {account.avatarUrl ? (
                <img
                  src={account.avatarUrl}
                  alt={account.nickname}
                  className={`h-12 w-12 rounded-full border-2 ${
                    isActive
                      ? "border-emerald-400 ring-2 ring-emerald-200"
                      : isDefault
                      ? "border-yellow-400 ring-2 ring-yellow-200"
                      : "border-gray-200"
                  }`}
                />
              ) : (
                <div
                  className={`h-12 w-12 rounded-full flex items-center justify-center ${
                    isActive
                      ? "bg-emerald-300 border-2 border-emerald-400 ring-2 ring-emerald-200"
                      : isDefault
                      ? "bg-yellow-300 border-2 border-yellow-400 ring-2 ring-yellow-200"
                      : "bg-gray-300"
                  }`}
                >
                  <span className="text-gray-600 font-medium text-lg">
                    {account.nickname.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Account Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {account.nickname}
                </h3>
                {isActive && (
                  <div className="flex items-center space-x-1 bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full text-xs font-medium">
                    <div className="h-2 w-2 bg-emerald-600 rounded-full animate-pulse"></div>
                    <span>Active</span>
                  </div>
                )}
                {isDefault && (
                  <div className="flex items-center space-x-1 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                    <StarIconSolid className="h-3 w-3" />
                    <span>Default</span>
                  </div>
                )}
              </div>

              <div className="mt-1 space-y-1">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">@{account.username}</span>
                  {account.githubName &&
                    account.githubName !== account.username && (
                      <span className="ml-2">({account.githubName})</span>
                    )}
                </p>
                {account.email && (
                  <p className="text-sm text-gray-500 flex items-center">
                    <svg
                      className="h-3 w-3 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                      />
                    </svg>
                    {account.email}
                  </p>
                )}
                <div className="flex items-center space-x-3 text-xs text-gray-500">
                  <span className="flex items-center">
                    <svg
                      className="h-3 w-3 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                    ID: {account.githubId}
                  </span>
                  <span className="flex items-center">
                    <ClockIcon className="h-3 w-3 mr-1" />
                    Last API: {formatDate(account.stats.lastApiCall)}
                  </span>
                </div>
              </div>

              {/* Status */}
              <div className="mt-2 flex items-center space-x-4">
                <div
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusDisplay.color}`}
                >
                  <span className="mr-1">{statusDisplay.icon}</span>
                  {statusDisplay.text}
                  {account.validationError &&
                    account.validationStatus === "invalid" && (
                      <span className="ml-1" title={account.validationError}>
                        ⚠️
                      </span>
                    )}
                </div>

                <div className="text-xs text-gray-500">
                  {account.githubType === "Organization"
                    ? "Organization"
                    : "Personal"}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {!isDefault && (
              <button
                onClick={() => onSetDefault(account.id)}
                className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                title="Set as default account"
              >
                <StarIcon className="h-3 w-3 mr-1" />
                Set Default
              </button>
            )}

            <button
              onClick={() => setShowDetails(!showDetails)}
              className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <CogIcon className="h-3 w-3 mr-1" />
              {showDetails ? "Hide" : "Details"}
            </button>

            <button
              onClick={() => onDelete(account.id, account.nickname)}
              className="inline-flex items-center px-3 py-1 border border-red-300 shadow-sm text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              title="Delete account"
            >
              <TrashIcon className="h-3 w-3 mr-1" />
              Delete
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-4 grid grid-cols-4 gap-3 pt-4 border-t border-gray-200">
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-900">
              {account.stats.repositoriesCreated}
            </p>
            <p className="text-xs text-gray-500">Repos Created</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-900">
              {account.stats.totalApiCalls}
            </p>
            <p className="text-xs text-gray-500">API Calls</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-900">
              {formatDate(account.lastUsedAt)}
            </p>
            <p className="text-xs text-gray-500">Last Used</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-900">
              {account.scopes.length}
            </p>
            <p className="text-xs text-gray-500">Permissions</p>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {showDetails && (
        <div className="px-6 pb-6 border-t border-gray-200">
          <div className="pt-4 space-y-4">
            {/* Active Status */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Account Status
              </h4>
              <div className="flex flex-wrap gap-2">
                <div
                  className={`flex items-center text-xs px-2 py-1 rounded ${
                    isActive
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {isActive ? (
                    <>
                      <div className="h-2 w-2 bg-emerald-600 rounded-full animate-pulse mr-1"></div>
                      Active
                    </>
                  ) : (
                    <>
                      <div className="h-2 w-2 bg-gray-400 rounded-full mr-1"></div>
                      Inactive
                    </>
                  )}
                </div>
                {isDefault && (
                  <div className="flex items-center text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800">
                    <StarIconSolid className="h-3 w-3 mr-1" />
                    Default
                  </div>
                )}
              </div>
            </div>

            {/* Permissions */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Permissions
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div
                  className={`flex items-center text-xs px-2 py-1 rounded ${
                    permissions.canCreateRepo
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {permissions.canCreateRepo ? (
                    <CheckCircleIcon className="h-3 w-3 mr-1" />
                  ) : (
                    <XCircleIcon className="h-3 w-3 mr-1" />
                  )}
                  Create Repositories
                </div>
                <div
                  className={`flex items-center text-xs px-2 py-1 rounded ${
                    permissions.canDeleteRepo
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {permissions.canDeleteRepo ? (
                    <CheckCircleIcon className="h-3 w-3 mr-1" />
                  ) : (
                    <XCircleIcon className="h-3 w-3 mr-1" />
                  )}
                  Delete Repositories
                </div>
              </div>

              {permissions.missingPermissions.length > 0 && (
                <div className="mt-2 text-xs text-red-600">
                  <p className="font-medium">Missing permissions:</p>
                  <p>{permissions.missingPermissions.join(", ")}</p>
                </div>
              )}
            </div>

            {/* Token Scopes */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Token Scopes
              </h4>
              <div className="flex flex-wrap gap-1">
                {account.scopes.length > 0 ? (
                  account.scopes.map((scope) => (
                    <span
                      key={scope}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {scope}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-500">
                    No scopes available
                  </span>
                )}
              </div>
            </div>

            {/* Account Information */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                GitHub Account Details
              </h4>
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">GitHub Username:</span>
                    <span className="font-medium text-gray-900">
                      @{account.githubLogin}
                    </span>
                  </div>
                  {account.githubName && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Display Name:</span>
                      <span className="font-medium text-gray-900">
                        {account.githubName}
                      </span>
                    </div>
                  )}
                  {account.email && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span
                        className="font-medium text-gray-900 truncate"
                        title={account.email}
                      >
                        {account.email}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Account Type:</span>
                    <span
                      className={`font-medium px-2 py-1 rounded-full text-xs ${
                        account.githubType === "Organization"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {account.githubType}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">GitHub ID:</span>
                    <span className="font-medium text-gray-900">
                      {account.githubId}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Profile URL:</span>
                    <a
                      href={`https://github.com/${account.githubLogin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-indigo-600 hover:text-indigo-800 truncate"
                    >
                      github.com/{account.githubLogin}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* API Usage Stats */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Usage Statistics
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {account.stats.repositoriesCreated}
                  </p>
                  <p className="text-xs text-blue-700">Repositories Created</p>
                  {account.stats.lastRepositoryCreated && (
                    <p className="text-xs text-gray-500 mt-1">
                      Last: {formatDate(account.stats.lastRepositoryCreated)}
                    </p>
                  )}
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {account.stats.totalApiCalls}
                  </p>
                  <p className="text-xs text-green-700">Total API Calls</p>
                  {account.stats.lastApiCall && (
                    <p className="text-xs text-gray-500 mt-1">
                      Last: {formatDate(account.stats.lastApiCall)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Account Timestamps */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Account Timeline
              </h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center justify-between">
                  <span className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-2" />
                    Account Added:
                  </span>
                  <span className="font-medium">
                    {formatDate(account.createdAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center">
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    Last Validated:
                  </span>
                  <span className="font-medium">
                    {account.lastValidatedAt
                      ? new Date(account.lastValidatedAt).toLocaleString()
                      : "Never"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-2" />
                    Last Used:
                  </span>
                  <span className="font-medium">
                    {formatDate(account.lastUsedAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Error Details */}
            {account.validationError &&
              account.validationStatus === "invalid" && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <h4 className="text-sm font-medium text-red-800 mb-1">
                    Validation Error
                  </h4>
                  <p className="text-sm text-red-700">
                    {account.validationError}
                  </p>
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
};
