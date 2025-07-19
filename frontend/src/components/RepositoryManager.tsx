import React, { useState, useEffect } from "react";
import {
  CloudArrowUpIcon,
  CloudArrowDownIcon,
  CodeBracketIcon,
  DocumentDuplicateIcon,
  PlusIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";

interface FileChange {
  path: string;
  content: string;
  encoding?: "utf-8" | "base64";
  sha?: string;
}

interface BranchInfo {
  name: string;
  sha: string;
  protected: boolean;
  default: boolean;
}

interface SyncResult {
  success: boolean;
  filesChanged: number;
  errors: string[];
  commitSha?: string;
  commitUrl?: string;
}

interface RepositoryManagerProps {
  projectId: string;
  accountId: string;
  repoName: string;
  onSyncComplete?: (result: SyncResult) => void;
}

const API_BASE_URL = "/api";

export const RepositoryManager: React.FC<RepositoryManagerProps> = ({
  projectId,
  accountId,
  repoName,
  onSyncComplete,
}) => {
  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>("main");
  const [files, setFiles] = useState<FileChange[]>([]);
  const [newBranchName, setNewBranchName] = useState("");
  const [commitMessage, setCommitMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [showCreateBranch, setShowCreateBranch] = useState(false);

  useEffect(() => {
    if (accountId && repoName) {
      loadBranches();
    }
  }, [accountId, repoName]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  };

  const loadBranches = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/repository/branches/${repoName}?accountId=${accountId}`,
        {
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setBranches(data.data.branches);

        // Set default branch as selected
        const defaultBranch = data.data.branches.find(
          (b: BranchInfo) => b.default
        );
        if (defaultBranch) {
          setSelectedBranch(defaultBranch.name);
        }
      }
    } catch (error) {
      console.error("Error loading branches:", error);
    } finally {
      setLoading(false);
    }
  };

  const syncFiles = async () => {
    if (!commitMessage.trim()) {
      alert("Please enter a commit message");
      return;
    }

    if (files.length === 0) {
      alert("No files to sync");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/repository/sync`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          projectId,
          accountId,
          files,
          commitMessage,
          branch: selectedBranch,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSyncResult(data.data);
        setCommitMessage("");
        onSyncComplete?.(data.data);
      } else {
        alert(`Sync failed: ${data.message}`);
      }
    } catch (error: any) {
      console.error("Error syncing files:", error);
      alert(`Sync error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const pullFiles = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/repository/pull`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          projectId,
          accountId,
          branch: selectedBranch,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setFiles(data.data.files);
        alert(`Pulled ${data.data.files.length} files from ${selectedBranch}`);
      } else {
        alert(`Pull failed: ${data.message}`);
      }
    } catch (error: any) {
      console.error("Error pulling files:", error);
      alert(`Pull error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const createBranch = async () => {
    if (!newBranchName.trim()) {
      alert("Please enter a branch name");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/repository/branches`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          accountId,
          repoName,
          branchName: newBranchName,
          fromBranch: selectedBranch,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setNewBranchName("");
        setShowCreateBranch(false);
        loadBranches(); // Reload branches
        alert(`Branch "${newBranchName}" created successfully`);
      } else {
        alert(`Failed to create branch: ${data.message}`);
      }
    } catch (error: any) {
      console.error("Error creating branch:", error);
      alert(`Create branch error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const addFile = () => {
    const fileName = prompt("Enter file name:");
    if (fileName) {
      setFiles([...files, { path: fileName, content: "" }]);
    }
  };

  const updateFileContent = (index: number, content: string) => {
    const updatedFiles = [...files];
    updatedFiles[index].content = content;
    setFiles(updatedFiles);
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Repository Management - {repoName}
        </h3>

        {/* Branch Selection */}
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Branch
            </label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={loading}
            >
              {branches.map((branch) => (
                <option key={branch.name} value={branch.name}>
                  {branch.name} {branch.default && "(default)"}{" "}
                  {branch.protected && "(protected)"}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowCreateBranch(!showCreateBranch)}
            className="flex items-center px-3 py-2 text-sm text-indigo-600 hover:text-indigo-500"
            disabled={loading}
          >
            <PlusIcon className="w-4 h-4 mr-1" />
            New Branch
          </button>
        </div>

        {/* Create Branch Form */}
        {showCreateBranch && (
          <div className="bg-gray-50 p-4 rounded-md mb-4">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                placeholder="Branch name"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={loading}
              />
              <button
                onClick={createBranch}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
                disabled={loading || !newBranchName.trim()}
              >
                Create
              </button>
              <button
                onClick={() => setShowCreateBranch(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 mb-4">
          <button
            onClick={pullFiles}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
            disabled={loading}
          >
            <CloudArrowDownIcon className="w-4 h-4 mr-2" />
            Pull Files
          </button>

          <button
            onClick={addFile}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            disabled={loading}
          >
            <DocumentDuplicateIcon className="w-4 h-4 mr-2" />
            Add File
          </button>
        </div>
      </div>

      {/* Files List */}
      <div className="space-y-4 mb-6">
        <h4 className="text-md font-medium text-gray-900">
          Files ({files.length})
        </h4>

        {files.map((file, index) => (
          <div key={index} className="border border-gray-200 rounded-md p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm text-gray-900">
                {file.path}
              </span>
              <button
                onClick={() => removeFile(index)}
                className="text-red-600 hover:text-red-800 text-sm"
                disabled={loading}
              >
                Remove
              </button>
            </div>
            <textarea
              value={file.content}
              onChange={(e) => updateFileContent(index, e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
              placeholder="File content..."
              disabled={loading}
            />
          </div>
        ))}

        {files.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No files added. Pull files from repository or add new files.
          </div>
        )}
      </div>

      {/* Sync Section */}
      {files.length > 0 && (
        <div className="border-t pt-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Commit Message
            </label>
            <input
              type="text"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="Describe your changes..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          <button
            onClick={syncFiles}
            className="flex items-center px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
            disabled={loading || !commitMessage.trim() || files.length === 0}
          >
            <CloudArrowUpIcon className="w-4 h-4 mr-2" />
            {loading ? "Syncing..." : "Sync to GitHub"}
          </button>
        </div>
      )}

      {/* Sync Result */}
      {syncResult && (
        <div
          className={`mt-4 p-4 rounded-md ${
            syncResult.success
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          <h5
            className={`font-medium ${
              syncResult.success ? "text-green-800" : "text-red-800"
            }`}
          >
            {syncResult.success ? "Sync Successful!" : "Sync Failed"}
          </h5>

          {syncResult.success && (
            <div className="mt-2 text-sm text-green-700">
              <p>Files changed: {syncResult.filesChanged}</p>
              {syncResult.commitSha && (
                <p>
                  Commit SHA:{" "}
                  <code className="bg-green-100 px-1 rounded">
                    {syncResult.commitSha.substring(0, 8)}
                  </code>
                </p>
              )}
              {syncResult.commitUrl && (
                <a
                  href={syncResult.commitUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-600 hover:text-green-500 underline flex items-center mt-1"
                >
                  <EyeIcon className="w-4 h-4 mr-1" />
                  View on GitHub
                </a>
              )}
            </div>
          )}

          {syncResult.errors && syncResult.errors.length > 0 && (
            <div className="mt-2 text-sm text-red-700">
              <p>Errors:</p>
              <ul className="list-disc list-inside">
                {syncResult.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
