import React, { useState } from "react";
import {
  StarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  TrashIcon,
  CogIcon,
  GlobeAltIcon,
  CalendarIcon,
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

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleString();
  };

  const statusDisplay = getStatusDisplay(account.validationStatus);
  const permissions = getPermissionsDisplay();

  return (
    <div
      className={`bg-white rounded-lg shadow-md border-2 transition-all duration-200 ${
        isDefault
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
                  className="h-12 w-12 rounded-full border-2 border-gray-200"
                />
              ) : (
                <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
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
                  <p className="text-sm text-gray-500">{account.email}</p>
                )}
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
        <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
          <div className="text-center">
            <p className="text-2xl font-semibold text-gray-900">
              {account.stats.repositoriesCreated}
            </p>
            <p className="text-xs text-gray-500">Repositories Created</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-semibold text-gray-900">
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
        </div>
      </div>

      {/* Expanded Details */}
      {showDetails && (
        <div className="px-6 pb-6 border-t border-gray-200">
          <div className="pt-4 space-y-4">
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

            {/* Timestamps */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Account Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-600">
                <div className="flex items-center">
                  <CalendarIcon className="h-3 w-3 mr-2" />
                  <span>Created: {formatDate(account.createdAt)}</span>
                </div>
                <div className="flex items-center">
                  <CalendarIcon className="h-3 w-3 mr-2" />
                  <span>
                    Last Validated: {formatDateTime(account.lastValidatedAt)}
                  </span>
                </div>
                <div className="flex items-center">
                  <GlobeAltIcon className="h-3 w-3 mr-2" />
                  <span>GitHub ID: {account.githubId}</span>
                </div>
                <div className="flex items-center">
                  <ClockIcon className="h-3 w-3 mr-2" />
                  <span>
                    Last Repository:{" "}
                    {formatDate(account.stats.lastRepositoryCreated)}
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
