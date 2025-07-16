import React, { useState } from "react";
import { CollaborativeCanvas } from "../components/CollaborativeCanvas";
import { useCollaborative } from "../contexts/CollaborativeContext";

interface TestNode {
  id: string;
  name: string;
  type: string;
  position: { x: number; y: number };
  properties?: any;
}

export const CollaborativeTestPage: React.FC = () => {
  const { isConnected, collaborators, nodeUpdates } = useCollaborative();
  const [projectId] = useState("test-project-123");
  const [nodes, setNodes] = useState<TestNode[]>([
    {
      id: "node-1",
      name: "React App",
      type: "react",
      position: { x: 100, y: 100 },
    },
    {
      id: "node-2",
      name: "Node.js API",
      type: "nodejs",
      position: { x: 300, y: 150 },
    },
    {
      id: "node-3",
      name: "MongoDB",
      type: "mongodb",
      position: { x: 500, y: 200 },
    },
    {
      id: "node-4",
      name: "Auth Service",
      type: "api",
      position: { x: 200, y: 300 },
    },
  ]);

  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const handleNodeMove = (
    nodeId: string,
    position: { x: number; y: number }
  ) => {
    setNodes((prev) =>
      prev.map((node) => (node.id === nodeId ? { ...node, position } : node))
    );
  };

  const handleNodeSelect = (nodeId: string | null) => {
    setSelectedNode(nodeId);
  };

  const addRandomNode = () => {
    const newNode: TestNode = {
      id: `node-${Date.now()}`,
      name: `New Node ${Math.floor(Math.random() * 100)}`,
      type: ["react", "nodejs", "mongodb", "api"][
        Math.floor(Math.random() * 4)
      ],
      position: {
        x: Math.random() * 600 + 50,
        y: Math.random() * 400 + 50,
      },
    };
    setNodes((prev) => [...prev, newNode]);
  };

  const removeSelectedNode = () => {
    if (selectedNode) {
      setNodes((prev) => prev.filter((node) => node.id !== selectedNode));
      setSelectedNode(null);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Collaborative Canvas Test
            </h1>
            <p className="text-gray-600">
              Project: {projectId} •{" "}
              {isConnected ? "Connected" : "Disconnected"}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={addRandomNode}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Add Node
            </button>
            <button
              onClick={removeSelectedNode}
              disabled={!selectedNode}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Remove Selected
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex">
        {/* Canvas */}
        <div className="flex-1">
          <CollaborativeCanvas
            projectId={projectId}
            nodes={nodes}
            onNodeMove={handleNodeMove}
            onNodeSelect={handleNodeSelect}
          />
        </div>

        {/* Side Panel */}
        <div className="w-80 bg-white border-l p-4 overflow-y-auto">
          {/* Connection Status */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Connection Status
            </h3>
            <div
              className={`p-3 rounded-lg ${
                isConnected
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isConnected ? "bg-green-500" : "bg-red-500"
                  }`}
                ></div>
                <span
                  className={`font-medium ${
                    isConnected ? "text-green-800" : "text-red-800"
                  }`}
                >
                  {isConnected ? "Connected" : "Disconnected"}
                </span>
              </div>
            </div>
          </div>

          {/* Collaborators */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Collaborators ({collaborators.length})
            </h3>
            <div className="space-y-2">
              {collaborators.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  No other collaborators online
                </p>
              ) : (
                collaborators.map((collaborator) => (
                  <div
                    key={collaborator.userId}
                    className="p-3 bg-gray-50 rounded-lg border"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="font-medium text-gray-900">
                        {collaborator.username}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600">
                      {collaborator.activeNode && (
                        <span>Editing node: {collaborator.activeNode}</span>
                      )}
                      {collaborator.cursor && (
                        <span>
                          Cursor: ({Math.round(collaborator.cursor.x)},{" "}
                          {Math.round(collaborator.cursor.y)})
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Selected Node */}
          {selectedNode && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Selected Node
              </h3>
              {(() => {
                const node = nodes.find((n) => n.id === selectedNode);
                return node ? (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="font-medium text-blue-900">{node.name}</div>
                    <div className="text-sm text-blue-700">
                      Type: {node.type}
                    </div>
                    <div className="text-sm text-blue-700">
                      Position: ({Math.round(node.position.x)},{" "}
                      {Math.round(node.position.y)})
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          )}

          {/* Recent Updates */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Recent Updates ({nodeUpdates.length})
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {nodeUpdates.length === 0 ? (
                <p className="text-gray-500 text-sm">No recent updates</p>
              ) : (
                nodeUpdates.slice(0, 10).map((update, index) => (
                  <div
                    key={index}
                    className="p-2 bg-yellow-50 border border-yellow-200 rounded text-sm"
                  >
                    <div className="font-medium text-yellow-900">
                      Node {update.nodeId}
                    </div>
                    <div className="text-yellow-700">
                      {update.position && "Position updated"}
                      {update.properties && "Properties updated"}
                    </div>
                    <div className="text-xs text-yellow-600">
                      {new Date(update.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Nodes List */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nodes ({nodes.length})
            </h3>
            <div className="space-y-2">
              {nodes.map((node) => (
                <div
                  key={node.id}
                  className={`p-2 border rounded cursor-pointer transition-colors ${
                    selectedNode === node.id
                      ? "bg-blue-100 border-blue-300"
                      : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                  }`}
                  onClick={() => setSelectedNode(node.id)}
                >
                  <div className="font-medium text-gray-900">{node.name}</div>
                  <div className="text-sm text-gray-600">{node.type}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
