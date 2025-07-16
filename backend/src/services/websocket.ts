import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { User } from "../models/User";

interface AuthenticatedSocket extends Socket {
  user?: any;
}

export class WebSocketService {
  private io: Server;
  private connectedUsers: Map<string, string> = new Map(); // userId -> socketId

  constructor(httpServer: HttpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    this.setupAuthentication();
    this.setupEventHandlers();
  }

  private setupAuthentication() {
    this.io.use(async (socket: any, next) => {
      try {
        const token =
          socket.handshake.auth.token ||
          socket.handshake.headers.authorization?.replace("Bearer ", "");

        if (!token) {
          return next(new Error("Authentication error: No token provided"));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
          return next(new Error("Authentication error: User not found"));
        }

        socket.user = user;
        next();
      } catch (error) {
        next(new Error("Authentication error: Invalid token"));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on("connection", (socket: AuthenticatedSocket) => {
      console.log(`✅ User connected: ${socket.user.email} (${socket.id})`);

      // Store user connection
      this.connectedUsers.set(socket.user.id, socket.id);

      // Join user's organization room
      socket.join(`org_${socket.user.organization}`);

      // Join user-specific room
      socket.join(`user_${socket.user.id}`);

      // Handle project collaboration
      socket.on("join_project", (projectId: string) => {
        socket.join(`project_${projectId}`);
        socket.broadcast
          .to(`project_${projectId}`)
          .emit("user_joined_project", {
            user: {
              id: socket.user.id,
              name: `${socket.user.firstName} ${socket.user.lastName}`,
              email: socket.user.email,
            },
            projectId,
            timestamp: new Date(),
          });
      });

      socket.on("leave_project", (projectId: string) => {
        socket.leave(`project_${projectId}`);
        socket.broadcast.to(`project_${projectId}`).emit("user_left_project", {
          user: {
            id: socket.user.id,
            name: `${socket.user.firstName} ${socket.user.lastName}`,
          },
          projectId,
          timestamp: new Date(),
        });
      });

      // Handle project updates
      socket.on("project_update", (data: any) => {
        socket.broadcast
          .to(`org_${socket.user.organization}`)
          .emit("project_updated", {
            ...data,
            updatedBy: {
              id: socket.user.id,
              name: `${socket.user.firstName} ${socket.user.lastName}`,
            },
            timestamp: new Date(),
          });
      });

      // Handle node updates
      socket.on("node_update", (data: any) => {
        socket.broadcast
          .to(`org_${socket.user.organization}`)
          .emit("node_updated", {
            ...data,
            updatedBy: {
              id: socket.user.id,
              name: `${socket.user.firstName} ${socket.user.lastName}`,
            },
            timestamp: new Date(),
          });
      });

      // Handle template updates
      socket.on("template_update", (data: any) => {
        socket.broadcast
          .to(`org_${socket.user.organization}`)
          .emit("template_updated", {
            ...data,
            updatedBy: {
              id: socket.user.id,
              name: `${socket.user.firstName} ${socket.user.lastName}`,
            },
            timestamp: new Date(),
          });
      });

      // Handle user activity tracking
      socket.on("user_activity", (activity: any) => {
        socket.broadcast
          .to(`org_${socket.user.organization}`)
          .emit("user_activity_update", {
            userId: socket.user.id,
            user: `${socket.user.firstName} ${socket.user.lastName}`,
            activity,
            timestamp: new Date(),
          });
      });

      // Handle disconnect
      socket.on("disconnect", () => {
        console.log(
          `❌ User disconnected: ${socket.user.email} (${socket.id})`
        );
        this.connectedUsers.delete(socket.user.id);

        // Notify organization about user going offline
        socket.broadcast
          .to(`org_${socket.user.organization}`)
          .emit("user_disconnected", {
            userId: socket.user.id,
            user: `${socket.user.firstName} ${socket.user.lastName}`,
            timestamp: new Date(),
          });
      });
    });
  }

  // Public methods for triggering events from API routes
  public notifyProjectCreated(
    organizationId: string,
    projectData: any,
    createdBy: any
  ) {
    this.io.to(`org_${organizationId}`).emit("project_created", {
      project: projectData,
      createdBy: {
        id: createdBy.id,
        name: `${createdBy.firstName} ${createdBy.lastName}`,
      },
      timestamp: new Date(),
    });
  }

  public notifyProjectDeleted(
    organizationId: string,
    projectId: string,
    deletedBy: any
  ) {
    this.io.to(`org_${organizationId}`).emit("project_deleted", {
      projectId,
      deletedBy: {
        id: deletedBy.id,
        name: `${deletedBy.firstName} ${deletedBy.lastName}`,
      },
      timestamp: new Date(),
    });
  }

  public notifyBulkProjectsDeleted(
    organizationId: string,
    projectIds: string[],
    deletedBy: any
  ) {
    this.io.to(`org_${organizationId}`).emit("projects_bulk_deleted", {
      projectIds,
      count: projectIds.length,
      deletedBy: {
        id: deletedBy.id,
        name: `${deletedBy.firstName} ${deletedBy.lastName}`,
      },
      timestamp: new Date(),
    });
  }

  public notifyNodeCreated(
    organizationId: string,
    nodeData: any,
    createdBy: any
  ) {
    this.io.to(`org_${organizationId}`).emit("node_created", {
      node: nodeData,
      createdBy: {
        id: createdBy.id,
        name: `${createdBy.firstName} ${createdBy.lastName}`,
      },
      timestamp: new Date(),
    });
  }

  public notifyTemplateCreated(
    organizationId: string,
    templateData: any,
    createdBy: any
  ) {
    this.io.to(`org_${organizationId}`).emit("template_created", {
      template: templateData,
      createdBy: {
        id: createdBy.id,
        name: `${createdBy.firstName} ${createdBy.lastName}`,
      },
      timestamp: new Date(),
    });
  }

  public sendNotificationToUser(userId: string, notification: any) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(`user_${userId}`).emit("notification", {
        ...notification,
        timestamp: new Date(),
      });
    }
  }

  public getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  public getConnectedUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }
}

export let webSocketService: WebSocketService;
