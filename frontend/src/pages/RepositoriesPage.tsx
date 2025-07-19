import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FolderIcon,
  StarIcon,
  EyeIcon,
  CodeBracketIcon,
  CalendarIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import gitHubAccountsService from "../services/gitHubAccountsService";

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  html_url: string;
  stargazers_count: number;
  watchers_count: number;
  language: string | null;
  updated_at: string;
  default_branch: string;
  size: number;
}

interface GitHubAccount {
  id: string;
  nickname: string;
  username: string;
  isDefault: boolean;
  isActive: boolean;
  validationStatus: string;
}

const API_BASE_URL = "/api";

export const RepositoriesPage: React.FC = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<GitHubAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccountId) {
      loadRepositories();
    }
  }, [selectedAccountId]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const accountsData = await gitHubAccountsService.getAccounts();
      const validAccounts = accountsData.filter(
        (acc) => acc.validationStatus === "valid"
      );
      setAccounts(validAccounts);

      // Auto-select default account
      const defaultAccount = validAccounts.find((acc) => acc.isDefault);
      if (defaultAccount) {
        setSelectedAccountId(defaultAccount.id);
      } else if (validAccounts.length > 0) {
        setSelectedAccountId(validAccounts[0].id);
      }
    } catch (error: any) {
      console.error("Error loading accounts:", error);
      setError(error.message || "Failed to load GitHub accounts");
    } finally {
      setLoading(false);
    }
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  };

  const loadRepositories = async () => {
    if (!selectedAccountId) return;

    try {
      setLoadingRepos(true);
      setError(null);

      const response = await fetch(
        `${API_BASE_URL}/github/${selectedAccountId}/repositories`,
        {
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setRepositories(data.data.repositories);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to load repositories");
      }
    } catch (error: any) {
      console.error("Error loading repositories:", error);
      setError(error.message || "Failed to load repositories");
    } finally {
      setLoadingRepos(false);
    }
  };

  const handleRepositoryClick = (repo: Repository) => {
    navigate(`/repositories/${selectedAccountId}/${repo.name}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 KB";
    const k = 1024;
    const sizes = ["KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <FolderIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No GitHub Accounts
            </h2>
            <p className="text-gray-600 mb-6">
              You need to configure at least one GitHub account to view
              repositories.
            </p>
            <button
              onClick={() => navigate("/github-config")}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Configure GitHub Accounts
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <FolderIcon className="w-8 h-8 mr-3 text-indigo-600" />
                Repositories
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.nickname} ({account.username})
                  </option>
                ))}
              </select>

              <button
                onClick={() => navigate("/github-config")}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Manage Accounts
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {loadingRepos ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading repositories...</p>
          </div>
        ) : repositories.length === 0 ? (
          <div className="text-center py-12">
            <FolderIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No Repositories Found
            </h2>
            <p className="text-gray-600">
              No repositories found for the selected GitHub account.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {repositories.map((repo) => (
              <div
                key={repo.id}
                onClick={() => handleRepositoryClick(repo)}
                className="bg-white rounded-lg shadow border hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center">
                      <CodeBracketIcon className="w-5 h-5 text-indigo-600 mr-2" />
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {repo.name}
                      </h3>
                    </div>
                    <div className="flex items-center space-x-1">
                      {repo.private ? (
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                          Private
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Public
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {repo.description || "No description available"}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <StarIcon className="w-4 h-4 mr-1" />
                        {repo.stargazers_count}
                      </div>
                      <div className="flex items-center">
                        <EyeIcon className="w-4 h-4 mr-1" />
                        {repo.watchers_count}
                      </div>
                    </div>
                    <div className="text-right">
                      <p>{formatSize(repo.size * 1024)}</p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center text-xs text-gray-500">
                      <CalendarIcon className="w-4 h-4 mr-1" />
                      {formatDate(repo.updated_at)}
                    </div>
                    <div className="flex items-center space-x-2">
                      {repo.language && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {repo.language}
                        </span>
                      )}
                      <a
                        href={repo.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
