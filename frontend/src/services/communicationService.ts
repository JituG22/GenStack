import { io, Socket } from "socket.io-client";

// Communication event types
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

export interface WebRTCRoom {
  id: string;
  sessionId: string;
  name: string;
  createdBy: string;
  createdAt: Date;
  maxParticipants: number;
  isRecording: boolean;
  recordingStartedAt?: Date;
  settings: {
    isPublic: boolean;
    requireApproval: boolean;
    audioEnabled: boolean;
    videoEnabled: boolean;
    screenShareEnabled: boolean;
  };
}

export interface WebRTCPeer {
  id: string;
  userId: string;
  username: string;
  isInitiator: boolean;
  mediaConstraints: {
    audio: boolean;
    video: boolean;
    screen: boolean;
  };
  connectionState: "connecting" | "connected" | "disconnected" | "failed";
  joinedAt: Date;
}

export interface TypingIndicator {
  userId: string;
  username: string;
  sessionId: string;
  timestamp: Date;
}

export interface UserPresence {
  userId: string;
  username: string;
  status: "online" | "away" | "busy" | "offline";
  lastSeen: Date;
  currentSession?: string;
}

class CommunicationService {
  private chatSocket: Socket | null = null;
  private webrtcSocket: Socket | null = null;
  private eventHandlers: Map<string, ((...args: any[]) => void)[]> = new Map();

  // Chat Service Methods
  async connectToChat(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.chatSocket?.connected) {
        resolve();
        return;
      }

      this.chatSocket = io("/chat", {
        auth: { token },
        transports: ["websocket"],
      });

      this.chatSocket.on("connect", () => {
        console.log("Chat socket connected");
        resolve();
      });

      this.chatSocket.on("connect_error", (error) => {
        console.error("Chat socket connection error:", error);
        reject(error);
      });

      this.setupChatEventListeners();
    });
  }

  // WebRTC Service Methods
  async connectToWebRTC(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.webrtcSocket?.connected) {
        resolve();
        return;
      }

      this.webrtcSocket = io("/webrtc", {
        auth: { token },
        transports: ["websocket"],
      });

      this.webrtcSocket.on("connect", () => {
        console.log("WebRTC socket connected");
        resolve();
      });

      this.webrtcSocket.on("connect_error", (error) => {
        console.error("WebRTC socket connection error:", error);
        reject(error);
      });

      this.setupWebRTCEventListeners();
    });
  }

  private setupChatEventListeners(): void {
    if (!this.chatSocket) return;

    // Message events
    this.chatSocket.on("message_received", (message: ChatMessage) => {
      this.emit("message_received", message);
    });

    this.chatSocket.on("message_updated", (message: ChatMessage) => {
      this.emit("message_updated", message);
    });

    this.chatSocket.on("message_deleted", (messageId: string) => {
      this.emit("message_deleted", messageId);
    });

    // Typing indicators
    this.chatSocket.on("user_typing", (indicator: TypingIndicator) => {
      this.emit("user_typing", indicator);
    });

    this.chatSocket.on("user_stopped_typing", (indicator: TypingIndicator) => {
      this.emit("user_stopped_typing", indicator);
    });

    // Presence events
    this.chatSocket.on("user_joined", (presence: UserPresence) => {
      this.emit("user_joined", presence);
    });

    this.chatSocket.on("user_left", (userId: string) => {
      this.emit("user_left", userId);
    });

    this.chatSocket.on("presence_updated", (presence: UserPresence) => {
      this.emit("presence_updated", presence);
    });

    // Thread events
    this.chatSocket.on("thread_created", (thread: ChatThread) => {
      this.emit("thread_created", thread);
    });

    this.chatSocket.on("thread_updated", (thread: ChatThread) => {
      this.emit("thread_updated", thread);
    });
  }

  private setupWebRTCEventListeners(): void {
    if (!this.webrtcSocket) return;

    // Room events
    this.webrtcSocket.on("room-created", (data: any) => {
      console.log("🎥 Room created event received:", data);
      this.emit("room_created", data.room || data);
    });

    this.webrtcSocket.on("room-joined", (data: any) => {
      console.log("🎥 Room joined event received:", data);
      this.emit("room_joined", data);
    });

    this.webrtcSocket.on("room_updated", (room: WebRTCRoom) => {
      this.emit("room_updated", room);
    });

    this.webrtcSocket.on("room_deleted", (roomId: string) => {
      this.emit("room_deleted", roomId);
    });

    // Peer events
    this.webrtcSocket.on("peer_joined", (peer: WebRTCPeer) => {
      this.emit("peer_joined", peer);
    });

    this.webrtcSocket.on("peer_left", (peerId: string) => {
      this.emit("peer_left", peerId);
    });

    this.webrtcSocket.on("peer_updated", (peer: WebRTCPeer) => {
      this.emit("peer_updated", peer);
    });

    // WebRTC signaling
    this.webrtcSocket.on(
      "webrtc_offer",
      (data: { from: string; offer: RTCSessionDescriptionInit }) => {
        console.log("🎥 WebRTC offer received:", data);
        this.emit("webrtc_offer", data);
      }
    );

    this.webrtcSocket.on(
      "webrtc_answer",
      (data: { from: string; answer: RTCSessionDescriptionInit }) => {
        console.log("🎥 WebRTC answer received:", data);
        this.emit("webrtc_answer", data);
      }
    );

    this.webrtcSocket.on(
      "webrtc_ice_candidate",
      (data: { from: string; candidate: RTCIceCandidateInit }) => {
        console.log("🎥 WebRTC ICE candidate received:", data);
        this.emit("webrtc_ice_candidate", data);
      }
    );

    // Error handling
    this.webrtcSocket.on("webrtc-error", (error: any) => {
      console.error("❌ WebRTC error received:", error);
      this.emit("webrtc_error", error);
    });

    this.webrtcSocket.on(
      "call_started",
      (data: { roomId: string; callId: string }) => {
        this.emit("call_started", data);
      }
    );

    this.webrtcSocket.on(
      "call_ended",
      (data: { roomId: string; callId: string }) => {
        this.emit("call_ended", data);
      }
    );

    this.webrtcSocket.on("recording_started", (roomId: string) => {
      this.emit("recording_started", roomId);
    });

    this.webrtcSocket.on("recording_stopped", (roomId: string) => {
      this.emit("recording_stopped", roomId);
    });
  }

  // Chat API Methods
  async sendMessage(
    sessionId: string,
    content: string,
    type: "text" | "code" = "text",
    threadId?: string
  ): Promise<void> {
    if (!this.chatSocket) throw new Error("Chat socket not connected");

    this.chatSocket.emit("send_message", {
      sessionId,
      content,
      type,
      threadId,
    });
  }

  async startTyping(sessionId: string): Promise<void> {
    if (!this.chatSocket) throw new Error("Chat socket not connected");

    // Get user info from localStorage
    const userStr = localStorage.getItem("user");
    if (!userStr) return; // Fail silently for typing indicators

    const user = JSON.parse(userStr);
    const userId = user.id;
    const username =
      `${user.firstName} ${user.lastName}`.trim() ||
      user.email ||
      "Unknown User";

    this.chatSocket.emit("start_typing", {
      sessionId,
      userId,
      username,
    });
  }

  async stopTyping(sessionId: string): Promise<void> {
    if (!this.chatSocket) throw new Error("Chat socket not connected");

    // Get user info from localStorage
    const userStr = localStorage.getItem("user");
    if (!userStr) return; // Fail silently for typing indicators

    const user = JSON.parse(userStr);
    const userId = user.id;

    this.chatSocket.emit("stop_typing", {
      sessionId,
      userId,
    });
  }

  async joinChatSession(sessionId: string): Promise<void> {
    if (!this.chatSocket) throw new Error("Chat socket not connected");

    // Get user info from localStorage
    const userStr = localStorage.getItem("user");
    if (!userStr) throw new Error("User not authenticated");

    const user = JSON.parse(userStr);
    const userId = user.id;
    const username =
      `${user.firstName} ${user.lastName}`.trim() ||
      user.email ||
      "Unknown User";

    this.chatSocket.emit("join_session", {
      sessionId,
      userId,
      username,
    });
  }

  async leaveChatSession(sessionId: string): Promise<void> {
    if (!this.chatSocket) throw new Error("Chat socket not connected");

    // Get user info from localStorage
    const userStr = localStorage.getItem("user");
    if (!userStr) throw new Error("User not authenticated");

    const user = JSON.parse(userStr);
    const userId = user.id;

    this.chatSocket.emit("leave_session", {
      sessionId,
      userId,
    });
  }

  async addReaction(messageId: string, emoji: string): Promise<void> {
    if (!this.chatSocket) throw new Error("Chat socket not connected");

    // Get user info from localStorage
    const userStr = localStorage.getItem("user");
    if (!userStr) throw new Error("User not authenticated");

    const user = JSON.parse(userStr);
    const userId = user.id;
    const username =
      `${user.firstName} ${user.lastName}`.trim() ||
      user.email ||
      "Unknown User";

    this.chatSocket.emit("add_reaction", {
      messageId,
      emoji,
      userId,
      username,
    });
  }

  async removeReaction(messageId: string, emoji: string): Promise<void> {
    if (!this.chatSocket) throw new Error("Chat socket not connected");

    // Get user info from localStorage
    const userStr = localStorage.getItem("user");
    if (!userStr) throw new Error("User not authenticated");

    const user = JSON.parse(userStr);
    const userId = user.id;

    this.chatSocket.emit("remove_reaction", {
      messageId,
      emoji,
      userId,
    });
  }

  async createThread(
    sessionId: string,
    title: string,
    messageId?: string
  ): Promise<void> {
    if (!this.chatSocket) throw new Error("Chat socket not connected");

    // Get user info from localStorage
    const userStr = localStorage.getItem("user");
    if (!userStr) throw new Error("User not authenticated");

    const user = JSON.parse(userStr);
    const userId = user.id;
    const username =
      `${user.firstName} ${user.lastName}`.trim() ||
      user.email ||
      "Unknown User";

    this.chatSocket.emit("create_thread", {
      sessionId,
      title,
      messageId,
      userId,
      username,
    });
  }

  // WebRTC API Methods
  async joinWebRTCRoom(
    roomId: string,
    mediaConstraints: { audio: boolean; video: boolean }
  ): Promise<void> {
    if (!this.webrtcSocket) throw new Error("WebRTC socket not connected");

    // Get user info from localStorage
    const userStr = localStorage.getItem("user");
    if (!userStr) throw new Error("User not authenticated");

    const user = JSON.parse(userStr);
    const userId = user.id;
    const username =
      `${user.firstName} ${user.lastName}`.trim() ||
      user.email ||
      "Unknown User";

    this.webrtcSocket.emit("join_room", {
      roomId,
      mediaConstraints,
      userId,
      username,
    });
  }

  async leaveWebRTCRoom(roomId: string): Promise<void> {
    if (!this.webrtcSocket) throw new Error("WebRTC socket not connected");

    // Get user info from localStorage
    const userStr = localStorage.getItem("user");
    if (!userStr) throw new Error("User not authenticated");

    const user = JSON.parse(userStr);
    const userId = user.id;

    this.webrtcSocket.emit("leave_room", {
      roomId,
      userId,
    });
  }

  async sendWebRTCOffer(
    roomId: string,
    targetPeerId: string,
    offer: RTCSessionDescriptionInit
  ): Promise<void> {
    if (!this.webrtcSocket) throw new Error("WebRTC socket not connected");

    // Get user info from localStorage
    const userStr = localStorage.getItem("user");
    if (!userStr) throw new Error("User not authenticated");

    const user = JSON.parse(userStr);
    const userId = user.id;

    this.webrtcSocket.emit("webrtc_offer", {
      roomId,
      targetPeerId,
      offer,
      fromUserId: userId,
    });
  }

  async sendWebRTCAnswer(
    roomId: string,
    targetPeerId: string,
    answer: RTCSessionDescriptionInit
  ): Promise<void> {
    if (!this.webrtcSocket) throw new Error("WebRTC socket not connected");

    // Get user info from localStorage
    const userStr = localStorage.getItem("user");
    if (!userStr) throw new Error("User not authenticated");

    const user = JSON.parse(userStr);
    const userId = user.id;

    this.webrtcSocket.emit("webrtc_answer", {
      roomId,
      targetPeerId,
      answer,
      fromUserId: userId,
    });
  }

  async sendWebRTCIceCandidate(
    roomId: string,
    targetPeerId: string,
    candidate: RTCIceCandidateInit
  ): Promise<void> {
    if (!this.webrtcSocket) throw new Error("WebRTC socket not connected");

    // Get user info from localStorage
    const userStr = localStorage.getItem("user");
    if (!userStr) throw new Error("User not authenticated");

    const user = JSON.parse(userStr);
    const userId = user.id;

    this.webrtcSocket.emit("webrtc_ice_candidate", {
      roomId,
      targetPeerId,
      candidate,
      fromUserId: userId,
    });
  }

  async createWebRTCRoom(
    sessionId: string,
    name: string,
    settings?: {
      allowScreenShare?: boolean;
      requireMicPermission?: boolean;
      requireVideoPermission?: boolean;
      isPublic?: boolean;
    }
  ): Promise<void> {
    if (!this.webrtcSocket) throw new Error("WebRTC socket not connected");

    // Get user info from localStorage
    const userStr = localStorage.getItem("user");
    if (!userStr) throw new Error("User not authenticated");

    const user = JSON.parse(userStr);
    const userId = user.id;
    const username =
      `${user.firstName} ${user.lastName}`.trim() ||
      user.email ||
      "Unknown User";

    this.webrtcSocket.emit("create_room", {
      sessionId,
      name,
      userId,
      username,
      settings,
    });
  }

  async startCall(roomId: string): Promise<void> {
    if (!this.webrtcSocket) throw new Error("WebRTC socket not connected");

    // Get user info from localStorage
    const userStr = localStorage.getItem("user");
    if (!userStr) throw new Error("User not authenticated");

    const user = JSON.parse(userStr);
    const userId = user.id;

    this.webrtcSocket.emit("initiate_call", { roomId, userId });
  }

  async endCall(roomId: string): Promise<void> {
    if (!this.webrtcSocket) throw new Error("WebRTC socket not connected");

    // Get user info from localStorage
    const userStr = localStorage.getItem("user");
    if (!userStr) throw new Error("User not authenticated");

    const user = JSON.parse(userStr);
    const userId = user.id;

    this.webrtcSocket.emit("end_call", { roomId, userId });
  }

  async startRecording(roomId: string): Promise<void> {
    if (!this.webrtcSocket) throw new Error("WebRTC socket not connected");

    // Get user info from localStorage
    const userStr = localStorage.getItem("user");
    if (!userStr) throw new Error("User not authenticated");

    const user = JSON.parse(userStr);
    const userId = user.id;

    this.webrtcSocket.emit("start_recording", { roomId, userId });
  }

  async stopRecording(roomId: string): Promise<void> {
    if (!this.webrtcSocket) throw new Error("WebRTC socket not connected");

    // Get user info from localStorage
    const userStr = localStorage.getItem("user");
    if (!userStr) throw new Error("User not authenticated");

    const user = JSON.parse(userStr);
    const userId = user.id;

    this.webrtcSocket.emit("stop_recording", { roomId, userId });
  }

  async startScreenShare(roomId: string): Promise<void> {
    if (!this.webrtcSocket) throw new Error("WebRTC socket not connected");

    // Get user info from localStorage
    const userStr = localStorage.getItem("user");
    if (!userStr) throw new Error("User not authenticated");

    const user = JSON.parse(userStr);
    const userId = user.id;

    this.webrtcSocket.emit("start_screen_share", { roomId, userId });
  }

  async stopScreenShare(roomId: string): Promise<void> {
    if (!this.webrtcSocket) throw new Error("WebRTC socket not connected");

    // Get user info from localStorage
    const userStr = localStorage.getItem("user");
    if (!userStr) throw new Error("User not authenticated");

    const user = JSON.parse(userStr);
    const userId = user.id;

    this.webrtcSocket.emit("stop_screen_share", { roomId, userId });
  }

  // Event handling
  on(event: string, handler: (...args: any[]) => void): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  off(event: string, handler: (...args: any[]) => void): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private emit(event: string, ...args: any[]): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => handler(...args));
    }
  }

  // Cleanup
  disconnect(): void {
    if (this.chatSocket) {
      this.chatSocket.disconnect();
      this.chatSocket = null;
    }
    if (this.webrtcSocket) {
      this.webrtcSocket.disconnect();
      this.webrtcSocket = null;
    }
    this.eventHandlers.clear();
  }

  // HTTP API methods
  async getChatMessages(
    sessionId: string,
    limit?: number,
    before?: string
  ): Promise<ChatMessage[]> {
    const response = await fetch(
      `/api/communication/chat/sessions/${sessionId}/messages?${new URLSearchParams(
        {
          ...(limit && { limit: limit.toString() }),
          ...(before && { before }),
        }
      )}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch messages: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data.messages;
  }

  async getChatThreads(sessionId: string): Promise<ChatThread[]> {
    const response = await fetch(
      `/api/communication/chat/sessions/${sessionId}/threads`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch threads: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data.threads;
  }

  async getWebRTCRooms(): Promise<WebRTCRoom[]> {
    const response = await fetch("/api/communication/webrtc/rooms", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch WebRTC rooms: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data.rooms;
  }

  async getWebRTCRoomDetails(
    roomId: string
  ): Promise<{ room: WebRTCRoom; participants: WebRTCPeer[] }> {
    const response = await fetch(`/api/communication/webrtc/rooms/${roomId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch room details: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  }

  async getCommunicationStats(): Promise<any> {
    const response = await fetch("/api/communication/stats", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch communication stats: ${response.statusText}`
      );
    }

    const data = await response.json();
    return data.data;
  }
}

// Create and export singleton instance
export const communicationService = new CommunicationService();
export default communicationService;
