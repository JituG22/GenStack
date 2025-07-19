import React, { useState, useEffect } from "react";
import {
  PlusIcon,
  Github as GithubIcon,
  CheckCircle as CheckCircleIcon,
  AlertTriangle as ExclamationTriangleIcon,
} from "lucide-react";
import {
  enhancedGitHubProjectsService,
  GitHubAccountOption,
} from "../services/enhancedGitHubProjectsService";

interface ProjectFormData {
  name: string;
  description: string;
  enableGitHub: boolean;
  selectedGitHubAccountId?: string;
  githubConfig: {
    repositoryName: string;
    isPrivate: boolean;
    autoSync: boolean;
    createReadme: boolean;
    gitignoreTemplate?: string;
    license?: string;
  };
}

interface ProjectFormProps {
  onSubmit: (projectData: ProjectFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const ProjectForm: React.FC<ProjectFormProps> = ({
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [formData, setFormData] = useState<ProjectFormData>({
    name: "",
    description: "",
    enableGitHub: false,
    githubConfig: {
      repositoryName: "",
      isPrivate: false,
      autoSync: true,
      createReadme: true,
    },
  });

  const [githubAccounts, setGithubAccounts] = useState<GitHubAccountOption[]>(
    []
  );
  const [githubAccountsLoading, setGithubAccountsLoading] = useState(false);
  const [githubError, setGithubError] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] =
    useState<GitHubAccountOption | null>(null);

  // Load GitHub accounts when component mounts
  useEffect(() => {
    loadGithubAccounts();
  }, []);

  // Auto-generate repository name from project name
  useEffect(() => {
    if (formData.name && formData.enableGitHub) {
      const repoName = formData.name.toLowerCase().replace(/\s+/g, "-");
      setFormData((prev) => ({
        ...prev,
        githubConfig: {
          ...prev.githubConfig,
          repositoryName: repoName,
        },
      }));
    }
  }, [formData.name, formData.enableGitHub]);

  // Update selected account when GitHub account is selected
  useEffect(() => {
    if (formData.selectedGitHubAccountId) {
      const account = githubAccounts.find(
        (acc) => acc.id === formData.selectedGitHubAccountId
      );
      setSelectedAccount(account || null);
    } else {
      setSelectedAccount(null);
    }
  }, [formData.selectedGitHubAccountId, githubAccounts]);

  const loadGithubAccounts = async () => {
    try {
      setGithubAccountsLoading(true);
      setGithubError(null);
      const accounts =
        await enhancedGitHubProjectsService.getAvailableAccounts();
      setGithubAccounts(accounts);

      // Auto-select default account if available
      const defaultAccount = accounts.find(
        (acc: GitHubAccountOption) => acc.isDefault && acc.isActive
      );
      if (defaultAccount) {
        setFormData((prev) => ({
          ...prev,
          selectedGitHubAccountId: defaultAccount.id,
        }));
      }
    } catch (error: any) {
      setGithubError(error.message || "Failed to load GitHub accounts");
    } finally {
      setGithubAccountsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      alert("Project name is required");
      return;
    }

    if (formData.enableGitHub && !formData.selectedGitHubAccountId) {
      alert("Please select a GitHub account for repository creation");
      return;
    }

    if (formData.enableGitHub && !formData.githubConfig.repositoryName.trim()) {
      alert("Repository name is required for GitHub integration");
      return;
    }

    await onSubmit(formData);
  };

  const handleAccountChange = (accountId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedGitHubAccountId: accountId,
    }));
  };

  const availableAccounts = githubAccounts.filter((acc) => acc.isActive);
  const canCreateRepos = selectedAccount?.canCreateRepos ?? false;
  const canCreatePrivateRepos = selectedAccount?.canCreatePrivateRepos ?? false;

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Project Information */}
        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Project Details
          </h3>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Project Name *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="My Awesome Project"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Describe your project..."
                disabled={loading}
              />
            </div>
          </div>
        </div>

        {/* GitHub Integration */}
        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <GithubIcon className="w-5 h-5 mr-2" />
              GitHub Integration
            </h3>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="enableGitHub"
                checked={formData.enableGitHub}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    enableGitHub: e.target.checked,
                  }))
                }
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                disabled={loading || availableAccounts.length === 0}
              />
              <label
                htmlFor="enableGitHub"
                className="ml-2 text-sm text-gray-900"
              >
                Create GitHub repository
              </label>
            </div>
          </div>

          {/* GitHub Account Selection */}
          {formData.enableGitHub && (
            <div className="space-y-4">
              {githubAccountsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                  <span className="ml-2 text-sm text-gray-600">
                    Loading GitHub accounts...
                  </span>
                </div>
              ) : githubError ? (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{githubError}</p>
                      <button
                        type="button"
                        onClick={loadGithubAccounts}
                        className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                </div>
              ) : availableAccounts.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <div className="flex">
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        No GitHub accounts configured. Please add a GitHub
                        account first.
                      </p>
                      <button
                        type="button"
                        onClick={() => window.open("/github-config", "_blank")}
                        className="mt-2 inline-flex items-center text-sm text-yellow-600 hover:text-yellow-500 underline"
                      >
                        <PlusIcon className="w-4 h-4 mr-1" />
                        Add GitHub Account
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Account Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      GitHub Account *
                    </label>
                    <div className="space-y-2">
                      {availableAccounts.map((account) => (
                        <div key={account.id} className="relative">
                          <label className="flex items-center p-3 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50">
                            <input
                              type="radio"
                              name="githubAccount"
                              value={account.id}
                              checked={
                                formData.selectedGitHubAccountId === account.id
                              }
                              onChange={() => handleAccountChange(account.id)}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                              disabled={loading}
                            />
                            <div className="ml-3 flex-1">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  {account.avatarUrl && (
                                    <img
                                      src={account.avatarUrl}
                                      alt={account.username}
                                      className="w-6 h-6 rounded-full mr-2"
                                    />
                                  )}
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      {account.nickname}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      @{account.username}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  {account.isDefault && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      Default
                                    </span>
                                  )}
                                  {account.canCreateRepos && (
                                    <CheckCircleIcon className="w-4 h-4 text-green-500" />
                                  )}
                                </div>
                              </div>
                            </div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Repository Configuration */}
                  {selectedAccount && (
                    <div className="border-t border-gray-200 pt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">
                        Repository Settings
                      </h4>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Repository Name *
                          </label>
                          <input
                            type="text"
                            value={formData.githubConfig.repositoryName}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                githubConfig: {
                                  ...prev.githubConfig,
                                  repositoryName: e.target.value,
                                },
                              }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            placeholder="my-awesome-project"
                            required
                            disabled={loading}
                          />
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="isPrivate"
                              checked={formData.githubConfig.isPrivate}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  githubConfig: {
                                    ...prev.githubConfig,
                                    isPrivate: e.target.checked,
                                  },
                                }))
                              }
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                              disabled={loading || !canCreatePrivateRepos}
                            />
                            <label
                              htmlFor="isPrivate"
                              className="ml-2 text-sm text-gray-700"
                            >
                              Private repository
                              {!canCreatePrivateRepos && (
                                <span className="text-xs text-gray-500 ml-1">
                                  (requires upgrade)
                                </span>
                              )}
                            </label>
                          </div>

                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="createReadme"
                              checked={formData.githubConfig.createReadme}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  githubConfig: {
                                    ...prev.githubConfig,
                                    createReadme: e.target.checked,
                                  },
                                }))
                              }
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                              disabled={loading}
                            />
                            <label
                              htmlFor="createReadme"
                              className="ml-2 text-sm text-gray-700"
                            >
                              Initialize with README
                            </label>
                          </div>

                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="autoSync"
                              checked={formData.githubConfig.autoSync}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  githubConfig: {
                                    ...prev.githubConfig,
                                    autoSync: e.target.checked,
                                  },
                                }))
                              }
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                              disabled={loading}
                            />
                            <label
                              htmlFor="autoSync"
                              className="ml-2 text-sm text-gray-700"
                            >
                              Auto-sync project changes
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Permissions Warning */}
                      {!canCreateRepos && (
                        <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-md p-3">
                          <div className="flex">
                            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                            <div className="ml-3">
                              <p className="text-sm text-yellow-700">
                                Selected account doesn't have permission to
                                create repositories.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
            disabled={
              loading ||
              (formData.enableGitHub &&
                (!formData.selectedGitHubAccountId || !canCreateRepos))
            }
          >
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            )}
            {formData.enableGitHub
              ? "Create Project & Repository"
              : "Create Project"}
          </button>
        </div>
      </form>
    </div>
  );
};
