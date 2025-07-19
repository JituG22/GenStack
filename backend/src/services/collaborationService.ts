import { Server, Namespace } from "socket.io";
import { Server as HttpServer } from "http";

interface CollaborationRoom {
  projectId: string;
  users: Map<string, ConnectedUser>;
  lastActivity: Date;
  events: CollaborationEvent[];
}

interface ConnectedUser {
  socketId: string;
  userId: string;
  username: string;
  cursor: { x: number; y: number };
  selectedNode?: string;
  lastSeen: Date;
  isTyping?: boolean;
}

interface CollaborationEvent {
  id: string;
  type:
    | "node.created"
    | "node.updated"
    | "node.deleted"
    | "cursor.moved"
    | "user.joined"
    | "user.left";
  data: any;
  userId: string;
  timestamp: Date;
}

export class CollaborationService {
  private io: Server | Namespace;
  private rooms: Map<string, CollaborationRoom> = new Map();
  private userSessions: Map<
    string,
    {
      userId?: string;
      username?: string;
      organizationId?: string;
      currentProject?: string;
    }
  > = new Map();

  constructor(server: HttpServer, existingIo?: Server) {
    if (existingIo) {
      // Use a namespace for collaboration to avoid conflicts
      this.io = existingIo.of("/collaboration");
    } else {
      this.io = new Server(server, {
        cors: {
          origin: [
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:5173",
          ],
          methods: ["GET", "POST"],
          credentials: true,
        },
      });
    }

    this.setupEventHandlers();
    this.startRoomCleanup();
  }

  private setupEventHandlers() {
    this.io.on("connection", (socket) => {
      console.log("🔗 Client connected:", socket.id);

      // Initialize user session
      this.userSessions.set(socket.id, {});

      // User joins project room
      socket.on(
        "join_project",
        (data: { projectId: string; userId: string; username: string }) => {
          this.handleUserJoinProject(socket, data);
        }
      );

      // User leaves project room
      socket.on(
        "leave_project",
        (data: { projectId: string; userId: string }) => {
          this.handleUserLeaveProject(socket, data);
        }
      );

      // Real-time cursor tracking
      socket.on(
        "cursor_move",
        (data: {
          projectId: string;
          position: { x: number; y: number };
          userId: string;
        }) => {
          this.handleCursorMove(socket, data);
        }
      );

      // Node operations
      socket.on(
        "node_create",
        (data: { projectId: string; node: any; userId: string }) => {
          this.handleNodeCreate(socket, data);
        }
      );

      socket.on(
        "node_update",
        (data: {
          projectId: string;
          nodeId: string;
          updates: any;
          userId: string;
        }) => {
          this.handleNodeUpdate(socket, data);
        }
      );

      socket.on(
        "node_delete",
        (data: { projectId: string; nodeId: string; userId: string }) => {
          this.handleNodeDelete(socket, data);
        }
      );

      // Node selection
      socket.on(
        "node_select",
        (data: {
          projectId: string;
          nodeId: string | null;
          userId: string;
        }) => {
          this.handleNodeSelect(socket, data);
        }
      );

      // Typing indicators
      socket.on(
        "typing_start",
        (data: { projectId: string; nodeId: string; userId: string }) => {
          this.handleTypingStart(socket, data);
        }
      );

      socket.on(
        "typing_stop",
        (data: { projectId: string; nodeId: string; userId: string }) => {
          this.handleTypingStop(socket, data);
        }
      );

      // Handle disconnection
      socket.on("disconnect", () => {
        this.handleDisconnect(socket);
      });

      // Heartbeat for connection monitoring
      socket.on("ping", () => {
        socket.emit("pong");
      });
    });
  }

  private handleUserJoinProject(
    socket: any,
    data: {
      projectId: string;
      userId: string;
      username: string;
    }
  ) {
    const { projectId, userId, username } = data;

    // Join the project room
    socket.join(`project_${projectId}`);

    // Update user session
    const session = this.userSessions.get(socket.id);
    if (session) {
      session.userId = userId;
      session.username = username;
      session.currentProject = projectId;
    }

    // Get or create room
    let room = this.rooms.get(projectId);
    if (!room) {
      room = {
        projectId,
        users: new Map(),
        lastActivity: new Date(),
        events: [],
      };
      this.rooms.set(projectId, room);
    }

    // Add user to room
    const user: ConnectedUser = {
      socketId: socket.id,
      userId,
      username,
      cursor: { x: 0, y: 0 },
      lastSeen: new Date(),
      isTyping: false,
    };
    room.users.set(userId, user);
    room.lastActivity = new Date();

    // Notify other users
    socket.to(`project_${projectId}`).emit("user_joined", {
      userId,
      username,
      cursor: user.cursor,
      timestamp: new Date(),
    });

    // Send current collaborators to new user
    const collaborators = Array.from(room.users.values())
      .filter((u) => u.userId !== userId)
      .map((u) => ({
        userId: u.userId,
        username: u.username,
        cursor: u.cursor,
        selectedNode: u.selectedNode,
        isTyping: u.isTyping,
      }));

    socket.emit("collaborators_list", {
      projectId,
      collaborators,
    });

    console.log(`👥 User ${username} joined project ${projectId}`);
  }

  private handleUserLeaveProject(
    socket: any,
    data: {
      projectId: string;
      userId: string;
    }
  ) {
    const { projectId, userId } = data;

    socket.leave(`project_${projectId}`);

    const room = this.rooms.get(projectId);
    if (room) {
      room.users.delete(userId);
      room.lastActivity = new Date();

      // Notify other users
      socket.to(`project_${projectId}`).emit("user_left", {
        userId,
        timestamp: new Date(),
      });

      // Remove empty rooms
      if (room.users.size === 0) {
        this.rooms.delete(projectId);
      }
    }

    console.log(`👋 User ${userId} left project ${projectId}`);
  }

  private handleCursorMove(
    socket: any,
    data: {
      projectId: string;
      position: { x: number; y: number };
      userId: string;
    }
  ) {
    const { projectId, position, userId } = data;

    const room = this.rooms.get(projectId);
    if (room) {
      const user = room.users.get(userId);
      if (user) {
        user.cursor = position;
        user.lastSeen = new Date();
        room.lastActivity = new Date();

        // Broadcast cursor position to other users
        socket.to(`project_${projectId}`).emit("cursor_moved", {
          userId,
          position,
          timestamp: new Date(),
        });
      }
    }
  }

  private handleNodeCreate(
    socket: any,
    data: {
      projectId: string;
      node: any;
      userId: string;
    }
  ) {
    const { projectId, node, userId } = data;

    const room = this.rooms.get(projectId);
    if (room) {
      const event: CollaborationEvent = {
        id: `${Date.now()}_${Math.random()}`,
        type: "node.created",
        data: node,
        userId,
        timestamp: new Date(),
      };

      room.events.push(event);
      room.lastActivity = new Date();

      // Keep only last 100 events
      if (room.events.length > 100) {
        room.events = room.events.slice(-100);
      }

      // Broadcast to other users
      socket.to(`project_${projectId}`).emit("node_created", {
        node,
        userId,
        timestamp: new Date(),
      });
    }
  }

  private handleNodeUpdate(
    socket: any,
    data: {
      projectId: string;
      nodeId: string;
      updates: any;
      userId: string;
    }
  ) {
    const { projectId, nodeId, updates, userId } = data;

    const room = this.rooms.get(projectId);
    if (room) {
      const event: CollaborationEvent = {
        id: `${Date.now()}_${Math.random()}`,
        type: "node.updated",
        data: { nodeId, updates },
        userId,
        timestamp: new Date(),
      };

      room.events.push(event);
      room.lastActivity = new Date();

      // Keep only last 100 events
      if (room.events.length > 100) {
        room.events = room.events.slice(-100);
      }

      // Broadcast to other users
      socket.to(`project_${projectId}`).emit("node_updated", {
        nodeId,
        updates,
        userId,
        timestamp: new Date(),
      });
    }
  }

  private handleNodeDelete(
    socket: any,
    data: {
      projectId: string;
      nodeId: string;
      userId: string;
    }
  ) {
    const { projectId, nodeId, userId } = data;

    const room = this.rooms.get(projectId);
    if (room) {
      const event: CollaborationEvent = {
        id: `${Date.now()}_${Math.random()}`,
        type: "node.deleted",
        data: { nodeId },
        userId,
        timestamp: new Date(),
      };

      room.events.push(event);
      room.lastActivity = new Date();

      // Broadcast to other users
      socket.to(`project_${projectId}`).emit("node_deleted", {
        nodeId,
        userId,
        timestamp: new Date(),
      });
    }
  }

  private handleNodeSelect(
    socket: any,
    data: {
      projectId: string;
      nodeId: string | null;
      userId: string;
    }
  ) {
    const { projectId, nodeId, userId } = data;

    const room = this.rooms.get(projectId);
    if (room) {
      const user = room.users.get(userId);
      if (user) {
        user.selectedNode = nodeId || undefined;
        user.lastSeen = new Date();
        room.lastActivity = new Date();

        // Broadcast selection to other users
        socket.to(`project_${projectId}`).emit("node_selected", {
          userId,
          nodeId,
          timestamp: new Date(),
        });
      }
    }
  }

  private handleTypingStart(
    socket: any,
    data: {
      projectId: string;
      nodeId: string;
      userId: string;
    }
  ) {
    const { projectId, nodeId, userId } = data;

    const room = this.rooms.get(projectId);
    if (room) {
      const user = room.users.get(userId);
      if (user) {
        user.isTyping = true;
        user.lastSeen = new Date();
        room.lastActivity = new Date();

        // Broadcast typing status
        socket.to(`project_${projectId}`).emit("typing_start", {
          userId,
          nodeId,
          timestamp: new Date(),
        });
      }
    }
  }

  private handleTypingStop(
    socket: any,
    data: {
      projectId: string;
      nodeId: string;
      userId: string;
    }
  ) {
    const { projectId, nodeId, userId } = data;

    const room = this.rooms.get(projectId);
    if (room) {
      const user = room.users.get(userId);
      if (user) {
        user.isTyping = false;
        user.lastSeen = new Date();
        room.lastActivity = new Date();

        // Broadcast typing status
        socket.to(`project_${projectId}`).emit("typing_stop", {
          userId,
          nodeId,
          timestamp: new Date(),
        });
      }
    }
  }

  private handleDisconnect(socket: any) {
    const session = this.userSessions.get(socket.id);
    if (session && session.currentProject && session.userId) {
      this.handleUserLeaveProject(socket, {
        projectId: session.currentProject,
        userId: session.userId,
      });
    }

    this.userSessions.delete(socket.id);
    console.log("🔌 Client disconnected:", socket.id);
  }

  private startRoomCleanup() {
    // Clean up inactive rooms every 5 minutes
    setInterval(() => {
      const now = new Date();
      const cutoff = 30 * 60 * 1000; // 30 minutes

      for (const [projectId, room] of this.rooms.entries()) {
        if (
          now.getTime() - room.lastActivity.getTime() > cutoff &&
          room.users.size === 0
        ) {
          this.rooms.delete(projectId);
          console.log(`🗑️ Cleaned up inactive room: ${projectId}`);
        }
      }
    }, 5 * 60 * 1000);
  }

  // Public methods for external use
  public getProjectCollaborators(projectId: string): ConnectedUser[] {
    const room = this.rooms.get(projectId);
    return room ? Array.from(room.users.values()) : [];
  }

  public getProjectStats(projectId: string): {
    activeUsers: number;
    totalEvents: number;
    lastActivity: Date | null;
  } {
    const room = this.rooms.get(projectId);
    return {
      activeUsers: room ? room.users.size : 0,
      totalEvents: room ? room.events.length : 0,
      lastActivity: room ? room.lastActivity : null,
    };
  }

  public broadcastToProject(projectId: string, event: string, data: any) {
    this.io.to(`project_${projectId}`).emit(event, data);
  }

  public getRoomCount(): number {
    return this.rooms.size;
  }

  public getTotalUsers(): number {
    return Array.from(this.rooms.values()).reduce(
      (total, room) => total + room.users.size,
      0
    );
  }
}

export default CollaborationService;
