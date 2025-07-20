import { io, Socket } from "socket.io-client";
import apiConfig from "../config/api";

// Chat message interface
export interface ChatMessage {
  id: string;
  sessionId: string;
  userId: string;
  username: string;
  content: string;
  timestamp: Date;
  threadId?: string;
  reactions?: { [emoji: string]: string[] };
  type: "text" | "code" | "file" | "system";
}

// Chat thread interface
export interface ChatThread {
  id: string;
  sessionId: string;
  title: string;
  createdBy: string;
  createdAt: Date;
  messageCount: number;
  lastActivity: Date;
  participants: string[];
}

// User presence interface
export interface UserPresence {
  id: string;
  username: string;
  email: string;
  status: "online" | "away" | "busy" | "offline";
  lastSeen: Date;
  currentSession?: string;
}

class CommunicationService {
  private chatSocket: Socket | null = null;
  private eventHandlers: Map<string, ((...args: any[]) => void)[]> = new Map();

  // Chat Service Methods
  async connectToChat(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.chatSocket?.connected) {
        resolve();
        return;
      }

      console.log("🔌 Connecting to chat socket:", apiConfig.chatNamespace);
      this.chatSocket = io(apiConfig.chatNamespace, {
        auth: { token },
        transports: ["websocket"],
      });

      this.chatSocket.on("connect", () => {
        console.log("Chat socket connected");
        this.setupChatEventListeners();
        resolve();
      });

      this.chatSocket.on("connect_error", (error) => {
        console.error("Chat socket connection error:", error);
        reject(error);
      });
    });
  }

  private setupChatEventListeners(): void {
    if (!this.chatSocket) return;

    // Message events
    this.chatSocket.on("message_sent", (message: ChatMessage) => {
      this.emit("message_sent", message);
    });

    this.chatSocket.on("message_received", (message: ChatMessage) => {
      this.emit("message_received", message);
    });

    this.chatSocket.on("message_updated", (message: ChatMessage) => {
      this.emit("message_updated", message);
    });

    this.chatSocket.on(
      "message_deleted",
      (data: { messageId: string; sessionId: string }) => {
        this.emit("message_deleted", data);
      }
    );

    // Thread events
    this.chatSocket.on("thread_created", (thread: ChatThread) => {
      this.emit("thread_created", thread);
    });

    this.chatSocket.on("thread_updated", (thread: ChatThread) => {
      this.emit("thread_updated", thread);
    });

    // Session events
    this.chatSocket.on("session_joined", (data: any) => {
      this.emit("session_joined", data);
    });

    this.chatSocket.on("session_left", (data: any) => {
      this.emit("session_left", data);
    });

    // User events
    this.chatSocket.on("user_joined", (data: any) => {
      this.emit("user_joined", data);
    });

    this.chatSocket.on("user_left", (data: any) => {
      this.emit("user_left", data);
    });

    this.chatSocket.on("user_typing", (data: any) => {
      this.emit("user_typing", data);
    });

    this.chatSocket.on("user_stopped_typing", (data: any) => {
      this.emit("user_stopped_typing", data);
    });

    // Presence events
    this.chatSocket.on("presence_updated", (presence: UserPresence) => {
      this.emit("presence_updated", presence);
    });
  }

  // Session management
  async joinChatSession(sessionId: string): Promise<void> {
    if (!this.chatSocket?.connected) {
      throw new Error("Chat socket not connected");
    }

    return new Promise((resolve, reject) => {
      this.chatSocket!.emit("join_session", { sessionId }, (response: any) => {
        if (response.success) {
          console.log(`Joined chat session: ${sessionId}`);
          resolve();
        } else {
          console.error(`Failed to join chat session: ${response.error}`);
          reject(new Error(response.error));
        }
      });
    });
  }

  async leaveChatSession(sessionId: string): Promise<void> {
    if (!this.chatSocket?.connected) {
      throw new Error("Chat socket not connected");
    }

    return new Promise((resolve, reject) => {
      this.chatSocket!.emit("leave_session", { sessionId }, (response: any) => {
        if (response.success) {
          console.log(`Left chat session: ${sessionId}`);
          resolve();
        } else {
          console.error(`Failed to leave chat session: ${response.error}`);
          reject(new Error(response.error));
        }
      });
    });
  }

  // Message operations
  sendMessage(sessionId: string, content: string, threadId?: string): void {
    if (!this.chatSocket?.connected) {
      throw new Error("Chat socket not connected");
    }

    this.chatSocket.emit("send_message", {
      sessionId,
      content,
      threadId,
      type: "text",
      timestamp: new Date(),
    });
  }

  sendCodeMessage(
    sessionId: string,
    code: string,
    language: string,
    threadId?: string
  ): void {
    if (!this.chatSocket?.connected) {
      throw new Error("Chat socket not connected");
    }

    this.chatSocket.emit("send_message", {
      sessionId,
      content: code,
      threadId,
      type: "code",
      metadata: { language },
      timestamp: new Date(),
    });
  }

  // Typing indicators
  startTyping(sessionId: string): void {
    if (!this.chatSocket?.connected) return;
    this.chatSocket.emit("typing_start", { sessionId });
  }

  stopTyping(sessionId: string): void {
    if (!this.chatSocket?.connected) return;
    this.chatSocket.emit("typing_stop", { sessionId });
  }

  // Message reactions
  addReaction(messageId: string, emoji: string): void {
    if (!this.chatSocket?.connected) return;
    this.chatSocket.emit("add_reaction", { messageId, emoji });
  }

  removeReaction(messageId: string, emoji: string): void {
    if (!this.chatSocket?.connected) return;
    this.chatSocket.emit("remove_reaction", { messageId, emoji });
  }

  // HTTP API methods for data fetching
  async getChatMessages(
    sessionId: string,
    page = 1,
    limit = 50,
    threadId?: string
  ): Promise<{
    messages: ChatMessage[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const url = new URL(`${apiConfig.baseUrl}/api/chat/messages`);
    url.searchParams.append("sessionId", sessionId);
    url.searchParams.append("page", page.toString());
    url.searchParams.append("limit", limit.toString());
    if (threadId) {
      url.searchParams.append("threadId", threadId);
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch messages: ${response.statusText}`);
    }

    return response.json();
  }

  async getChatThreads(sessionId: string): Promise<ChatThread[]> {
    const url = `${apiConfig.baseUrl}/api/chat/threads?sessionId=${sessionId}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch threads: ${response.statusText}`);
    }

    const data = await response.json();
    return data.threads || [];
  }

  // Event handling
  on(event: string, handler: (...args: any[]) => void): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  off(event: string, handler?: (...args: any[]) => void): void {
    if (!this.eventHandlers.has(event)) return;

    if (handler) {
      const handlers = this.eventHandlers.get(event)!;
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    } else {
      this.eventHandlers.delete(event);
    }
  }

  private emit(event: string, ...args: any[]): void {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event)!.forEach((handler) => {
        try {
          handler(...args);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  // Cleanup
  disconnect(): void {
    if (this.chatSocket) {
      this.chatSocket.disconnect();
      this.chatSocket = null;
    }
    this.eventHandlers.clear();
  }

  // Connection status
  get isConnected(): boolean {
    return this.chatSocket?.connected || false;
  }
}

// Create singleton instance
const communicationService = new CommunicationService();
export { communicationService };
export default communicationService;
