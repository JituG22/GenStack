import React, { useState, useEffect } from "react";

interface ProjectVersion {
  id: string;
  version: string;
  name: string;
  description: string;
  createdBy: string;
  createdAt: string;
  isCurrent: boolean;
  changes: VersionChange[];
  nodeCount: number;
  connectionCount: number;
}

interface VersionChange {
  type: "create" | "update" | "delete";
  target: "node" | "connection" | "property";
  targetId: string;
  targetName: string;
  description: string;
}

interface ProjectVersionControlProps {
  projectId: string;
  currentVersion?: string;
  onVersionSelect?: (version: ProjectVersion) => void;
  onVersionCreate?: (name: string, description: string) => void;
  onVersionCompare?: (version1: string, version2: string) => void;
}

export const ProjectVersionControl: React.FC<ProjectVersionControlProps> = ({
  projectId,
  onVersionSelect,
  onVersionCreate,
  onVersionCompare,
}) => {
  const [versions, setVersions] = useState<ProjectVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newVersionName, setNewVersionName] = useState("");
  const [newVersionDescription, setNewVersionDescription] = useState("");
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);

  // Mock data for demonstration
  const mockVersions: ProjectVersion[] = [
    {
      id: "v1.0.0",
      version: "1.0.0",
      name: "Initial Release",
      description: "First version of the project with basic components",
      createdBy: "John Doe",
      createdAt: "2024-01-15T10:00:00Z",
      isCurrent: false,
      nodeCount: 8,
      connectionCount: 12,
      changes: [
        {
          type: "create",
          target: "node",
          targetId: "react-app",
          targetName: "React Application",
          description: "Added main React application component",
        },
        {
          type: "create",
          target: "node",
          targetId: "api-server",
          targetName: "API Server",
          description: "Added Node.js API server",
        },
      ],
    },
    {
      id: "v1.1.0",
      version: "1.1.0",
      name: "Database Integration",
      description: "Added MongoDB integration and user authentication",
      createdBy: "Jane Smith",
      createdAt: "2024-02-01T14:30:00Z",
      isCurrent: false,
      nodeCount: 12,
      connectionCount: 18,
      changes: [
        {
          type: "create",
          target: "node",
          targetId: "mongodb",
          targetName: "MongoDB Database",
          description: "Added MongoDB database node",
        },
        {
          type: "create",
          target: "node",
          targetId: "auth-service",
          targetName: "Authentication Service",
          description: "Added JWT authentication service",
        },
        {
          type: "update",
          target: "node",
          targetId: "api-server",
          targetName: "API Server",
          description: "Updated API server to include auth endpoints",
        },
      ],
    },
    {
      id: "v1.2.0",
      version: "1.2.0",
      name: "Real-time Features",
      description: "Added WebSocket support and real-time collaboration",
      createdBy: "John Doe",
      createdAt: "2024-02-15T09:15:00Z",
      isCurrent: true,
      nodeCount: 15,
      connectionCount: 24,
      changes: [
        {
          type: "create",
          target: "node",
          targetId: "websocket",
          targetName: "WebSocket Service",
          description: "Added WebSocket service for real-time features",
        },
        {
          type: "update",
          target: "node",
          targetId: "react-app",
          targetName: "React Application",
          description: "Updated React app with real-time components",
        },
        {
          type: "create",
          target: "connection",
          targetId: "ws-conn-1",
          targetName: "WebSocket Connection",
          description: "Connected React app to WebSocket service",
        },
      ],
    },
  ];

  useEffect(() => {
    fetchVersions();
  }, [projectId]);

  const fetchVersions = async () => {
    try {
      setLoading(true);
      setError(null);

      // In real implementation, fetch from API
      // const response = await api.get(`/projects/${projectId}/versions`);
      // setVersions(response.data);

      setVersions(mockVersions);
    } catch (err) {
      setError("Failed to load project versions");
      console.error("Version fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVersion = async () => {
    try {
      if (!newVersionName.trim()) return;

      const newVersion: ProjectVersion = {
        id: `v${Date.now()}`,
        version: newVersionName,
        name: newVersionName,
        description: newVersionDescription,
        createdBy: "Current User",
        createdAt: new Date().toISOString(),
        isCurrent: false,
        nodeCount: 15, // This would come from current project state
        connectionCount: 24,
        changes: [
          {
            type: "create",
            target: "node",
            targetId: "new-feature",
            targetName: "New Feature",
            description: "Added new feature in this version",
          },
        ],
      };

      setVersions((prev) => [...prev, newVersion]);
      onVersionCreate?.(newVersionName, newVersionDescription);

      setShowCreateForm(false);
      setNewVersionName("");
      setNewVersionDescription("");
    } catch (err) {
      setError("Failed to create version");
    }
  };

  const handleVersionSelect = (version: ProjectVersion) => {
    onVersionSelect?.(version);
  };

  const handleVersionCheckbox = (versionId: string, checked: boolean) => {
    if (checked) {
      setSelectedVersions((prev) => [...prev, versionId].slice(-2)); // Max 2 selections
    } else {
      setSelectedVersions((prev) => prev.filter((id) => id !== versionId));
    }
  };

  const handleCompareVersions = () => {
    if (selectedVersions.length === 2) {
      onVersionCompare?.(selectedVersions[0], selectedVersions[1]);
    }
  };

  const getChangeIcon = (type: string) => {
    switch (type) {
      case "create":
        return "➕";
      case "update":
        return "✏️";
      case "delete":
        return "🗑️";
      default:
        return "📝";
    }
  };

  const getChangeColor = (type: string) => {
    switch (type) {
      case "create":
        return "text-green-600 bg-green-50";
      case "update":
        return "text-blue-600 bg-blue-50";
      case "delete":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800 font-medium">Error loading versions</div>
          <div className="text-red-600 text-sm mt-1">{error}</div>
          <button
            onClick={fetchVersions}
            className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Version Control</h2>
          <p className="text-gray-600">
            Manage project versions and track changes over time
          </p>
        </div>

        <div className="flex gap-2">
          {selectedVersions.length === 2 && (
            <button
              onClick={handleCompareVersions}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              Compare Versions
            </button>
          )}
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Create Version
          </button>
        </div>
      </div>

      {/* Compare hint */}
      {selectedVersions.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-blue-800 text-sm">
            {selectedVersions.length === 1
              ? "Select one more version to compare"
              : `Comparing ${selectedVersions.length} versions`}
          </p>
        </div>
      )}

      {/* Versions List */}
      <div className="space-y-4">
        {versions.map((version) => (
          <div
            key={version.id}
            className={`bg-white rounded-lg border p-4 hover:shadow-md transition-shadow ${
              version.isCurrent
                ? "border-blue-300 bg-blue-50"
                : "border-gray-200"
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selectedVersions.includes(version.id)}
                  onChange={(e) =>
                    handleVersionCheckbox(version.id, e.target.checked)
                  }
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      v{version.version}
                    </h3>
                    {version.isCurrent && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700 font-medium">{version.name}</p>
                  <p className="text-gray-600 text-sm">{version.description}</p>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                    <span>By {version.createdBy}</span>
                    <span>
                      {new Date(version.createdAt).toLocaleDateString()}
                    </span>
                    <span>{version.nodeCount} nodes</span>
                    <span>{version.connectionCount} connections</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleVersionSelect(version)}
                className="px-3 py-1 text-blue-600 hover:text-blue-800 text-sm"
              >
                View Details
              </button>
            </div>

            {/* Changes */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">
                Changes ({version.changes.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {version.changes.slice(0, 6).map((change, index) => (
                  <div
                    key={index}
                    className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${getChangeColor(
                      change.type
                    )}`}
                  >
                    <span>{getChangeIcon(change.type)}</span>
                    <span className="truncate">{change.description}</span>
                  </div>
                ))}
                {version.changes.length > 6 && (
                  <div className="px-2 py-1 text-xs text-gray-500">
                    +{version.changes.length - 6} more changes
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {versions.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📚</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No versions yet
          </h3>
          <p className="text-gray-600 mb-4">
            Create your first version to start tracking changes
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Create Version
          </button>
        </div>
      )}

      {/* Create Version Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Create New Version
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Version Name *
                </label>
                <input
                  type="text"
                  value={newVersionName}
                  onChange={(e) => setNewVersionName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 1.3.0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newVersionDescription}
                  onChange={(e) => setNewVersionDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="What changed in this version?"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateVersion}
                disabled={!newVersionName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Create Version
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
