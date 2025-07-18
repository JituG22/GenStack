import React, { useState, useEffect, useRef, useCallback } from "react";
import { useCollaborative } from "../contexts/CollaborativeContext";
import { useWebSocket } from "../contexts/WebSocketContext";
import { useAuth } from "../contexts/AuthContext";
import { Users, Eye, MousePointer, Zap, Wifi, WifiOff } from "lucide-react";

interface CollaborativeCanvasProps {
  projectId: string;
  nodes: Array<{
    id: string;
    name: string;
    type: string;
    position: { x: number; y: number };
    properties?: any;
  }>;
  onNodeMove?: (nodeId: string, position: { x: number; y: number }) => void;
  onNodeSelect?: (nodeId: string | null) => void;
  onNodeUpdate?: (nodeId: string, updates: any) => void;
  onNodeCreate?: (node: any) => void;
  onNodeDelete?: (nodeId: string) => void;
}

export const CollaborativeCanvas: React.FC<CollaborativeCanvasProps> = ({
  projectId,
  nodes,
  onNodeMove,
  onNodeSelect,
  onNodeUpdate,
  onNodeCreate,
  onNodeDelete,
}) => {
  const {
    isConnected,
    collaborators,
    joinProject,
    leaveProject,
    updateNodePosition,
    updateCursorPosition,
    updateNodeSelection,
    nodeUpdates,
    clearUpdates,
  } = useCollaborative();

  const { socket } = useWebSocket();
  const { user } = useAuth();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [userCursors, setUserCursors] = useState<
    Map<string, { x: number; y: number }>
  >(new Map());
  const [connectionState, setConnectionState] = useState<
    "connected" | "disconnected" | "connecting"
  >("disconnected");

  // Join project on mount
  useEffect(() => {
    if (projectId && isConnected) {
      joinProject(projectId);
    }

    return () => {
      leaveProject();
    };
  }, [projectId, isConnected, joinProject, leaveProject]);

  // Handle mouse movement for cursor tracking
  const handleMouseMove = (e: React.MouseEvent) => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const position = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      updateCursorPosition(position);
    }
  };

  // Handle node drag start
  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    setDraggedNode(nodeId);
    setSelectedNode(nodeId);
    updateNodeSelection(nodeId);
    onNodeSelect?.(nodeId);

    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  // Handle node drag
  const handleMouseMoveForDrag = (e: React.MouseEvent) => {
    handleMouseMove(e);

    if (draggedNode && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const newPosition = {
        x: e.clientX - rect.left - dragOffset.x,
        y: e.clientY - rect.top - dragOffset.y,
      };

      // Update local position immediately for responsiveness
      onNodeMove?.(draggedNode, newPosition);

      // Broadcast to other users
      updateNodePosition(draggedNode, newPosition);
    }
  };

  // Handle drag end
  const handleMouseUp = () => {
    setDraggedNode(null);
  };

  // Handle canvas click (deselect)
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      setSelectedNode(null);
      updateNodeSelection(null);
      onNodeSelect?.(null);
    }
  };

  // Get node color based on type
  const getNodeColor = (type: string) => {
    const colors = {
      react: "bg-blue-500",
      nodejs: "bg-green-500",
      mongodb: "bg-gray-700",
      api: "bg-purple-500",
      default: "bg-gray-400",
    };
    return colors[type as keyof typeof colors] || colors.default;
  };

  // Get user color for collaborator indicators
  const getUserColor = (userId: string) => {
    const colors = [
      "bg-red-500",
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-orange-500",
    ];
    const index = userId
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  return (
    <div className="relative w-full h-full bg-gray-50 overflow-hidden">
      {/* Connection Status */}
      <div className="absolute top-4 left-4 z-20">
        <div
          className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2 ${
            isConnected
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? "bg-green-500" : "bg-red-500"
            }`}
          ></div>
          {isConnected ? "Connected" : "Disconnected"}
        </div>
      </div>

      {/* Collaborators Panel */}
      <div className="absolute top-4 right-4 z-20">
        <div className="bg-white rounded-lg shadow-lg p-3">
          <h3 className="text-sm font-medium text-gray-900 mb-2">
            Collaborators ({collaborators.length})
          </h3>
          <div className="space-y-2">
            {collaborators.map((collaborator) => (
              <div
                key={collaborator.userId}
                className="flex items-center gap-2 text-xs"
              >
                <div
                  className={`w-3 h-3 rounded-full ${getUserColor(
                    collaborator.userId
                  )}`}
                ></div>
                <span className="text-gray-700">{collaborator.username}</span>
                {collaborator.activeNode && (
                  <span className="text-gray-500">editing node</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Updates Panel */}
      {nodeUpdates.length > 0 && (
        <div className="absolute bottom-4 left-4 z-20">
          <div className="bg-white rounded-lg shadow-lg p-3 max-w-xs">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-gray-900">
                Recent Updates
              </h3>
              <button
                onClick={clearUpdates}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {nodeUpdates.slice(0, 5).map((update, index) => (
                <div key={index} className="text-xs text-gray-600">
                  <span className="font-medium">Node {update.nodeId}</span>{" "}
                  updated
                  {update.position && " (moved)"}
                  {update.properties && " (edited)"}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="w-full h-full cursor-crosshair"
        onMouseMove={handleMouseMoveForDrag}
        onMouseUp={handleMouseUp}
        onClick={handleCanvasClick}
        onMouseLeave={() => setDraggedNode(null)}
      >
        {/* Collaborator Cursors */}
        {collaborators.map(
          (collaborator) =>
            collaborator.cursor && (
              <div
                key={collaborator.userId}
                className="absolute pointer-events-none z-10"
                style={{
                  left: collaborator.cursor.x,
                  top: collaborator.cursor.y,
                  transform: "translate(-2px, -2px)",
                }}
              >
                <div
                  className={`w-4 h-4 rounded-full ${getUserColor(
                    collaborator.userId
                  )} opacity-80`}
                ></div>
                <div className="bg-black text-white text-xs px-1 py-0.5 rounded mt-1 whitespace-nowrap">
                  {collaborator.username}
                </div>
              </div>
            )
        )}

        {/* Nodes */}
        {nodes.map((node) => {
          const isSelected = selectedNode === node.id;
          const isBeingEditedByOther = collaborators.some(
            (c) => c.activeNode === node.id
          );
          const editorUser = collaborators.find(
            (c) => c.activeNode === node.id
          );

          return (
            <div
              key={node.id}
              className={`absolute cursor-move transition-all duration-200 ${
                isSelected ? "ring-2 ring-blue-500 ring-offset-2" : ""
              } ${
                isBeingEditedByOther ? "ring-2 ring-red-400 ring-offset-1" : ""
              }`}
              style={{
                left: node.position.x,
                top: node.position.y,
                transform: draggedNode === node.id ? "scale(1.05)" : "scale(1)",
              }}
              onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
            >
              <div
                className={`
                px-4 py-3 rounded-lg shadow-lg border-2 border-white
                ${getNodeColor(node.type)} text-white font-medium
                min-w-24 text-center text-sm
                ${draggedNode === node.id ? "shadow-xl" : ""}
              `}
              >
                <div>{node.name}</div>
                <div className="text-xs opacity-75 mt-1">{node.type}</div>

                {/* Collaborator indicator */}
                {isBeingEditedByOther && editorUser && (
                  <div className="absolute -top-2 -right-2">
                    <div
                      className={`w-4 h-4 rounded-full ${getUserColor(
                        editorUser.userId
                      )} border-2 border-white`}
                    ></div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
            `,
            backgroundSize: "20px 20px",
          }}
        />
      </div>
    </div>
  );
};
