import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";

interface Collaborator {
  userId: string;
  username: string;
  socketId: string;
  cursor?: { x: number; y: number };
  activeNode?: string;
}

interface NodeUpdate {
  nodeId: string;
  position?: { x: number; y: number };
  properties?: any;
  userId: string;
  socketId: string;
  timestamp: Date;
}

interface ConnectionUpdate {
  connection: {
    from: string;
    to: string;
    fromPort?: string;
    toPort?: string;
  };
  action: "create" | "delete";
  userId: string;
  socketId: string;
  timestamp: Date;
}

interface CollaborativeContextType {
  // Connection state
  isConnected: boolean;
  socket: Socket | null;

  // Project collaboration
  currentProjectId: string | null;
  collaborators: Collaborator[];

  // Real-time updates
  nodeUpdates: NodeUpdate[];
  connectionUpdates: ConnectionUpdate[];

  // Methods
  joinProject: (projectId: string) => void;
  leaveProject: () => void;
  updateNodePosition: (
    nodeId: string,
    position: { x: number; y: number }
  ) => void;
  updateNodeProperties: (nodeId: string, properties: any) => void;
  updateNodeConnection: (connection: any, action: "create" | "delete") => void;
  updateCursorPosition: (position: { x: number; y: number }) => void;
  updateNodeSelection: (nodeId: string | null) => void;
  clearUpdates: () => void;
}

const CollaborativeContext = createContext<CollaborativeContextType | null>(
  null
);

export const useCollaborative = () => {
  const context = useContext(CollaborativeContext);
  if (!context) {
    throw new Error(
      "useCollaborative must be used within a CollaborativeProvider"
    );
  }
  return context;
};

interface CollaborativeProviderProps {
  children: React.ReactNode;
}

export const CollaborativeProvider: React.FC<CollaborativeProviderProps> = ({
  children,
}) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [nodeUpdates, setNodeUpdates] = useState<NodeUpdate[]>([]);
  const [connectionUpdates, setConnectionUpdates] = useState<
    ConnectionUpdate[]
  >([]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!user) return;

    const newSocket = io("http://localhost:5000/collaboration", {
      withCredentials: true,
    });

    newSocket.on("connect", () => {
      console.log("Collaborative WebSocket connected");
      setIsConnected(true);

      // Join with user info
      newSocket.emit("user_join", {
        userId: user.id,
        username: `${user.firstName} ${user.lastName}`.trim() || user.email,
        organizationId: user.organization || "default-org",
      });
    });

    newSocket.on("disconnect", () => {
      console.log("Collaborative WebSocket disconnected");
      setIsConnected(false);
    });

    // Listen for collaborative events
    newSocket.on(
      "user_joined",
      (data: { userId: string; username: string; socketId: string }) => {
        console.log("User joined project:", data);
        setCollaborators((prev) => {
          const existing = prev.find((c) => c.userId === data.userId);
          if (existing) return prev;
          return [...prev, data];
        });
      }
    );

    newSocket.on(
      "user_left",
      (data: { userId: string; username: string; socketId: string }) => {
        console.log("User left project:", data);
        setCollaborators((prev) =>
          prev.filter((c) => c.userId !== data.userId)
        );
      }
    );

    newSocket.on(
      "project_collaborators",
      (data: { projectId: string; collaborators: Collaborator[] }) => {
        console.log("Project collaborators:", data);
        setCollaborators(data.collaborators);
      }
    );

    // Real-time node updates
    newSocket.on("node_position_changed", (data: NodeUpdate) => {
      console.log("Node position changed:", data);
      setNodeUpdates((prev) => [data, ...prev].slice(0, 50)); // Keep last 50 updates
    });

    newSocket.on("node_properties_changed", (data: NodeUpdate) => {
      console.log("Node properties changed:", data);
      setNodeUpdates((prev) => [data, ...prev].slice(0, 50));
    });

    newSocket.on("node_connection_changed", (data: ConnectionUpdate) => {
      console.log("Node connection changed:", data);
      setConnectionUpdates((prev) => [data, ...prev].slice(0, 50));
    });

    newSocket.on(
      "cursor_position_changed",
      (data: {
        projectId: string;
        position: { x: number; y: number };
        userId: string;
        socketId: string;
        username: string;
      }) => {
        setCollaborators((prev) =>
          prev.map((c) =>
            c.userId === data.userId ? { ...c, cursor: data.position } : c
          )
        );
      }
    );

    newSocket.on(
      "node_selection_changed",
      (data: {
        projectId: string;
        nodeId: string | null;
        userId: string;
        socketId: string;
        username: string;
      }) => {
        setCollaborators((prev) =>
          prev.map((c) =>
            c.userId === data.userId
              ? { ...c, activeNode: data.nodeId || undefined }
              : c
          )
        );
      }
    );

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  const joinProject = useCallback(
    (projectId: string) => {
      if (socket && user) {
        console.log("Joining project:", projectId);
        setCurrentProjectId(projectId);

        socket.emit("user_join", {
          userId: user.id,
          username: `${user.firstName} ${user.lastName}`.trim() || user.email,
          organizationId: user.organization || "default-org",
          projectId: projectId,
        });
      }
    },
    [socket, user]
  );

  const leaveProject = useCallback(() => {
    if (currentProjectId) {
      console.log("Leaving project:", currentProjectId);
      setCurrentProjectId(null);
      setCollaborators([]);
      clearUpdates();
    }
  }, [currentProjectId]);

  const updateNodePosition = useCallback(
    (nodeId: string, position: { x: number; y: number }) => {
      if (socket && currentProjectId && user) {
        socket.emit("node_position_update", {
          projectId: currentProjectId,
          nodeId,
          position,
          userId: user.id,
        });
      }
    },
    [socket, currentProjectId, user]
  );

  const updateNodeProperties = useCallback(
    (nodeId: string, properties: any) => {
      if (socket && currentProjectId && user) {
        socket.emit("node_property_update", {
          projectId: currentProjectId,
          nodeId,
          properties,
          userId: user.id,
        });
      }
    },
    [socket, currentProjectId, user]
  );

  const updateNodeConnection = useCallback(
    (connection: any, action: "create" | "delete") => {
      if (socket && currentProjectId && user) {
        socket.emit("node_connection_update", {
          projectId: currentProjectId,
          connection,
          action,
          userId: user.id,
        });
      }
    },
    [socket, currentProjectId, user]
  );

  const updateCursorPosition = useCallback(
    (position: { x: number; y: number }) => {
      if (socket && currentProjectId && user) {
        socket.emit("cursor_position_update", {
          projectId: currentProjectId,
          position,
          userId: user.id,
        });
      }
    },
    [socket, currentProjectId, user]
  );

  const updateNodeSelection = useCallback(
    (nodeId: string | null) => {
      if (socket && currentProjectId && user) {
        socket.emit("node_selection_update", {
          projectId: currentProjectId,
          nodeId,
          userId: user.id,
        });
      }
    },
    [socket, currentProjectId, user]
  );

  const clearUpdates = useCallback(() => {
    setNodeUpdates([]);
    setConnectionUpdates([]);
  }, []);

  const value: CollaborativeContextType = {
    isConnected,
    socket,
    currentProjectId,
    collaborators,
    nodeUpdates,
    connectionUpdates,
    joinProject,
    leaveProject,
    updateNodePosition,
    updateNodeProperties,
    updateNodeConnection,
    updateCursorPosition,
    updateNodeSelection,
    clearUpdates,
  };

  return (
    <CollaborativeContext.Provider value={value}>
      {children}
    </CollaborativeContext.Provider>
  );
};
