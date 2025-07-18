import React, { useState, useEffect, useRef, useCallback } from "react";
import { useWebSocket } from "../contexts/WebSocketContext";
import { useAuth } from "../contexts/AuthContext";
import { Users, Eye, MousePointer, Zap, Wifi, WifiOff } from "lucide-react";

interface ConnectedUser {
  userId: string;
  username: string;
  cursor: { x: number; y: number };
  selectedNode?: string;
  isTyping?: boolean;
}

interface EnhancedCollaborativeCanvasProps {
  projectId: string;
  nodes: any[];
  onNodeUpdate: (nodeId: string, updates: any) => void;
  onNodeCreate: (node: any) => void;
  onNodeDelete: (nodeId: string) => void;
  onNodeSelect: (nodeId: string | null) => void;
  selectedNodeId?: string | null;
  children: React.ReactNode;
}

const EnhancedCollaborativeCanvas: React.FC<
  EnhancedCollaborativeCanvasProps
> = ({
  projectId,
  nodes,
  onNodeUpdate,
  onNodeCreate,
  onNodeDelete,
  onNodeSelect,
  selectedNodeId,
  children,
}) => {
  const { socket } = useWebSocket();
  const { user } = useAuth();
  const canvasRef = useRef<HTMLDivElement>(null);

  const [collaborators, setCollaborators] = useState<ConnectedUser[]>([]);
  const [userCursors, setUserCursors] = useState<
    Map<string, { x: number; y: number }>
  >(new Map());
  const [connectionState, setConnectionState] = useState<
    "connected" | "disconnected" | "connecting"
  >("disconnected");

  // Join project room when component mounts
  useEffect(() => {
    if (socket && user && projectId) {
      setConnectionState("connecting");

      socket.emit("join_project", {
        projectId,
        userId: user.id,
        username: `${user.firstName} ${user.lastName}` || user.email,
      });

      // Handle connection state
      socket.on("connect", () => {
        setConnectionState("connected");
      });

      socket.on("disconnect", () => {
        setConnectionState("disconnected");
      });

      // Handle collaboration events
      socket.on(
        "user_joined",
        (data: {
          userId: string;
          username: string;
          cursor: { x: number; y: number };
          timestamp: Date;
        }) => {
          setCollaborators((prev) => {
            const updated = [...prev];
            const existingIndex = updated.findIndex(
              (u) => u.userId === data.userId
            );

            if (existingIndex >= 0) {
              updated[existingIndex] = {
                ...updated[existingIndex],
                username: data.username,
                cursor: data.cursor,
              };
            } else {
              updated.push({
                userId: data.userId,
                username: data.username,
                cursor: data.cursor,
              });
            }

            return updated;
          });
        }
      );

      socket.on("user_left", (data: { userId: string; timestamp: Date }) => {
        setCollaborators((prev) =>
          prev.filter((u) => u.userId !== data.userId)
        );
        setUserCursors((prev) => {
          const updated = new Map(prev);
          updated.delete(data.userId);
          return updated;
        });
      });

      socket.on(
        "collaborators_list",
        (data: { projectId: string; collaborators: ConnectedUser[] }) => {
          setCollaborators(data.collaborators);
          setConnectionState("connected");
        }
      );

      socket.on(
        "cursor_moved",
        (data: {
          userId: string;
          position: { x: number; y: number };
          timestamp: Date;
        }) => {
          setUserCursors((prev) => {
            const updated = new Map(prev);
            updated.set(data.userId, data.position);
            return updated;
          });
        }
      );

      socket.on(
        "node_created",
        (data: { node: any; userId: string; timestamp: Date }) => {
          if (data.userId !== user.id) {
            onNodeCreate(data.node);
          }
        }
      );

      socket.on(
        "node_updated",
        (data: {
          nodeId: string;
          updates: any;
          userId: string;
          timestamp: Date;
        }) => {
          if (data.userId !== user.id) {
            onNodeUpdate(data.nodeId, data.updates);
          }
        }
      );

      socket.on(
        "node_deleted",
        (data: { nodeId: string; userId: string; timestamp: Date }) => {
          if (data.userId !== user.id) {
            onNodeDelete(data.nodeId);
          }
        }
      );

      socket.on(
        "node_selected",
        (data: { userId: string; nodeId: string | null; timestamp: Date }) => {
          setCollaborators((prev) =>
            prev.map((u) =>
              u.userId === data.userId
                ? { ...u, selectedNode: data.nodeId || undefined }
                : u
            )
          );
        }
      );

      socket.on(
        "typing_start",
        (data: { userId: string; nodeId: string; timestamp: Date }) => {
          setCollaborators((prev) =>
            prev.map((u) =>
              u.userId === data.userId ? { ...u, isTyping: true } : u
            )
          );
        }
      );

      socket.on(
        "typing_stop",
        (data: { userId: string; nodeId: string; timestamp: Date }) => {
          setCollaborators((prev) =>
            prev.map((u) =>
              u.userId === data.userId ? { ...u, isTyping: false } : u
            )
          );
        }
      );

      return () => {
        socket.off("connect");
        socket.off("disconnect");
        socket.off("user_joined");
        socket.off("user_left");
        socket.off("collaborators_list");
        socket.off("cursor_moved");
        socket.off("node_created");
        socket.off("node_updated");
        socket.off("node_deleted");
        socket.off("node_selected");
        socket.off("typing_start");
        socket.off("typing_stop");

        socket.emit("leave_project", {
          projectId,
          userId: user.id,
        });
      };
    }
  }, [socket, user, projectId, onNodeCreate, onNodeUpdate, onNodeDelete]);

  // Handle mouse movement for cursor tracking
  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (socket && user && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const position = {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        };

        socket.emit("cursor_move", {
          projectId,
          position,
          userId: user.id,
        });
      }
    },
    [socket, user, projectId]
  );

  // Handle node operations
  const handleNodeUpdate = useCallback(
    (nodeId: string, updates: any) => {
      if (socket && user) {
        socket.emit("node_update", {
          projectId,
          nodeId,
          updates,
          userId: user.id,
        });
      }
      onNodeUpdate(nodeId, updates);
    },
    [socket, user, projectId, onNodeUpdate]
  );

  const handleNodeCreate = useCallback(
    (node: any) => {
      if (socket && user) {
        socket.emit("node_create", {
          projectId,
          node,
          userId: user.id,
        });
      }
      onNodeCreate(node);
    },
    [socket, user, projectId, onNodeCreate]
  );

  const handleNodeDelete = useCallback(
    (nodeId: string) => {
      if (socket && user) {
        socket.emit("node_delete", {
          projectId,
          nodeId,
          userId: user.id,
        });
      }
      onNodeDelete(nodeId);
    },
    [socket, user, projectId, onNodeDelete]
  );

  const handleNodeSelect = useCallback(
    (nodeId: string | null) => {
      if (socket && user) {
        socket.emit("node_select", {
          projectId,
          nodeId,
          userId: user.id,
        });
      }
      onNodeSelect(nodeId);
    },
    [socket, user, projectId, onNodeSelect]
  );

  // Connection status indicator
  const getConnectionStatus = () => {
    switch (connectionState) {
      case "connected":
        return {
          icon: <Wifi className="w-4 h-4 text-green-500" />,
          text: "Connected",
          color: "text-green-500",
        };
      case "connecting":
        return {
          icon: <Zap className="w-4 h-4 text-yellow-500 animate-pulse" />,
          text: "Connecting...",
          color: "text-yellow-500",
        };
      case "disconnected":
        return {
          icon: <WifiOff className="w-4 h-4 text-red-500" />,
          text: "Disconnected",
          color: "text-red-500",
        };
    }
  };

  const connectionStatus = getConnectionStatus();

  return (
    <div className="relative w-full h-full">
      {/* Collaboration Header */}
      <div className="absolute top-4 left-4 z-50 flex items-center space-x-4">
        {/* Connection Status */}
        <div
          className={`flex items-center space-x-2 px-3 py-1 bg-white rounded-full shadow-sm border ${connectionStatus.color}`}
        >
          {connectionStatus.icon}
          <span className="text-sm font-medium">{connectionStatus.text}</span>
        </div>

        {/* Collaborators List */}
        {collaborators.length > 0 && (
          <div className="flex items-center space-x-2 px-3 py-1 bg-white rounded-full shadow-sm border border-gray-200">
            <Users className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">
              {collaborators.length} collaborator
              {collaborators.length !== 1 ? "s" : ""}
            </span>
            <div className="flex -space-x-2">
              {collaborators.slice(0, 3).map((collaborator, index) => (
                <div
                  key={collaborator.userId}
                  className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center`}
                  style={{
                    backgroundColor: `hsl(${(index * 137.5) % 360}, 50%, 50%)`,
                  }}
                  title={collaborator.username}
                >
                  <span className="text-xs text-white font-medium">
                    {collaborator.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              ))}
              {collaborators.length > 3 && (
                <div className="w-6 h-6 bg-gray-400 rounded-full border-2 border-white flex items-center justify-center">
                  <span className="text-xs text-white font-medium">
                    +{collaborators.length - 3}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Collaboration Panel */}
      <div className="absolute top-4 right-4 z-50">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 min-w-64">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Active Collaborators
          </h3>

          {collaborators.length === 0 ? (
            <p className="text-sm text-gray-500">
              No other collaborators online
            </p>
          ) : (
            <div className="space-y-2">
              {collaborators.map((collaborator, index) => (
                <div
                  key={collaborator.userId}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{
                        backgroundColor: `hsl(${
                          (index * 137.5) % 360
                        }, 50%, 50%)`,
                      }}
                    ></div>
                    <span className="text-sm font-medium text-gray-700">
                      {collaborator.username}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {collaborator.isTyping && (
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-green-600">typing</span>
                      </div>
                    )}
                    {collaborator.selectedNode && (
                      <div className="flex items-center space-x-1">
                        <Eye className="w-3 h-3 text-blue-500" />
                        <span className="text-xs text-blue-600">editing</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Canvas Area */}
      <div
        ref={canvasRef}
        className="w-full h-full relative"
        onMouseMove={handleMouseMove}
      >
        {/* Render user cursors */}
        {Array.from(userCursors.entries()).map(([userId, position]) => {
          const collaborator = collaborators.find((c) => c.userId === userId);
          const collaboratorIndex = collaborators.findIndex(
            (c) => c.userId === userId
          );
          const cursorColor = `hsl(${
            (collaboratorIndex * 137.5) % 360
          }, 50%, 50%)`;

          return (
            <div
              key={userId}
              className="absolute pointer-events-none z-40"
              style={{
                left: position.x,
                top: position.y,
                transform: "translate(-2px, -2px)",
              }}
            >
              <div className="flex items-center space-x-1">
                <MousePointer
                  className="w-4 h-4"
                  style={{ color: cursorColor }}
                />
                <span
                  className="text-xs text-white px-2 py-1 rounded-md text-nowrap"
                  style={{ backgroundColor: cursorColor }}
                >
                  {collaborator?.username || userId}
                </span>
              </div>
            </div>
          );
        })}

        {/* Canvas Content */}
        <div className="w-full h-full">
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child, {
                onNodeUpdate: handleNodeUpdate,
                onNodeCreate: handleNodeCreate,
                onNodeDelete: handleNodeDelete,
                onNodeSelect: handleNodeSelect,
                selectedNodeId,
                collaborators,
              } as any);
            }
            return child;
          })}
        </div>
      </div>

      {/* Node Selection Indicators */}
      {nodes.map((node) => {
        const collaborator = collaborators.find(
          (c) => c.selectedNode === node.id
        );
        if (!collaborator) return null;

        const collaboratorIndex = collaborators.findIndex(
          (c) => c.userId === collaborator.userId
        );
        const selectionColor = `hsl(${
          (collaboratorIndex * 137.5) % 360
        }, 50%, 50%)`;

        return (
          <div
            key={`selection-${node.id}`}
            className="absolute pointer-events-none z-30"
            style={{
              left: node.position?.x || 0,
              top: node.position?.y || 0,
              width: node.width || 200,
              height: node.height || 100,
            }}
          >
            <div
              className="absolute inset-0 border-2 rounded-lg bg-opacity-10"
              style={{
                borderColor: selectionColor,
                backgroundColor: selectionColor,
              }}
            >
              <div
                className="absolute -top-6 left-0 text-white text-xs px-2 py-1 rounded-md"
                style={{ backgroundColor: selectionColor }}
              >
                {collaborator.username} is editing
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default EnhancedCollaborativeCanvas;
