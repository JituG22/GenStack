import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";
import Redis from "ioredis";
import { v4 as uuidv4 } from "uuid";

interface ChatMessage {
  id: string;
  sessionId: string;
  userId: string;
  username: string;
  content: string;
  type: "text" | "code" | "system" | "reaction";
  timestamp: Date;
  threadId?: string;
  parentMessageId?: string;
  codeSnippet?: {
    language: string;
    code: string;
    fileName?: string;
    lineNumbers?: {
      start: number;
      end: number;
    };
  };
  reactions?: Array<{
    emoji: string;
    userId: string;
    username: string;
  }>;
  mentions?: string[];
  edited?: boolean;
  editedAt?: Date;
}

interface ChatThread {
  id: string;
  sessionId: string;
  title: string;
  createdBy: string;
  createdAt: Date;
  messageCount: number;
  lastActivity: Date;
  participants: string[];
}

interface ChatSession {
  id: string;
  sessionId: string;
  participants: Map<string, ChatParticipant>;
  messages: ChatMessage[];
  threads: Map<string, ChatThread>;
  createdAt: Date;
  lastActivity: Date;
}

interface ChatParticipant {
  userId: string;
  username: string;
  socketId: string;
  isTyping: boolean;
  lastSeen: Date;
  unreadCount: number;
}

interface TypingIndicator {
  userId: string;
  username: string;
  sessionId: string;
  timestamp: Date;
}

export default class RealtimeChatService {
  private io: SocketIOServer;
  private chatNamespace: any;
  private redis: Redis;
  private chatSessions: Map<string, ChatSession> = new Map();
  private typingIndicators: Map<string, TypingIndicator> = new Map();
  private messageHistory: Map<string, ChatMessage[]> = new Map();

  constructor(socketIOServer: SocketIOServer) {
    this.io = socketIOServer;

    // Create a dedicated namespace for chat
    this.chatNamespace = this.io.of("/chat");

    // Initialize Redis for message persistence
    this.redis = new Redis({
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379"),
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
    });

    this.setupEventHandlers();
    this.startCleanupTimer();
  }

  private setupEventHandlers(): void {
    this.chatNamespace.on("connection", (socket: any) => {
      console.log(`Chat client connected: ${socket.id}`);

      // Join chat session
      socket.on("join_session", this.handleJoinChat.bind(this, socket));

      // Leave chat session
      socket.on("leave_session", this.handleLeaveChat.bind(this, socket));

      // Send message
      socket.on("send_message", this.handleSendMessage.bind(this, socket));

      // Typing indicators
      socket.on("start_typing", this.handleTypingStart.bind(this, socket));
      socket.on("stop_typing", this.handleTypingStop.bind(this, socket));

      // Message reactions
      socket.on("add_reaction", this.handleAddReaction.bind(this, socket));
      socket.on(
        "remove_reaction",
        this.handleRemoveReaction.bind(this, socket)
      );

      // Message editing
      socket.on("edit_message", this.handleEditMessage.bind(this, socket));
      socket.on("delete_message", this.handleDeleteMessage.bind(this, socket));

      // Thread management
      socket.on("create_thread", this.handleCreateThread.bind(this, socket));
      socket.on("join_thread", this.handleJoinThread.bind(this, socket));

      // Message history
      socket.on("load_history", this.handleLoadHistory.bind(this, socket));

      // Disconnect
      socket.on("disconnect", this.handleDisconnect.bind(this, socket));
    });
  }

  private async handleJoinChat(
    socket: any,
    data: { sessionId: string; userId: string; username: string }
  ): Promise<void> {
    try {
      const { sessionId, userId, username } = data;

      // Create or get chat session
      if (!this.chatSessions.has(sessionId)) {
        this.chatSessions.set(sessionId, {
          id: sessionId,
          sessionId,
          participants: new Map(),
          messages: [],
          threads: new Map(),
          createdAt: new Date(),
          lastActivity: new Date(),
        });
      }

      const chatSession = this.chatSessions.get(sessionId)!;

      // Add participant
      const participant: ChatParticipant = {
        userId,
        username,
        socketId: socket.id,
        isTyping: false,
        lastSeen: new Date(),
        unreadCount: 0,
      };

      chatSession.participants.set(userId, participant);
      socket.join(`chat-${sessionId}`);

      // Load recent message history
      const recentMessages = await this.loadRecentMessages(sessionId, 50);

      // Send welcome data
      socket.emit("chat-joined", {
        sessionId,
        participants: Array.from(chatSession.participants.values()),
        recentMessages,
        threads: Array.from(chatSession.threads.values()),
      });

      // Notify other participants
      socket.to(`chat-${sessionId}`).emit("participant-joined", {
        participant: {
          userId,
          username,
          joinedAt: new Date(),
        },
      });

      console.log(`User ${username} joined chat session ${sessionId}`);
    } catch (error) {
      console.error("Error handling join chat:", error);
      socket.emit("chat-error", { message: "Failed to join chat session" });
    }
  }

  private async handleLeaveChat(
    socket: any,
    data: { sessionId: string; userId: string }
  ): Promise<void> {
    try {
      const { sessionId, userId } = data;
      const chatSession = this.chatSessions.get(sessionId);

      if (chatSession) {
        chatSession.participants.delete(userId);
        socket.leave(`chat-${sessionId}`);

        // Notify other participants
        socket.to(`chat-${sessionId}`).emit("participant-left", { userId });

        // Clean up empty sessions
        if (chatSession.participants.size === 0) {
          this.chatSessions.delete(sessionId);
        }
      }
    } catch (error) {
      console.error("Error handling leave chat:", error);
    }
  }

  private async handleSendMessage(
    socket: any,
    data: {
      sessionId: string;
      content: string;
      type?: "text" | "code" | "system";
      threadId?: string;
      parentMessageId?: string;
      codeSnippet?: any;
      mentions?: string[];
    }
  ): Promise<void> {
    try {
      const chatSession = this.chatSessions.get(data.sessionId);
      if (!chatSession) {
        socket.emit("chat-error", { message: "Chat session not found" });
        return;
      }

      const participant = Array.from(chatSession.participants.values()).find(
        (p) => p.socketId === socket.id
      );

      if (!participant) {
        socket.emit("chat-error", { message: "Participant not found" });
        return;
      }

      const message: ChatMessage = {
        id: uuidv4(),
        sessionId: data.sessionId,
        userId: participant.userId,
        username: participant.username,
        content: data.content,
        type: data.type || "text",
        timestamp: new Date(),
        threadId: data.threadId,
        parentMessageId: data.parentMessageId,
        codeSnippet: data.codeSnippet,
        reactions: [],
        mentions: data.mentions || [],
        edited: false,
      };

      // Add to session messages
      chatSession.messages.push(message);
      chatSession.lastActivity = new Date();

      // Persist message to Redis
      await this.persistMessage(message);

      // Broadcast message to all participants
      this.chatNamespace
        .to(`chat-${data.sessionId}`)
        .emit("message_received", message);

      // Handle mentions - send notifications
      if (message.mentions && message.mentions.length > 0) {
        this.handleMentionNotifications(message);
      }

      // Update thread if applicable
      if (data.threadId) {
        this.updateThreadActivity(data.sessionId, data.threadId);
      }

      console.log(
        `Message sent in session ${data.sessionId}: ${message.content.substring(
          0,
          50
        )}...`
      );
    } catch (error) {
      console.error("Error handling send message:", error);
      socket.emit("chat-error", { message: "Failed to send message" });
    }
  }

  private async handleTypingStart(
    socket: any,
    data: { sessionId: string; userId: string; username: string }
  ): Promise<void> {
    try {
      const typingKey = `${data.sessionId}:${data.userId}`;

      this.typingIndicators.set(typingKey, {
        userId: data.userId,
        username: data.username,
        sessionId: data.sessionId,
        timestamp: new Date(),
      });

      // Broadcast typing indicator to other participants
      socket.to(`chat-${data.sessionId}`).emit("user_typing", {
        userId: data.userId,
        username: data.username,
      });

      // Auto-clear typing indicator after 3 seconds
      setTimeout(() => {
        if (this.typingIndicators.has(typingKey)) {
          this.typingIndicators.delete(typingKey);
          socket.to(`chat-${data.sessionId}`).emit("user_stopped_typing", {
            userId: data.userId,
          });
        }
      }, 3000);
    } catch (error) {
      console.error("Error handling typing start:", error);
    }
  }

  private async handleTypingStop(
    socket: any,
    data: { sessionId: string; userId: string }
  ): Promise<void> {
    try {
      const typingKey = `${data.sessionId}:${data.userId}`;
      this.typingIndicators.delete(typingKey);

      socket.to(`chat-${data.sessionId}`).emit("user_stopped_typing", {
        userId: data.userId,
      });
    } catch (error) {
      console.error("Error handling typing stop:", error);
    }
  }

  private async handleAddReaction(
    socket: any,
    data: {
      sessionId: string;
      messageId: string;
      emoji: string;
      userId: string;
      username: string;
    }
  ): Promise<void> {
    try {
      const chatSession = this.chatSessions.get(data.sessionId);
      if (!chatSession) return;

      const message = chatSession.messages.find((m) => m.id === data.messageId);
      if (!message) return;

      // Add or update reaction
      if (!message.reactions) message.reactions = [];

      const existingReaction = message.reactions.find(
        (r) => r.emoji === data.emoji && r.userId === data.userId
      );

      if (!existingReaction) {
        message.reactions.push({
          emoji: data.emoji,
          userId: data.userId,
          username: data.username,
        });

        // Update in Redis
        await this.updateMessageInRedis(message);

        // Broadcast reaction
        this.chatNamespace.to(`chat-${data.sessionId}`).emit("reaction_added", {
          messageId: data.messageId,
          reaction: {
            emoji: data.emoji,
            userId: data.userId,
            username: data.username,
          },
        });
      }
    } catch (error) {
      console.error("Error handling add reaction:", error);
    }
  }

  private async handleRemoveReaction(
    socket: any,
    data: {
      sessionId: string;
      messageId: string;
      emoji: string;
      userId: string;
    }
  ): Promise<void> {
    try {
      const chatSession = this.chatSessions.get(data.sessionId);
      if (!chatSession) return;

      const message = chatSession.messages.find((m) => m.id === data.messageId);
      if (!message || !message.reactions) return;

      // Remove reaction
      message.reactions = message.reactions.filter(
        (r) => !(r.emoji === data.emoji && r.userId === data.userId)
      );

      // Update in Redis
      await this.updateMessageInRedis(message);

      // Broadcast reaction removal
      this.chatNamespace.to(`chat-${data.sessionId}`).emit("reaction_removed", {
        messageId: data.messageId,
        emoji: data.emoji,
        userId: data.userId,
      });
    } catch (error) {
      console.error("Error handling remove reaction:", error);
    }
  }

  private async handleEditMessage(
    socket: any,
    data: {
      sessionId: string;
      messageId: string;
      newContent: string;
      userId: string;
    }
  ): Promise<void> {
    try {
      const chatSession = this.chatSessions.get(data.sessionId);
      if (!chatSession) return;

      const message = chatSession.messages.find((m) => m.id === data.messageId);
      if (!message || message.userId !== data.userId) return;

      // Update message
      message.content = data.newContent;
      message.edited = true;
      message.editedAt = new Date();

      // Update in Redis
      await this.updateMessageInRedis(message);

      // Broadcast edit
      this.chatNamespace.to(`chat-${data.sessionId}`).emit("message_updated", {
        messageId: data.messageId,
        newContent: data.newContent,
        editedAt: message.editedAt,
      });
    } catch (error) {
      console.error("Error handling edit message:", error);
    }
  }

  private async handleDeleteMessage(
    socket: any,
    data: {
      sessionId: string;
      messageId: string;
      userId: string;
    }
  ): Promise<void> {
    try {
      const chatSession = this.chatSessions.get(data.sessionId);
      if (!chatSession) return;

      const messageIndex = chatSession.messages.findIndex(
        (m) => m.id === data.messageId
      );
      if (messageIndex === -1) return;

      const message = chatSession.messages[messageIndex];
      if (message.userId !== data.userId) return;

      // Remove message
      chatSession.messages.splice(messageIndex, 1);

      // Remove from Redis
      await this.deleteMessageFromRedis(data.messageId);

      // Broadcast deletion
      this.chatNamespace.to(`chat-${data.sessionId}`).emit("message_deleted", {
        messageId: data.messageId,
      });
    } catch (error) {
      console.error("Error handling delete message:", error);
    }
  }

  private async handleCreateThread(
    socket: any,
    data: {
      sessionId: string;
      title: string;
      messageId?: string;
      userId: string;
      username: string;
    }
  ): Promise<void> {
    try {
      const chatSession = this.chatSessions.get(data.sessionId);
      if (!chatSession) return;

      const thread: ChatThread = {
        id: uuidv4(),
        sessionId: data.sessionId,
        title: data.title,
        createdBy: data.userId,
        createdAt: new Date(),
        messageCount: 0,
        lastActivity: new Date(),
        participants: [data.userId],
      };

      chatSession.threads.set(thread.id, thread);

      // Persist thread
      await this.persistThread(thread);

      // Broadcast thread creation
      this.chatNamespace
        .to(`chat-${data.sessionId}`)
        .emit("thread_created", thread);
    } catch (error) {
      console.error("Error handling create thread:", error);
    }
  }

  private async handleJoinThread(
    socket: any,
    data: {
      sessionId: string;
      threadId: string;
      userId: string;
    }
  ): Promise<void> {
    try {
      const chatSession = this.chatSessions.get(data.sessionId);
      if (!chatSession) return;

      const thread = chatSession.threads.get(data.threadId);
      if (!thread) return;

      if (!thread.participants.includes(data.userId)) {
        thread.participants.push(data.userId);
        await this.updateThreadInRedis(thread);
      }

      socket.join(`thread-${data.threadId}`);

      // Load thread messages
      const threadMessages = await this.loadThreadMessages(data.threadId);
      socket.emit("thread-joined", {
        threadId: data.threadId,
        messages: threadMessages,
      });
    } catch (error) {
      console.error("Error handling join thread:", error);
    }
  }

  private async handleLoadHistory(
    socket: any,
    data: {
      sessionId: string;
      before?: Date;
      limit?: number;
    }
  ): Promise<void> {
    try {
      const limit = data.limit || 50;
      const messages = await this.loadMessageHistory(
        data.sessionId,
        data.before,
        limit
      );

      socket.emit("history-loaded", {
        sessionId: data.sessionId,
        messages,
        hasMore: messages.length === limit,
      });
    } catch (error) {
      console.error("Error handling load history:", error);
    }
  }

  private async handleDisconnect(socket: any): Promise<void> {
    try {
      // Clean up typing indicators
      for (const [key, indicator] of this.typingIndicators.entries()) {
        if (key.includes(socket.id)) {
          this.typingIndicators.delete(key);
          socket.to(`chat-${indicator.sessionId}`).emit("typing-stop", {
            userId: indicator.userId,
          });
        }
      }

      // Update participant status in all sessions
      for (const [sessionId, chatSession] of this.chatSessions.entries()) {
        for (const [
          userId,
          participant,
        ] of chatSession.participants.entries()) {
          if (participant.socketId === socket.id) {
            chatSession.participants.delete(userId);
            socket.to(`chat-${sessionId}`).emit("participant-left", { userId });

            // Clean up empty sessions
            if (chatSession.participants.size === 0) {
              this.chatSessions.delete(sessionId);
            }
            break;
          }
        }
      }

      console.log(`Chat client disconnected: ${socket.id}`);
    } catch (error) {
      console.error("Error handling disconnect:", error);
    }
  }

  // Helper methods for Redis operations
  private async persistMessage(message: ChatMessage): Promise<void> {
    try {
      const key = `chat:messages:${message.sessionId}`;
      await this.redis.lpush(key, JSON.stringify(message));
      await this.redis.expire(key, 30 * 24 * 60 * 60); // 30 days
    } catch (error) {
      console.error("Error persisting message:", error);
    }
  }

  private async updateMessageInRedis(message: ChatMessage): Promise<void> {
    try {
      const key = `chat:message:${message.id}`;
      await this.redis.set(key, JSON.stringify(message));
      await this.redis.expire(key, 30 * 24 * 60 * 60); // 30 days
    } catch (error) {
      console.error("Error updating message in Redis:", error);
    }
  }

  private async deleteMessageFromRedis(messageId: string): Promise<void> {
    try {
      const key = `chat:message:${messageId}`;
      await this.redis.del(key);
    } catch (error) {
      console.error("Error deleting message from Redis:", error);
    }
  }

  private async persistThread(thread: ChatThread): Promise<void> {
    try {
      const key = `chat:thread:${thread.id}`;
      await this.redis.set(key, JSON.stringify(thread));
      await this.redis.expire(key, 30 * 24 * 60 * 60); // 30 days
    } catch (error) {
      console.error("Error persisting thread:", error);
    }
  }

  private async updateThreadInRedis(thread: ChatThread): Promise<void> {
    try {
      const key = `chat:thread:${thread.id}`;
      await this.redis.set(key, JSON.stringify(thread));
    } catch (error) {
      console.error("Error updating thread in Redis:", error);
    }
  }

  private async loadRecentMessages(
    sessionId: string,
    limit: number
  ): Promise<ChatMessage[]> {
    try {
      const key = `chat:messages:${sessionId}`;
      const messages = await this.redis.lrange(key, 0, limit - 1);
      return messages.map((msg) => JSON.parse(msg)).reverse();
    } catch (error) {
      console.error("Error loading recent messages:", error);
      return [];
    }
  }

  private async loadMessageHistory(
    sessionId: string,
    before?: Date,
    limit: number = 50
  ): Promise<ChatMessage[]> {
    try {
      const key = `chat:messages:${sessionId}`;
      const messages = await this.redis.lrange(key, 0, -1);

      let parsedMessages = messages.map((msg) => JSON.parse(msg));

      if (before) {
        parsedMessages = parsedMessages.filter(
          (msg) => new Date(msg.timestamp) < before
        );
      }

      return parsedMessages
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        .slice(0, limit);
    } catch (error) {
      console.error("Error loading message history:", error);
      return [];
    }
  }

  private async loadThreadMessages(threadId: string): Promise<ChatMessage[]> {
    try {
      const key = `chat:thread:messages:${threadId}`;
      const messages = await this.redis.lrange(key, 0, -1);
      return messages.map((msg) => JSON.parse(msg)).reverse();
    } catch (error) {
      console.error("Error loading thread messages:", error);
      return [];
    }
  }

  private updateThreadActivity(sessionId: string, threadId: string): void {
    const chatSession = this.chatSessions.get(sessionId);
    if (!chatSession) return;

    const thread = chatSession.threads.get(threadId);
    if (!thread) return;

    thread.messageCount++;
    thread.lastActivity = new Date();
    this.updateThreadInRedis(thread);
  }

  private handleMentionNotifications(message: ChatMessage): void {
    // Implementation for mention notifications
    // This would integrate with the existing notification system
    console.log(
      `Handling mentions for message ${message.id}:`,
      message.mentions
    );
  }

  private startCleanupTimer(): void {
    // Clean up old typing indicators every 30 seconds
    setInterval(() => {
      const now = new Date();
      for (const [key, indicator] of this.typingIndicators.entries()) {
        if (now.getTime() - indicator.timestamp.getTime() > 5000) {
          this.typingIndicators.delete(key);
        }
      }
    }, 30000);
  }

  // Public methods for external access
  public getActiveChatSessions(): ChatSession[] {
    return Array.from(this.chatSessions.values());
  }

  public getChatSession(sessionId: string): ChatSession | undefined {
    return this.chatSessions.get(sessionId);
  }

  public getSessionParticipants(sessionId: string): ChatParticipant[] {
    const session = this.chatSessions.get(sessionId);
    return session ? Array.from(session.participants.values()) : [];
  }
}
