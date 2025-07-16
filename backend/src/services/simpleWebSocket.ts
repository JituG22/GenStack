import { Server } from "socket.io";
import { Server as HttpServer } from "http";

export class SimpleWebSocketService {
  private io: Server;

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

      // Join organization room for real-time updates
      socket.on("join_organization", (organizationId: string) => {
        socket.join(`org_${organizationId}`);
        console.log(
          `Socket ${socket.id} joined organization ${organizationId}`
        );
      });

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
      });
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
}

export let simpleWebSocketService: SimpleWebSocketService;

export const initializeSimpleWebSocket = (server: HttpServer) => {
  simpleWebSocketService = new SimpleWebSocketService(server);
  console.log("Simple WebSocket service initialized");
  return simpleWebSocketService;
};
