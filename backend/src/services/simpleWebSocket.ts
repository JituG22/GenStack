import { Server } from "socket.io";
import { Server as HttpServer } from "http";

export class SimpleWebSocketService {
  private io: Server;
  private userSessions: Map<
    string,
    {
      userId?: string;
      username?: string;
      organizationId?: string;
      currentProject?: string;
      cursor?: { x: number; y: number };
      activeNode?: string;
    }
  > = new Map();

  constructor(server: HttpServer) {
    this.io = new Server(server, {
      cors: {
        origin: ["http://localhost:3000", "http://localhost:5173"],
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on("connection", (socket) => {
      console.log("Client connected:", socket.id);

      // Initialize user session
      this.userSessions.set(socket.id, {});

      // User authentication and presence
      socket.on(
        "user_join",
        (data: {
          userId: string;
          username: string;
          organizationId: string;
          projectId?: string;
        }) => {
          const session = this.userSessions.get(socket.id);
          if (session) {
            session.userId = data.userId;
            session.username = data.username;
            session.organizationId = data.organizationId;
            session.currentProject = data.projectId;
          }

          // Join organization and project rooms
          socket.join(`org_${data.organizationId}`);
          if (data.projectId) {
            socket.join(`project_${data.projectId}`);

            // Notify others of user joining project
            socket.to(`project_${data.projectId}`).emit("user_joined", {
              userId: data.userId,
              username: data.username,
              socketId: socket.id,
            });

            // Send current project collaborators to new user
            this.sendProjectCollaborators(socket, data.projectId);
          }

          console.log(
            `User ${data.username} joined organization ${data.organizationId}`
          );
        }
      );

      // Join organization room for real-time updates
      socket.on("join_organization", (organizationId: string) => {
        socket.join(`org_${organizationId}`);
        console.log(
          `Socket ${socket.id} joined organization ${organizationId}`
        );
      });

      // Collaborative editing events
      socket.on(
        "node_position_update",
        (data: {
          projectId: string;
          nodeId: string;
          position: { x: number; y: number };
          userId: string;
        }) => {
          socket.to(`project_${data.projectId}`).emit("node_position_changed", {
            ...data,
            socketId: socket.id,
            timestamp: new Date(),
          });
        }
      );

      socket.on(
        "node_property_update",
        (data: {
          projectId: string;
          nodeId: string;
          properties: any;
          userId: string;
        }) => {
          socket
            .to(`project_${data.projectId}`)
            .emit("node_properties_changed", {
              ...data,
              socketId: socket.id,
              timestamp: new Date(),
            });
        }
      );

      socket.on(
        "node_connection_update",
        (data: {
          projectId: string;
          connection: {
            from: string;
            to: string;
            fromPort?: string;
            toPort?: string;
          };
          action: "create" | "delete";
          userId: string;
        }) => {
          socket
            .to(`project_${data.projectId}`)
            .emit("node_connection_changed", {
              ...data,
              socketId: socket.id,
              timestamp: new Date(),
            });
        }
      );

      socket.on(
        "cursor_position_update",
        (data: {
          projectId: string;
          position: { x: number; y: number };
          userId: string;
        }) => {
          const session = this.userSessions.get(socket.id);
          if (session) {
            session.cursor = data.position;
          }

          socket
            .to(`project_${data.projectId}`)
            .emit("cursor_position_changed", {
              ...data,
              socketId: socket.id,
              username: session?.username,
            });
        }
      );

      socket.on(
        "node_selection_update",
        (data: {
          projectId: string;
          nodeId: string | null;
          userId: string;
        }) => {
          const session = this.userSessions.get(socket.id);
          if (session) {
            session.activeNode = data.nodeId || undefined;
          }

          socket
            .to(`project_${data.projectId}`)
            .emit("node_selection_changed", {
              ...data,
              socketId: socket.id,
              username: session?.username,
            });
        }
      );

      // Handle analytics events
      socket.on("analytics_event", (data) => {
        console.log("Analytics event received:", data);
        // Broadcast to organization
        if (data.organizationId) {
          socket.to(`org_${data.organizationId}`).emit("analytics_update", {
            type: "event_tracked",
            data,
            timestamp: new Date(),
          });
        }
      });

      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);

        const session = this.userSessions.get(socket.id);
        if (session && session.currentProject) {
          // Notify others of user leaving
          socket.to(`project_${session.currentProject}`).emit("user_left", {
            userId: session.userId,
            username: session.username,
            socketId: socket.id,
          });
        }

        this.userSessions.delete(socket.id);
      });
    });
  }

  private sendProjectCollaborators(socket: any, projectId: string) {
    const collaborators: any[] = [];

    // Find all users in this project
    this.userSessions.forEach((session, socketId) => {
      if (session.currentProject === projectId && session.userId) {
        collaborators.push({
          userId: session.userId,
          username: session.username,
          socketId: socketId,
          cursor: session.cursor,
          activeNode: session.activeNode,
        });
      }
    });

    socket.emit("project_collaborators", {
      projectId,
      collaborators,
    });
  }

  // Broadcast analytics update to organization
  public broadcastAnalyticsUpdate(organizationId: string, data: any) {
    this.io.to(`org_${organizationId}`).emit("analytics_update", {
      type: "analytics_data",
      data,
      timestamp: new Date(),
    });
  }

  // Broadcast performance alert
  public broadcastPerformanceAlert(organizationId: string, alert: any) {
    this.io.to(`org_${organizationId}`).emit("performance_alert", {
      type: "performance_threshold",
      alert,
      timestamp: new Date(),
    });
  }

  // Get connected clients count
  public getConnectedClientsCount(): number {
    return this.io.engine.clientsCount;
  }

  // Collaborative editing methods
  public broadcastNodeUpdate(projectId: string, nodeUpdate: any) {
    this.io.to(`project_${projectId}`).emit("node_update_broadcast", {
      ...nodeUpdate,
      timestamp: new Date(),
    });
  }

  public broadcastProjectUpdate(projectId: string, update: any) {
    this.io.to(`project_${projectId}`).emit("project_update", {
      ...update,
      timestamp: new Date(),
    });
  }

  public getProjectCollaborators(projectId: string) {
    const collaborators: any[] = [];
    this.userSessions.forEach((session, socketId) => {
      if (session.currentProject === projectId && session.userId) {
        collaborators.push({
          userId: session.userId,
          username: session.username,
          socketId: socketId,
          cursor: session.cursor,
          activeNode: session.activeNode,
        });
      }
    });
    return collaborators;
  }

  public notifyProjectSaved(projectId: string, saveData: any) {
    this.io.to(`project_${projectId}`).emit("project_saved", {
      ...saveData,
      timestamp: new Date(),
    });
  }

  // Get the Socket.IO server instance
  public getServer(): Server {
    return this.io;
  }
}

export let simpleWebSocketService: SimpleWebSocketService;

export const initializeSimpleWebSocket = (server: HttpServer) => {
  simpleWebSocketService = new SimpleWebSocketService(server);
  console.log("Simple WebSocket service initialized");
  return simpleWebSocketService;
};
