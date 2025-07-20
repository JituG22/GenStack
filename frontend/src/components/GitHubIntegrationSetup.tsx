import React, { useState, useEffect } from "react";
import {
  CodeBracketIcon,
  LinkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { enhancedGitHubProjectsApi } from "../lib/api";
import { enhancedGitHubProjectsService } from "../services/enhancedGitHubProjectsService";

interface GitHubAccount {
  id: string;
  nickname: string;
  username: string;
  avatarUrl?: string;
  isDefault: boolean;
  isActive: boolean;
  canCreateRepos: boolean;
  canCreatePrivateRepos: boolean;
}

interface GitHubIntegrationSetupProps {
  projectId: string;
  projectName: string;
  currentGitHubConfig?: {
    enabled: boolean;
    repoUrl?: string;
    repoName?: string;
    syncStatus?: string;
  };
  onIntegrationUpdated?: () => void;
}

export const GitHubIntegrationSetup: React.FC<GitHubIntegrationSetupProps> = ({
  projectId,
  projectName,
  currentGitHubConfig,
  onIntegrationUpdated,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<GitHubAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [repositoryName, setRepositoryName] = useState<string>("");
  const [isPrivate, setIsPrivate] = useState<boolean>(false);
  const [autoSync, setAutoSync] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadAccounts();
      // Initialize repository name with project name (sanitized)
      setRepositoryName(
        projectName
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-zA-Z0-9-]/g, "")
      );
    }
  }, [isOpen, projectName]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const response =
        await enhancedGitHubProjectsService.getAvailableAccounts();
      setAccounts(response);

      // Auto-select default account if available
      const defaultAccount = response.find((acc) => acc.isDefault);
      if (defaultAccount) {
        setSelectedAccountId(defaultAccount.id);
      }
    } catch (error) {
      console.error("Error loading GitHub accounts:", error);
      setError("Failed to load GitHub accounts. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSetupIntegration = async () => {
    if (!selectedAccountId || !repositoryName.trim()) {
      setError("Please select a GitHub account and enter a repository name.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await enhancedGitHubProjectsApi.updateProjectGitHub(projectId, {
        accountId: selectedAccountId,
        repositoryName: repositoryName.trim(),
        autoSync,
        isPrivate,
      });

      setSuccess("GitHub integration has been set up successfully!");
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(null);
        if (onIntegrationUpdated) {
          onIntegrationUpdated();
        }
      }, 2000);
    } catch (error: any) {
      console.error("Error setting up GitHub integration:", error);
      setError(
        error.message ||
          "Failed to set up GitHub integration. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedAccountId("");
    setRepositoryName(
      projectName
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-zA-Z0-9-]/g, "")
    );
    setIsPrivate(true);
    setAutoSync(true);
    setError(null);
    setSuccess(null);
  };

  const handleClose = () => {
    setIsOpen(false);
    resetForm();
  };

  // If GitHub is already enabled, show status
  if (currentGitHubConfig?.enabled) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start">
          <CheckCircleIcon className="h-5 w-5 text-green-400 mt-0.5" />
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-green-800">
              GitHub Integration Active
            </h3>
            <div className="mt-2 text-sm text-green-700">
              <p>
                Repository:{" "}
                {currentGitHubConfig.repoName && (
                  <a
                    href={currentGitHubConfig.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium hover:text-green-900 underline"
                  >
                    {currentGitHubConfig.repoName}
                  </a>
                )}
              </p>
              <p className="mt-1">
                Status:{" "}
                <span className="font-medium">
                  {currentGitHubConfig.syncStatus === "synced"
                    ? "Synced"
                    : "Connected"}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If GitHub is not enabled, show setup option
  return (
    <>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-start">
          <CodeBracketIcon className="h-5 w-5 text-gray-400 mt-0.5" />
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-gray-900">
              GitHub Integration
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Connect this project to a GitHub repository for version control
              and collaboration.
            </p>
            <div className="mt-3">
              <button
                onClick={() => setIsOpen(true)}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <LinkIcon className="h-4 w-4 mr-2" />
                Set up GitHub Integration
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Setup Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 pb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Set up GitHub Integration
              </h3>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-md p-1"
                disabled={loading}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-6 pb-6">
              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
                  <div className="flex">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                    <div className="ml-3">
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {success && (
                <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-3">
                  <div className="flex">
                    <CheckCircleIcon className="h-5 w-5 text-green-400" />
                    <div className="ml-3">
                      <p className="text-sm text-green-800">{success}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {/* GitHub Account Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    GitHub Account
                  </label>
                  {accounts.length === 0 ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                      <p className="text-sm text-yellow-800">
                        No GitHub accounts found. Please configure a GitHub
                        account first.
                      </p>
                    </div>
                  ) : (
                    <select
                      value={selectedAccountId}
                      onChange={(e) => setSelectedAccountId(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      disabled={loading}
                    >
                      <option value="">Select a GitHub account</option>
                      {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.nickname} (@{account.username})
                          {account.isDefault ? " (Default)" : ""}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Repository Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Repository Name
                  </label>
                  <input
                    type="text"
                    value={repositoryName}
                    onChange={(e) => setRepositoryName(e.target.value)}
                    placeholder="my-project-name"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    disabled={loading}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Repository name should be lowercase, use hyphens instead of
                    spaces
                  </p>
                </div>

                {/* Repository Settings */}
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      id="private-repo"
                      type="checkbox"
                      checked={isPrivate}
                      onChange={(e) => setIsPrivate(e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      disabled={loading}
                    />
                    <label
                      htmlFor="private-repo"
                      className="ml-2 block text-sm text-gray-900"
                    >
                      Private repository
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      id="auto-sync"
                      type="checkbox"
                      checked={autoSync}
                      onChange={(e) => setAutoSync(e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      disabled={loading}
                    />
                    <label
                      htmlFor="auto-sync"
                      className="ml-2 block text-sm text-gray-900"
                    >
                      Enable automatic synchronization
                    </label>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSetupIntegration}
                  disabled={
                    loading ||
                    accounts.length === 0 ||
                    !selectedAccountId ||
                    !repositoryName.trim()
                  }
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Setting up..." : "Set up Integration"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GitHubIntegrationSetup;
