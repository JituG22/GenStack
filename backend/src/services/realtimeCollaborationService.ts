import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";
import Redis from "ioredis";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";

interface User {
  id: string;
  username: string;
  email: string;
}

interface CollaborativeSession {
  id: string;
  projectId: string;
  fileName: string;
  participants: Map<string, Participant>;
  operations: Operation[];
  createdAt: Date;
  lastActivity: Date;
}

interface Participant {
  userId: string;
  username: string;
  socketId: string;
  cursor?: {
    line: number;
    column: number;
  };
  selection?: {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  };
  color: string;
  joinedAt: Date;
}

interface Operation {
  id: string;
  type: "insert" | "delete" | "replace";
  position: {
    line: number;
    column: number;
  };
  content: string;
  userId: string;
  timestamp: Date;
  applied: boolean;
}

interface FileState {
  content: string;
  version: number;
  lastModified: Date;
  operations: Operation[];
}

class RealtimeCollaborationService {
  private io: SocketIOServer;
  private redis: Redis;
  private sessions: Map<string, CollaborativeSession> = new Map();
  private fileStates: Map<string, FileState> = new Map();
  private userColors: string[] = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEAA7",
    "#DDA0DD",
    "#98D8C8",
    "#F7DC6F",
    "#BB8FCE",
    "#85C1E9",
  ];

  constructor(server: HTTPServer, socketIOServer?: any) {
    // Initialize Redis
    this.redis = new Redis({
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379"),
      maxRetriesPerRequest: 3,
    });

    // Use provided Socket.IO server or create a new one
    if (socketIOServer) {
      this.io = socketIOServer;
    } else {
      // Initialize Socket.IO (will use in-memory adapter for now)
      this.io = new SocketIOServer(server, {
        cors: {
          origin: process.env.FRONTEND_URL || "http://localhost:3000",
          methods: ["GET", "POST"],
          credentials: true,
        },
      });
    }

    this.setupSocketHandlers();
    this.setupCleanupTasks();
  }

  private setupSocketHandlers(): void {
    this.io.use(this.authenticateSocket.bind(this));

    this.io.on("connection", (socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Join collaborative session
      socket.on("join-session", this.handleJoinSession.bind(this, socket));

      // Leave collaborative session
      socket.on("leave-session", this.handleLeaveSession.bind(this, socket));

      // Handle text operations
      socket.on("text-operation", this.handleTextOperation.bind(this, socket));

      // Handle cursor movements
      socket.on("cursor-change", this.handleCursorChange.bind(this, socket));

      // Handle selection changes
      socket.on(
        "selection-change",
        this.handleSelectionChange.bind(this, socket)
      );

      // Handle file save
      socket.on("save-file", this.handleFileSave.bind(this, socket));

      // Handle disconnection
      socket.on("disconnect", this.handleDisconnect.bind(this, socket));
    });
  }

  private async authenticateSocket(socket: any, next: any): Promise<void> {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "default-secret"
      ) as any;
      socket.user = decoded;
      next();
    } catch (error) {
      next(new Error("Authentication error: Invalid token"));
    }
  }

  private async handleJoinSession(
    socket: any,
    data: {
      projectId: string;
      fileName: string;
      fileContent?: string;
    }
  ): Promise<void> {
    try {
      const { projectId, fileName, fileContent } = data;
      const sessionId = `${projectId}:${fileName}`;
      const user = socket.user as User;

      // Join socket room
      await socket.join(sessionId);

      // Get or create session
      let session = this.sessions.get(sessionId);
      if (!session) {
        session = {
          id: sessionId,
          projectId,
          fileName,
          participants: new Map(),
          operations: [],
          createdAt: new Date(),
          lastActivity: new Date(),
        };
        this.sessions.set(sessionId, session);
      }

      // Get or create file state
      let fileState = this.fileStates.get(sessionId);
      if (!fileState && fileContent !== undefined) {
        fileState = {
          content: fileContent,
          version: 0,
          lastModified: new Date(),
          operations: [],
        };
        this.fileStates.set(sessionId, fileState);
      }

      // Add participant
      const participant: Participant = {
        userId: user.id,
        username: user.username,
        socketId: socket.id,
        color: this.assignUserColor(session),
        joinedAt: new Date(),
      };

      session.participants.set(socket.id, participant);
      session.lastActivity = new Date();

      // Store session reference in socket
      socket.sessionId = sessionId;

      // Send current file state to new participant
      if (fileState) {
        socket.emit("file-state", {
          content: fileState.content,
          version: fileState.version,
          participants: Array.from(session.participants.values()),
        });
      }

      // Notify other participants
      socket.to(sessionId).emit("participant-joined", {
        participant: participant,
        totalParticipants: session.participants.size,
      });

      console.log(`User ${user.username} joined session ${sessionId}`);
    } catch (error) {
      console.error("Error joining session:", error);
      socket.emit("error", { message: "Failed to join collaborative session" });
    }
  }

  private async handleLeaveSession(
    socket: any,
    data: { sessionId?: string }
  ): Promise<void> {
    try {
      const sessionId = data.sessionId || socket.sessionId;
      if (!sessionId) return;

      const session = this.sessions.get(sessionId);
      if (!session) return;

      // Remove participant
      const participant = session.participants.get(socket.id);
      if (participant) {
        session.participants.delete(socket.id);
        session.lastActivity = new Date();

        // Leave socket room
        await socket.leave(sessionId);

        // Notify other participants
        socket.to(sessionId).emit("participant-left", {
          participantId: socket.id,
          totalParticipants: session.participants.size,
        });

        // Clean up empty sessions
        if (session.participants.size === 0) {
          this.cleanupSession(sessionId);
        }

        console.log(`User ${participant.username} left session ${sessionId}`);
      }
    } catch (error) {
      console.error("Error leaving session:", error);
    }
  }

  private async handleTextOperation(
    socket: any,
    data: {
      operation: Operation;
      version: number;
    }
  ): Promise<void> {
    try {
      const sessionId = socket.sessionId;
      if (!sessionId) return;

      const session = this.sessions.get(sessionId);
      const fileState = this.fileStates.get(sessionId);

      if (!session || !fileState) {
        socket.emit("error", { message: "Session not found" });
        return;
      }

      // Validate operation
      const operation = {
        ...data.operation,
        id: uuidv4(),
        timestamp: new Date(),
      };

      // Apply operational transformation if needed
      const transformedOperation = this.transformOperation(
        operation,
        fileState,
        data.version
      );

      // Apply operation to file state
      const newContent = this.applyOperation(
        fileState.content,
        transformedOperation
      );

      // Update file state
      fileState.content = newContent;
      fileState.version += 1;
      fileState.lastModified = new Date();
      fileState.operations.push(transformedOperation);

      // Update session activity
      session.lastActivity = new Date();

      // Broadcast operation to all participants except sender
      socket.to(sessionId).emit("text-operation", {
        operation: transformedOperation,
        version: fileState.version,
        content: newContent,
      });

      // Acknowledge operation to sender
      socket.emit("operation-ack", {
        operationId: operation.id,
        version: fileState.version,
      });

      console.log(`Text operation applied in session ${sessionId}`);
    } catch (error) {
      console.error("Error handling text operation:", error);
      socket.emit("error", { message: "Failed to apply text operation" });
    }
  }

  private async handleCursorChange(
    socket: any,
    data: {
      line: number;
      column: number;
    }
  ): Promise<void> {
    try {
      const sessionId = socket.sessionId;
      if (!sessionId) return;

      const session = this.sessions.get(sessionId);
      if (!session) return;

      const participant = session.participants.get(socket.id);
      if (!participant) return;

      // Update cursor position
      participant.cursor = { line: data.line, column: data.column };
      session.lastActivity = new Date();

      // Broadcast cursor change to other participants
      socket.to(sessionId).emit("cursor-change", {
        participantId: socket.id,
        cursor: participant.cursor,
        username: participant.username,
        color: participant.color,
      });
    } catch (error) {
      console.error("Error handling cursor change:", error);
    }
  }

  private async handleSelectionChange(
    socket: any,
    data: {
      startLine: number;
      startColumn: number;
      endLine: number;
      endColumn: number;
    }
  ): Promise<void> {
    try {
      const sessionId = socket.sessionId;
      if (!sessionId) return;

      const session = this.sessions.get(sessionId);
      if (!session) return;

      const participant = session.participants.get(socket.id);
      if (!participant) return;

      // Update selection
      participant.selection = data;
      session.lastActivity = new Date();

      // Broadcast selection change to other participants
      socket.to(sessionId).emit("selection-change", {
        participantId: socket.id,
        selection: participant.selection,
        username: participant.username,
        color: participant.color,
      });
    } catch (error) {
      console.error("Error handling selection change:", error);
    }
  }

  private async handleFileSave(
    socket: any,
    data: { content: string }
  ): Promise<void> {
    try {
      const sessionId = socket.sessionId;
      if (!sessionId) return;

      const fileState = this.fileStates.get(sessionId);
      if (!fileState) return;

      // Update file state
      fileState.content = data.content;
      fileState.lastModified = new Date();

      // Notify all participants that file was saved
      this.io.to(sessionId).emit("file-saved", {
        content: data.content,
        savedBy: socket.user.username,
        timestamp: new Date(),
      });

      console.log(`File saved in session ${sessionId}`);
    } catch (error) {
      console.error("Error handling file save:", error);
      socket.emit("error", { message: "Failed to save file" });
    }
  }

  private async handleDisconnect(socket: any): Promise<void> {
    try {
      const sessionId = socket.sessionId;
      if (sessionId) {
        await this.handleLeaveSession(socket, { sessionId });
      }
      console.log(`Client disconnected: ${socket.id}`);
    } catch (error) {
      console.error("Error handling disconnect:", error);
    }
  }

  private transformOperation(
    operation: Operation,
    fileState: FileState,
    clientVersion: number
  ): Operation {
    // Simple operational transformation
    // In a production environment, you would implement a more sophisticated OT algorithm

    if (clientVersion === fileState.version) {
      // No transformation needed
      return operation;
    }

    // Apply simple transformation based on concurrent operations
    const recentOperations = fileState.operations.slice(clientVersion);
    let transformedOperation = { ...operation };

    for (const recentOp of recentOperations) {
      transformedOperation = this.transformAgainstOperation(
        transformedOperation,
        recentOp
      );
    }

    return transformedOperation;
  }

  private transformAgainstOperation(op1: Operation, op2: Operation): Operation {
    // Simplified operational transformation
    // This is a basic implementation - production systems would need more sophisticated algorithms

    if (op1.position.line < op2.position.line) {
      return op1; // No transformation needed
    }

    if (
      op1.position.line === op2.position.line &&
      op1.position.column <= op2.position.column
    ) {
      return op1; // No transformation needed
    }

    // Adjust position based on the second operation
    const transformed = { ...op1 };

    if (op2.type === "insert") {
      const insertLines = op2.content.split("\n").length - 1;
      if (insertLines > 0) {
        transformed.position.line += insertLines;
        if (op1.position.line === op2.position.line) {
          transformed.position.column += op2.content.length;
        }
      } else if (op1.position.line === op2.position.line) {
        transformed.position.column += op2.content.length;
      }
    } else if (op2.type === "delete") {
      const deleteLines = op2.content.split("\n").length - 1;
      if (deleteLines > 0) {
        transformed.position.line -= deleteLines;
        if (op1.position.line === op2.position.line) {
          transformed.position.column -= op2.content.length;
        }
      } else if (op1.position.line === op2.position.line) {
        transformed.position.column -= op2.content.length;
      }
    }

    return transformed;
  }

  private applyOperation(content: string, operation: Operation): string {
    const lines = content.split("\n");
    const { line, column } = operation.position;

    switch (operation.type) {
      case "insert":
        if (lines[line]) {
          const before = lines[line].substring(0, column);
          const after = lines[line].substring(column);
          lines[line] = before + operation.content + after;
        } else {
          lines[line] = operation.content;
        }
        break;

      case "delete":
        if (lines[line]) {
          const before = lines[line].substring(0, column);
          const after = lines[line].substring(
            column + operation.content.length
          );
          lines[line] = before + after;
        }
        break;

      case "replace":
        if (lines[line]) {
          const before = lines[line].substring(0, column);
          const after = lines[line].substring(
            column + operation.content.length
          );
          lines[line] = before + operation.content + after;
        }
        break;
    }

    return lines.join("\n");
  }

  private assignUserColor(session: CollaborativeSession): string {
    const usedColors = Array.from(session.participants.values()).map(
      (p) => p.color
    );
    const availableColors = this.userColors.filter(
      (color) => !usedColors.includes(color)
    );

    if (availableColors.length > 0) {
      return availableColors[0];
    }

    // If all colors are used, pick a random one
    return this.userColors[Math.floor(Math.random() * this.userColors.length)];
  }

  private cleanupSession(sessionId: string): void {
    this.sessions.delete(sessionId);

    // Keep file state for a while in case users reconnect
    setTimeout(() => {
      this.fileStates.delete(sessionId);
    }, 30 * 60 * 1000); // 30 minutes
  }

  private setupCleanupTasks(): void {
    // Clean up inactive sessions every 10 minutes
    setInterval(() => {
      const now = new Date();
      const inactiveThreshold = 30 * 60 * 1000; // 30 minutes

      for (const [sessionId, session] of this.sessions.entries()) {
        const timeSinceActivity =
          now.getTime() - session.lastActivity.getTime();

        if (
          timeSinceActivity > inactiveThreshold &&
          session.participants.size === 0
        ) {
          this.cleanupSession(sessionId);
          console.log(`Cleaned up inactive session: ${sessionId}`);
        }
      }
    }, 10 * 60 * 1000);
  }

  // Public API methods
  public getActiveSessions(): CollaborativeSession[] {
    return Array.from(this.sessions.values());
  }

  public getSessionParticipants(sessionId: string): Participant[] {
    const session = this.sessions.get(sessionId);
    return session ? Array.from(session.participants.values()) : [];
  }

  public getFileState(sessionId: string): FileState | undefined {
    return this.fileStates.get(sessionId);
  }

  public async shutdown(): Promise<void> {
    try {
      await this.redis.quit();
      this.io.close();
      console.log("Realtime collaboration service shut down successfully");
    } catch (error) {
      console.error(
        "Error shutting down realtime collaboration service:",
        error
      );
    }
  }
}

export default RealtimeCollaborationService;
