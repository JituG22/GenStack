import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";

interface CollaborationContextType {
  socket: Socket | null;
  isConnected: boolean;
  activeSessions: CollaborativeSession[];
  joinSession: (
    projectId: string,
    fileName: string,
    fileContent?: string
  ) => void;
  leaveSession: (sessionId?: string) => void;
  getSessionStats: () => Promise<CollaborationStats>;
  connectionError: string | null;
}

interface CollaborativeSession {
  id: string;
  projectId: string;
  fileName: string;
  participantCount: number;
  createdAt: Date;
  lastActivity: Date;
}

interface CollaborationStats {
  totalSessions: number;
  totalParticipants: number;
  activeProjects: number;
  averageParticipantsPerSession: number;
}

const CollaborationContext = createContext<
  CollaborationContextType | undefined
>(undefined);

interface CollaborationProviderProps {
  children: ReactNode;
}

export const CollaborationProvider: React.FC<CollaborationProviderProps> = ({
  children,
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [activeSessions, setActiveSessions] = useState<CollaborativeSession[]>(
    []
  );
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setConnectionError("Authentication token not found");
      return;
    }

    // Initialize socket connection
    const newSocket = io("http://localhost:5000", {
      auth: { token },
      transports: ["websocket"],
      autoConnect: true,
    });

    setSocket(newSocket);

    // Connection event handlers
    newSocket.on("connect", () => {
      setIsConnected(true);
      setConnectionError(null);
      console.log("Connected to collaboration server");
      fetchActiveSessions();
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
      console.log("Disconnected from collaboration server");
    });

    newSocket.on("connect_error", (error) => {
      setConnectionError(`Connection error: ${error.message}`);
      console.error("Socket connection error:", error);
    });

    // Global collaboration events
    newSocket.on("session-created", (session: CollaborativeSession) => {
      setActiveSessions((prev) => [...prev, session]);
    });

    newSocket.on("session-ended", (sessionId: string) => {
      setActiveSessions((prev) => prev.filter((s) => s.id !== sessionId));
    });

    newSocket.on("session-updated", (session: CollaborativeSession) => {
      setActiveSessions((prev) =>
        prev.map((s) => (s.id === session.id ? session : s))
      );
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const fetchActiveSessions = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:5000/api/collaboration/sessions",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setActiveSessions(data.data.sessions);
      }
    } catch (error) {
      console.error("Error fetching active sessions:", error);
    }
  };

  const joinSession = (
    projectId: string,
    fileName: string,
    fileContent?: string
  ) => {
    if (!socket) {
      console.error("Socket not connected");
      return;
    }

    socket.emit("join-session", {
      projectId,
      fileName,
      fileContent,
    });
  };

  const leaveSession = (sessionId?: string) => {
    if (!socket) {
      console.error("Socket not connected");
      return;
    }

    socket.emit("leave-session", { sessionId });
  };

  const getSessionStats = async (): Promise<CollaborationStats> => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:5000/api/collaboration/stats",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.data;
      }
    } catch (error) {
      console.error("Error fetching collaboration stats:", error);
    }

    return {
      totalSessions: 0,
      totalParticipants: 0,
      activeProjects: 0,
      averageParticipantsPerSession: 0,
    };
  };

  const value: CollaborationContextType = {
    socket,
    isConnected,
    activeSessions,
    joinSession,
    leaveSession,
    getSessionStats,
    connectionError,
  };

  return (
    <CollaborationContext.Provider value={value}>
      {children}
    </CollaborationContext.Provider>
  );
};

export const useCollaboration = (): CollaborationContextType => {
  const context = useContext(CollaborationContext);
  if (context === undefined) {
    throw new Error(
      "useCollaboration must be used within a CollaborationProvider"
    );
  }
  return context;
};

export default CollaborationContext;
