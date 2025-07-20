import { io, Socket } from "socket.io-client";

class WebSocketService {
  private socket: Socket | null = null;
  private eventHandlers: Map<string, ((...args: any[]) => void)[]> = new Map();

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      this.socket = io({
        auth: {
          token,
        },
        transports: ["websocket"],
      });

      this.socket.on("connect", () => {
        console.log("WebSocket connected");
        resolve();
      });

      this.socket.on("connect_error", (error) => {
        console.error("WebSocket connection error:", error);
        reject(error);
      });

      this.socket.on("disconnect", (reason) => {
        console.log("WebSocket disconnected:", reason);
      });

      // Set up event listeners for all registered handlers
      this.eventHandlers.forEach((handlers, event) => {
        handlers.forEach((handler) => {
          this.socket?.on(event, handler);
        });
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  on(event: string, handler: (...args: any[]) => void): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }

    this.eventHandlers.get(event)?.push(handler);

    // If socket is already connected, add the listener immediately
    if (this.socket?.connected) {
      this.socket.on(event, handler);
    }
  }

  off(event: string, handler: (...args: any[]) => void): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }

    if (this.socket?.connected) {
      this.socket.off(event, handler);
    }
  }

  emit(event: string, data?: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }

  // Notification-specific methods
  joinNotificationRoom(userId: string): void {
    this.emit("notification:join", { userId });
  }

  leaveNotificationRoom(userId: string): void {
    this.emit("notification:leave", { userId });
  }

  // Analytics-specific methods
  joinAnalyticsRoom(userId: string): void {
    this.emit("analytics:join", { userId });
  }

  leaveAnalyticsRoom(userId: string): void {
    this.emit("analytics:leave", { userId });
  }

  // User presence methods
  updateUserPresence(status: "online" | "away" | "offline"): void {
    this.emit("user:presence", { status });
  }

  // Send typing indicator
  sendTypingIndicator(roomId: string, isTyping: boolean): void {
    this.emit("typing", { roomId, isTyping });
  }

  // Send custom event
  sendCustomEvent(event: string, data: any): void {
    this.emit(event, data);
  }
}

export const webSocketService = new WebSocketService();
export default webSocketService;
