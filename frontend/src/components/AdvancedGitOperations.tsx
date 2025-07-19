import React, { useState, useEffect } from "react";
import {
  CodeBracketIcon,
  CommandLineIcon,
  ShieldCheckIcon,
  RocketLaunchIcon,
  ArrowPathIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface AdvancedGitOperationsProps {
  accountId: string;
  repoName: string;
}

interface Branch {
  name: string;
  protected: boolean;
  lastCommit: {
    sha: string;
    message: string;
    author: string;
    date: string;
  };
  ahead: number;
  behind: number;
}

interface CommitInfo {
  sha: string;
  message: string;
  author: string;
  date: string;
  stats: {
    additions: number;
    deletions: number;
    files: number;
  };
}

interface PullRequestPreview {
  id: string;
  title: string;
  description: string;
  sourceBranch: string;
  targetBranch: string;
  conflicts: string[];
  changes: {
    files: number;
    additions: number;
    deletions: number;
  };
}

interface Release {
  tagName: string;
  title: string;
  description: string;
  targetBranch: string;
  prerelease: boolean;
  draft: boolean;
}

const API_BASE_URL = "/api";

export const AdvancedGitOperations: React.FC<AdvancedGitOperationsProps> = ({
  accountId,
  repoName,
}) => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [commits, setCommits] = useState<CommitInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "branches" | "commits" | "merge" | "releases"
  >("branches");

  // Branch management states
  const [newBranchName, setNewBranchName] = useState("");
  const [sourceBranch, setSourceBranch] = useState("main");
  const [protectionEnabled, setProtectionEnabled] = useState(false);

  // Merge management states
  const [mergeSource, setMergeSource] = useState("");
  const [mergeTarget, setMergeTarget] = useState("main");
  const [mergeStrategy, setMergeStrategy] = useState<
    "merge" | "squash" | "rebase"
  >("merge");
  const [prPreview, setPrPreview] = useState<PullRequestPreview | null>(null);

  // Release management states
  const [releaseData, setReleaseData] = useState<Release>({
    tagName: "",
    title: "",
    description: "",
    targetBranch: "main",
    prerelease: false,
    draft: true,
  });

  useEffect(() => {
    loadGitData();
  }, [accountId, repoName]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  };

  const loadGitData = async () => {
    try {
      setLoading(true);

      const [branchesResponse, commitsResponse] = await Promise.all([
        fetch(
          `${API_BASE_URL}/advanced-git/branches/${repoName}/details?accountId=${accountId}`,
          {
            headers: getAuthHeaders(),
          }
        ),
        fetch(
          `${API_BASE_URL}/advanced-git/commits/${repoName}?accountId=${accountId}&limit=20`,
          {
            headers: getAuthHeaders(),
          }
        ),
      ]);

      if (branchesResponse.ok) {
        const branchesData = await branchesResponse.json();
        setBranches(branchesData.data.branches);
      }

      if (commitsResponse.ok) {
        const commitsData = await commitsResponse.json();
        setCommits(commitsData.data.commits);
      }
    } catch (error) {
      console.error("Error loading Git data:", error);
    } finally {
      setLoading(false);
    }
  };

  const createBranch = async () => {
    if (!newBranchName.trim()) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/advanced-git/branches/create`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            accountId,
            repoName,
            branchName: newBranchName,
            sourceBranch,
            protected: protectionEnabled,
          }),
        }
      );

      if (response.ok) {
        setNewBranchName("");
        setProtectionEnabled(false);
        loadGitData();
      }
    } catch (error) {
      console.error("Error creating branch:", error);
    }
  };

  const previewPullRequest = async () => {
    if (!mergeSource || !mergeTarget) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/advanced-git/pull-request/preview`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            accountId,
            repoName,
            sourceBranch: mergeSource,
            targetBranch: mergeTarget,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPrPreview(data.data.preview);
      }
    } catch (error) {
      console.error("Error previewing PR:", error);
    }
  };

  const performMerge = async () => {
    if (!mergeSource || !mergeTarget) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/advanced-git/merge/advanced`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            accountId,
            repoName,
            sourceBranch: mergeSource,
            targetBranch: mergeTarget,
            strategy: mergeStrategy,
          }),
        }
      );

      if (response.ok) {
        setPrPreview(null);
        setMergeSource("");
        loadGitData();
      }
    } catch (error) {
      console.error("Error performing merge:", error);
    }
  };

  const createRelease = async () => {
    if (!releaseData.tagName || !releaseData.title) return;

    try {
      const response = await fetch(`${API_BASE_URL}/advanced-git/releases`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          accountId,
          repoName,
          ...releaseData,
        }),
      });

      if (response.ok) {
        setReleaseData({
          tagName: "",
          title: "",
          description: "",
          targetBranch: "main",
          prerelease: false,
          draft: true,
        });
      }
    } catch (error) {
      console.error("Error creating release:", error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getBranchStatus = (branch: Branch) => {
    if (branch.ahead > 0 && branch.behind > 0) {
      return {
        color: "text-yellow-600",
        text: `↑${branch.ahead} ↓${branch.behind}`,
      };
    } else if (branch.ahead > 0) {
      return { color: "text-green-600", text: `↑${branch.ahead} ahead` };
    } else if (branch.behind > 0) {
      return { color: "text-red-600", text: `↓${branch.behind} behind` };
    }
    return { color: "text-gray-600", text: "up to date" };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <CodeBracketIcon className="w-8 h-8 mr-3 text-indigo-600" />
            Advanced Git Operations
          </h2>
          <p className="text-gray-600 mt-1">
            {repoName} - Professional Git workflow management
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {["branches", "commits", "merge", "releases"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Branches Tab */}
      {activeTab === "branches" && (
        <div className="space-y-6">
          {/* Create Branch Form */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BranchIcon className="w-5 h-5 mr-2" />
              Create New Branch
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="Branch name"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <select
                value={sourceBranch}
                onChange={(e) => setSourceBranch(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {branches.map((branch) => (
                  <option key={branch.name} value={branch.name}>
                    {branch.name}
                  </option>
                ))}
              </select>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={protectionEnabled}
                  onChange={(e) => setProtectionEnabled(e.target.checked)}
                  className="mr-2"
                />
                Protected branch
              </label>
              <button
                onClick={createBranch}
                disabled={!newBranchName.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Branch
              </button>
            </div>
          </div>

          {/* Branches List */}
          <div className="bg-white rounded-lg shadow border">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Repository Branches
              </h3>
            </div>
            <div className="divide-y divide-gray-200">
              {branches.map((branch) => {
                const status = getBranchStatus(branch);
                return (
                  <div key={branch.name} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <BranchIcon className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <div className="flex items-center">
                            <h4 className="text-lg font-medium text-gray-900">
                              {branch.name}
                            </h4>
                            {branch.protected && (
                              <ShieldCheckIcon className="w-4 h-4 text-green-500 ml-2" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            Last commit:{" "}
                            {branch.lastCommit.message.slice(0, 60)}...
                          </p>
                          <p className="text-xs text-gray-500">
                            by {branch.lastCommit.author} on{" "}
                            {formatDate(branch.lastCommit.date)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${status.color}`}>
                          {status.text}
                        </p>
                        <p className="text-xs text-gray-500">
                          {branch.lastCommit.sha.slice(0, 8)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Commits Tab */}
      {activeTab === "commits" && (
        <div className="bg-white rounded-lg shadow border">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">
              Recent Commits
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {commits.map((commit) => (
              <div key={commit.sha} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-lg font-medium text-gray-900">
                      {commit.message}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      by {commit.author} on {formatDate(commit.date)}
                    </p>
                    <div className="flex items-center mt-2 text-xs text-gray-500 space-x-4">
                      <span>{commit.stats.files} files changed</span>
                      <span className="text-green-600">
                        +{commit.stats.additions}
                      </span>
                      <span className="text-red-600">
                        -{commit.stats.deletions}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {commit.sha.slice(0, 8)}
                    </code>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Merge Tab */}
      {activeTab === "merge" && (
        <div className="space-y-6">
          {/* Merge Configuration */}
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <ArrowPathIcon className="w-5 h-5 mr-2" />
              Advanced Merge Operations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <select
                value={mergeSource}
                onChange={(e) => setMergeSource(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select source branch</option>
                {branches.map((branch) => (
                  <option key={branch.name} value={branch.name}>
                    {branch.name}
                  </option>
                ))}
              </select>
              <select
                value={mergeTarget}
                onChange={(e) => setMergeTarget(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {branches.map((branch) => (
                  <option key={branch.name} value={branch.name}>
                    {branch.name}
                  </option>
                ))}
              </select>
              <select
                value={mergeStrategy}
                onChange={(e) => setMergeStrategy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="merge">Merge commit</option>
                <option value="squash">Squash and merge</option>
                <option value="rebase">Rebase and merge</option>
              </select>
              <button
                onClick={previewPullRequest}
                disabled={!mergeSource || !mergeTarget}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Preview Merge
              </button>
            </div>
          </div>

          {/* Pull Request Preview */}
          {prPreview && (
            <div className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Merge Preview
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {prPreview.sourceBranch} → {prPreview.targetBranch}
                    </p>
                    <p className="text-sm text-gray-600">
                      {prPreview.changes.files} files, +
                      {prPreview.changes.additions} -
                      {prPreview.changes.deletions}
                    </p>
                  </div>
                  {prPreview.conflicts.length === 0 ? (
                    <div className="flex items-center text-green-600">
                      <CheckIcon className="w-5 h-5 mr-2" />
                      No conflicts
                    </div>
                  ) : (
                    <div className="flex items-center text-red-600">
                      <XMarkIcon className="w-5 h-5 mr-2" />
                      {prPreview.conflicts.length} conflicts
                    </div>
                  )}
                </div>

                {prPreview.conflicts.length > 0 && (
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h4 className="font-medium text-red-800 mb-2">
                      Conflicts detected:
                    </h4>
                    <ul className="text-sm text-red-700 space-y-1">
                      {prPreview.conflicts.map((conflict, index) => (
                        <li key={index}>{conflict}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setPrPreview(null)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={performMerge}
                    disabled={prPreview.conflicts.length > 0}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    Perform Merge
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Releases Tab */}
      {activeTab === "releases" && (
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <RocketLaunchIcon className="w-5 h-5 mr-2" />
            Create Release
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Tag name (e.g., v1.0.0)"
                value={releaseData.tagName}
                onChange={(e) =>
                  setReleaseData({ ...releaseData, tagName: e.target.value })
                }
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="text"
                placeholder="Release title"
                value={releaseData.title}
                onChange={(e) =>
                  setReleaseData({ ...releaseData, title: e.target.value })
                }
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <textarea
              placeholder="Release description"
              value={releaseData.description}
              onChange={(e) =>
                setReleaseData({ ...releaseData, description: e.target.value })
              }
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select
                value={releaseData.targetBranch}
                onChange={(e) =>
                  setReleaseData({
                    ...releaseData,
                    targetBranch: e.target.value,
                  })
                }
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {branches.map((branch) => (
                  <option key={branch.name} value={branch.name}>
                    {branch.name}
                  </option>
                ))}
              </select>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={releaseData.prerelease}
                  onChange={(e) =>
                    setReleaseData({
                      ...releaseData,
                      prerelease: e.target.checked,
                    })
                  }
                  className="mr-2"
                />
                Pre-release
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={releaseData.draft}
                  onChange={(e) =>
                    setReleaseData({ ...releaseData, draft: e.target.checked })
                  }
                  className="mr-2"
                />
                Save as draft
              </label>
            </div>

            <div className="flex justify-end">
              <button
                onClick={createRelease}
                disabled={!releaseData.tagName || !releaseData.title}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                Create Release
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
