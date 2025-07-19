import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { RepositoryManager } from "../components/RepositoryManager";
import { GitHubActionsManager } from "../components/GitHubActionsManager";
import GitHubIntegrationStatus from "../components/GitHubIntegrationStatus";
import { enhancedGitHubProjectsService } from "../services/enhancedGitHubProjectsService";
import {
  CodeBracketIcon,
  CogIcon,
  DocumentTextIcon,
  RocketLaunchIcon,
} from "@heroicons/react/24/outline";

interface Project {
  id: string;
  name: string;
  description: string;
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

export const RepositoryManagementPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [githubAccounts, setGithubAccounts] = useState<GitHubAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"files" | "actions">("files");

  useEffect(() => {
    if (projectId) {
      loadProject();
      loadGitHubAccounts();
    }
  }, [projectId]);

  const loadProject = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/projects/${projectId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProject(data.data);

        // Auto-select the project's GitHub account if available
        if (data.data.github?.accountId) {
          setSelectedAccountId(data.data.github.accountId);
        }
      } else {
        setError("Failed to load project");
      }
    } catch (error) {
      console.error("Error loading project:", error);
      setError("Failed to load project");
    }
  };

  const loadGitHubAccounts = async () => {
    try {
      const accounts =
        await enhancedGitHubProjectsService.getAvailableAccounts();
      setGithubAccounts(accounts);

      // Auto-select default account if no account is selected
      if (!selectedAccountId) {
        const defaultAccount = accounts.find(
          (acc) => acc.isDefault && acc.isActive
        );
        if (defaultAccount) {
          setSelectedAccountId(defaultAccount.id);
        }
      }
    } catch (error) {
      console.error("Error loading GitHub accounts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncComplete = (result: any) => {
    console.log("Sync completed:", result);
    // Refresh project data
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

  if (!project.github?.enabled) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <CogIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h2 className="mt-4 text-lg font-medium text-gray-900">
              GitHub Integration Not Enabled
            </h2>
            <p className="mt-2 text-gray-600">
              This project doesn't have GitHub integration enabled.
            </p>
            <div className="mt-6">
              <button
                onClick={() => navigate(`/projects/${projectId}/edit`)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 mr-4"
              >
                Enable GitHub Integration
              </button>
              <button
                onClick={() => navigate("/projects")}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Back to Projects
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const selectedAccount = githubAccounts.find(
    (acc) => acc.id === selectedAccountId
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <CodeBracketIcon className="w-8 h-8 mr-3 text-indigo-600" />
                Repository Management
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage files and branches for "{project.name}"
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
                    Repository
                  </label>
                  <p className="text-sm text-gray-900">
                    {project.github?.repoName}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Sync Status
                  </label>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      project.github?.syncStatus === "synced"
                        ? "bg-green-100 text-green-800"
                        : project.github?.syncStatus === "error"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {project.github?.syncStatus || "pending"}
                  </span>
                </div>

                {project.github?.repoUrl && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Repository URL
                    </label>
                    <a
                      href={project.github.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-indigo-600 hover:text-indigo-500 block truncate"
                    >
                      {project.github.repoUrl}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* GitHub Account Selection */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                GitHub Account
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Account
                  </label>
                  <select
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                {/* Tabs */}
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8 px-6">
                    <button
                      onClick={() => setActiveTab("files")}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === "files"
                          ? "border-indigo-500 text-indigo-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <DocumentTextIcon className="w-5 h-5 inline mr-2" />
                      Files & Repository
                    </button>
                    <button
                      onClick={() => setActiveTab("actions")}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === "actions"
                          ? "border-indigo-500 text-indigo-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <RocketLaunchIcon className="w-5 h-5 inline mr-2" />
                      GitHub Actions
                    </button>
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
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select GitHub Account
                </h3>
                <p className="text-gray-600">
                  Please select a GitHub account to start managing repository
                  files.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
