import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { RepositoryManager } from "../components/RepositoryManager";
import { GitHubActionsManager } from "../components/GitHubActionsManager";
import { AdvancedGitOperations } from "../components/AdvancedGitOperations";
import { RepositoryAnalyticsDashboard } from "../components/RepositoryAnalyticsDashboard";
import GitHubIntegrationStatus from "../components/GitHubIntegrationStatus";
import {
  CodeBracketIcon,
  DocumentTextIcon,
  RocketLaunchIcon,
  ChartBarIcon,
  CommandLineIcon,
} from "@heroicons/react/24/outline";

interface Project {
  id: string;
  name: string;
  description?: string;
  github?: {
    enabled: boolean;
    repoName?: string;
    repoUrl?: string;
    syncStatus?: string;
    accountId?: string;
  };
}

interface GitHubAccount {
  id: string;
  nickname: string;
  username: string;
  isDefault: boolean;
  isActive: boolean;
}

export const EnhancedRepositoryManagementPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [githubAccounts, setGithubAccounts] = useState<GitHubAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "files" | "actions" | "git" | "analytics"
  >("files");

  useEffect(() => {
    if (projectId) {
      loadProject();
      loadGitHubAccounts();
    }
  }, [projectId]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  };

  const loadProject = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${projectId}`, {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        setProject(data.data);

        // Auto-select account if project has GitHub integration
        if (data.data.github?.accountId) {
          setSelectedAccountId(data.data.github.accountId);
        }
      } else {
        setError("Failed to load project");
      }
    } catch (error) {
      console.error("Error loading project:", error);
      setError("Error loading project");
    } finally {
      setLoading(false);
    }
  };

  const loadGitHubAccounts = async () => {
    try {
      const response = await fetch("/api/github-accounts", {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const result = await response.json();
        const data = result.data || [];
        setGithubAccounts(data);

        // Auto-select default account if none selected
        if (!selectedAccountId && data.length > 0) {
          const defaultAccount =
            data.find((acc: GitHubAccount) => acc.isDefault) || data[0];
          setSelectedAccountId(defaultAccount.id);
        }
      }
    } catch (error) {
      console.error("Error loading GitHub accounts:", error);
    }
  };

  const handleSyncComplete = () => {
    // Reload project data after sync
    loadProject();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error</h2>
          <p className="text-gray-600 mb-4">{error || "Project not found"}</p>
          <button
            onClick={() => navigate("/projects")}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  const selectedAccount = githubAccounts.find(
    (acc) => acc.id === selectedAccountId
  );

  const tabs = [
    {
      id: "files",
      name: "Files & Repository",
      icon: DocumentTextIcon,
      description: "File sync, branch management, and repository operations",
    },
    {
      id: "actions",
      name: "GitHub Actions",
      icon: RocketLaunchIcon,
      description: "CI/CD workflows and automation",
    },
    {
      id: "git",
      name: "Advanced Git",
      icon: CommandLineIcon,
      description: "Advanced Git operations, pull requests, and merging",
    },
    {
      id: "analytics",
      name: "Analytics",
      icon: ChartBarIcon,
      description: "Repository metrics, performance, and insights",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <CodeBracketIcon className="w-8 h-8 mr-3 text-indigo-600" />
                Enhanced Repository Management
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Advanced repository management for "{project.name}"
              </p>
            </div>
            <button
              onClick={() => navigate("/projects")}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Back to Projects
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Project Info
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Name
                  </label>
                  <p className="text-sm text-gray-900">{project.name}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Description
                  </label>
                  <p className="text-sm text-gray-900">
                    {project.description || "No description"}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Repository
                  </label>
                  <p className="text-sm text-gray-900">
                    {project.github?.repoName || "Not configured"}
                  </p>
                </div>
              </div>
            </div>

            {/* GitHub Account Selection */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                GitHub Account
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Select Account
                  </label>
                  <select
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="">Select account...</option>
                    {githubAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.nickname} (@{account.username})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedAccount && (
                  <div className="text-sm text-gray-600">
                    <p>
                      Using:{" "}
                      <span className="font-medium">
                        {selectedAccount.nickname}
                      </span>
                    </p>
                    <p>GitHub: @{selectedAccount.username}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Integration Status */}
            <GitHubIntegrationStatus />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {selectedAccountId && project.github?.repoName ? (
              <div className="bg-white rounded-lg shadow">
                {/* Enhanced Tabs */}
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8 px-6">
                    {tabs.map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id as any)}
                          className={`group py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                            activeTab === tab.id
                              ? "border-indigo-500 text-indigo-600"
                              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-center">
                            <Icon className="w-5 h-5 mr-2" />
                            {tab.name}
                          </div>
                          <p
                            className={`text-xs mt-1 ${
                              activeTab === tab.id
                                ? "text-indigo-500"
                                : "text-gray-400"
                            }`}
                          >
                            {tab.description}
                          </p>
                        </button>
                      );
                    })}
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {activeTab === "files" && (
                    <RepositoryManager
                      projectId={project.id}
                      accountId={selectedAccountId}
                      repoName={project.github.repoName}
                      onSyncComplete={handleSyncComplete}
                    />
                  )}

                  {activeTab === "actions" && (
                    <GitHubActionsManager
                      accountId={selectedAccountId}
                      repoName={project.github.repoName}
                    />
                  )}

                  {activeTab === "git" && (
                    <AdvancedGitOperations
                      accountId={selectedAccountId}
                      repoName={project.github.repoName}
                    />
                  )}

                  {activeTab === "analytics" && (
                    <RepositoryAnalyticsDashboard
                      accountId={selectedAccountId}
                      repoName={project.github.repoName}
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select GitHub Account
                </h3>
                <p className="text-gray-600 mb-4">
                  Please select a GitHub account to start using advanced
                  repository management features.
                </p>
                {!project.github?.repoName && (
                  <p className="text-sm text-orange-600">
                    Note: This project doesn't have a GitHub repository
                    configured.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
