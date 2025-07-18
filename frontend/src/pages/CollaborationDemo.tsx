import React, { useState } from "react";
import { EnhancedCollaborativeCanvas } from "../components";
import { useAuth } from "../contexts/AuthContext";
import { Users, Activity, Settings, Eye } from "lucide-react";

// Mock data for demonstration
const mockNodes = [
  {
    id: "1",
    name: "Start Node",
    type: "start",
    position: { x: 100, y: 100 },
    width: 200,
    height: 80,
    properties: { title: "Start Process" },
  },
  {
    id: "2",
    name: "Process Node",
    type: "process",
    position: { x: 400, y: 200 },
    width: 200,
    height: 80,
    properties: { title: "Process Data" },
  },
  {
    id: "3",
    name: "End Node",
    type: "end",
    position: { x: 700, y: 300 },
    width: 200,
    height: 80,
    properties: { title: "End Process" },
  },
];

const CollaborationDemo: React.FC = () => {
  const { user } = useAuth();
  const [nodes, setNodes] = useState(mockNodes);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [projectId] = useState("demo-project-123");

  const handleNodeUpdate = (nodeId: string, updates: any) => {
    setNodes((prev) =>
      prev.map((node) => (node.id === nodeId ? { ...node, ...updates } : node))
    );
  };

  const handleNodeCreate = (node: any) => {
    const newNode = {
      ...node,
      id: `node-${Date.now()}`,
      position: { x: Math.random() * 800, y: Math.random() * 600 },
    };
    setNodes((prev) => [...prev, newNode]);
  };

  const handleNodeDelete = (nodeId: string) => {
    setNodes((prev) => prev.filter((node) => node.id !== nodeId));
  };

  const handleNodeSelect = (nodeId: string | null) => {
    setSelectedNodeId(nodeId);
  };

  const addRandomNode = () => {
    const nodeTypes = ["process", "decision", "data", "connector"];
    const randomType = nodeTypes[Math.floor(Math.random() * nodeTypes.length)];

    const newNode = {
      id: `node-${Date.now()}`,
      name: `${randomType} Node`,
      type: randomType,
      position: {
        x: Math.random() * 600 + 50,
        y: Math.random() * 400 + 50,
      },
      width: 200,
      height: 80,
      properties: { title: `New ${randomType} Node` },
    };

    handleNodeCreate(newNode);
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Activity className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-semibold text-gray-900">
              Collaboration Demo
            </h1>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            <span>Project: {projectId}</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={addRandomNode}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Random Node
          </button>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Eye className="w-4 h-4" />
            <span>
              Welcome, {user?.firstName} {user?.lastName}
            </span>
          </div>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 relative">
        <EnhancedCollaborativeCanvas
          projectId={projectId}
          nodes={nodes}
          onNodeUpdate={handleNodeUpdate}
          onNodeCreate={handleNodeCreate}
          onNodeDelete={handleNodeDelete}
          onNodeSelect={handleNodeSelect}
          selectedNodeId={selectedNodeId}
        >
          {/* Canvas Content */}
          <div className="w-full h-full relative bg-white">
            {/* Grid Background */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
                `,
                backgroundSize: "20px 20px",
              }}
            />

            {/* Node Rendering */}
            {nodes.map((node) => (
              <div
                key={node.id}
                className={`absolute border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                  selectedNodeId === node.id
                    ? "border-blue-500 bg-blue-50 shadow-lg"
                    : "border-gray-300 bg-white shadow-sm hover:shadow-md"
                }`}
                style={{
                  left: node.position.x,
                  top: node.position.y,
                  width: node.width,
                  height: node.height,
                }}
                onClick={() => handleNodeSelect(node.id)}
              >
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-500 uppercase">
                      {node.type}
                    </span>
                    <div className="flex items-center space-x-1">
                      <Settings className="w-3 h-3 text-gray-400" />
                    </div>
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-900 text-center">
                      {node.properties.title || node.name}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Instructions */}
            <div className="absolute bottom-6 left-6 bg-white rounded-lg shadow-lg p-4 border border-gray-200 max-w-md">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Collaboration Features
              </h3>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Real-time cursor tracking</li>
                <li>• Live user presence indicators</li>
                <li>• Collaborative node editing</li>
                <li>• Node selection highlighting</li>
                <li>• Typing indicators</li>
              </ul>
            </div>

            {/* Node Inspector */}
            {selectedNodeId && (
              <div className="absolute top-6 right-6 bg-white rounded-lg shadow-lg p-4 border border-gray-200 min-w-64">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Node Inspector
                </h3>
                {(() => {
                  const selectedNode = nodes.find(
                    (n) => n.id === selectedNodeId
                  );
                  if (!selectedNode) return null;

                  return (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-gray-500">
                          Name
                        </label>
                        <input
                          type="text"
                          value={selectedNode.name}
                          onChange={(e) =>
                            handleNodeUpdate(selectedNodeId, {
                              name: e.target.value,
                            })
                          }
                          className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500">
                          Type
                        </label>
                        <select
                          value={selectedNode.type}
                          onChange={(e) =>
                            handleNodeUpdate(selectedNodeId, {
                              type: e.target.value,
                            })
                          }
                          className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value="start">Start</option>
                          <option value="process">Process</option>
                          <option value="decision">Decision</option>
                          <option value="data">Data</option>
                          <option value="end">End</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500">
                          Title
                        </label>
                        <input
                          type="text"
                          value={selectedNode.properties.title || ""}
                          onChange={(e) =>
                            handleNodeUpdate(selectedNodeId, {
                              properties: {
                                ...selectedNode.properties,
                                title: e.target.value,
                              },
                            })
                          }
                          className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <button
                        onClick={() => handleNodeDelete(selectedNodeId)}
                        className="w-full px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                      >
                        Delete Node
                      </button>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </EnhancedCollaborativeCanvas>
      </div>
    </div>
  );
};

export default CollaborationDemo;
