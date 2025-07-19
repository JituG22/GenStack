import express from "express";
import { auth } from "../middleware/auth";
import { Request, Response } from "express";

const router = express.Router();

// Extended request interface for authenticated requests
interface AuthenticatedRequest extends Request {
  user?: any;
}

// Chat Management Routes

// Get chat session info
router.get(
  "/chat/sessions/:sessionId",
  auth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { sessionId } = req.params;
      const { chatService } = (req as any).app.locals;

      if (!chatService) {
        return res.status(500).json({
          success: false,
          message: "Chat service not available",
        });
      }

      const chatSession = chatService.getChatSession(sessionId);

      if (!chatSession) {
        return res.status(404).json({
          success: false,
          message: "Chat session not found",
        });
      }

      // Check if user has access to this session
      const userParticipant = chatSession.participants.get(
        (req as any).user?.id
      );
      if (!userParticipant) {
        return res.status(403).json({
          success: false,
          message: "Access denied to this chat session",
        });
      }

      return res.json({
        success: true,
        data: {
          sessionId: chatSession.id,
          participants: Array.from(chatSession.participants.values()),
          messageCount: chatSession.messages.length,
          threadCount: chatSession.threads.size,
          createdAt: chatSession.createdAt,
          lastActivity: chatSession.lastActivity,
        },
      });
    } catch (error) {
      console.error("Error fetching chat session:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch chat session",
      });
    }
  }
);

// Get chat message history
router.get(
  "/chat/sessions/:sessionId/messages",
  auth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { sessionId } = req.params;
      const { before, limit = 50 } = req.query;
      const { chatService } = (req as any).app.locals;

      if (!chatService) {
        return res.status(500).json({
          success: false,
          message: "Chat service not available",
        });
      }

      const chatSession = chatService.getOrCreateChatSession(sessionId);

      // For new sessions, create a default participant entry for the requesting user
      if (!chatSession.participants.has((req as any).user?.id)) {
        const user = (req as any).user;
        chatSession.participants.set(user.id, {
          userId: user.id,
          username:
            `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
            user.email ||
            "Unknown User",
          socketId: "", // Will be set when user connects via WebSocket
          isTyping: false,
          lastSeen: new Date(),
          unreadCount: 0,
        });
      }

      // Get messages (this would typically call a method to load from Redis)
      let messages = chatSession.messages;

      if (before) {
        const beforeDate = new Date(before as string);
        messages = messages.filter(
          (msg: any) => new Date(msg.timestamp) < beforeDate
        );
      }

      const limitNum = parseInt(limit as string);
      const paginatedMessages = messages
        .sort(
          (a: any, b: any) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        .slice(0, limitNum);

      return res.json({
        success: true,
        data: {
          messages: paginatedMessages.reverse(),
          hasMore: messages.length > limitNum,
          total: messages.length,
        },
      });
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch chat messages",
      });
    }
  }
);

// Get chat threads
router.get(
  "/chat/sessions/:sessionId/threads",
  auth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { sessionId } = req.params;
      const { chatService } = (req as any).app.locals;

      if (!chatService) {
        return res.status(500).json({
          success: false,
          message: "Chat service not available",
        });
      }

      const chatSession = chatService.getOrCreateChatSession(sessionId);

      // For new sessions, create a default participant entry for the requesting user
      if (!chatSession.participants.has((req as any).user?.id)) {
        const user = (req as any).user;
        chatSession.participants.set(user.id, {
          userId: user.id,
          username:
            `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
            user.email ||
            "Unknown User",
          socketId: "", // Will be set when user connects via WebSocket
          isTyping: false,
          lastSeen: new Date(),
          unreadCount: 0,
        });
      }

      const threads = Array.from(chatSession.threads.values());

      return res.json({
        success: true,
        data: {
          threads: threads.map((thread: any) => ({
            id: thread.id,
            title: thread.title,
            createdBy: thread.createdBy,
            createdAt: thread.createdAt,
            messageCount: thread.messageCount,
            lastActivity: thread.lastActivity,
            participantCount: thread.participants.length,
          })),
        },
      });
    } catch (error) {
      console.error("Error fetching chat threads:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch chat threads",
      });
    }
  }
);

// WebRTC Room Management Routes

// Get active WebRTC rooms
router.get(
  "/webrtc/rooms",
  auth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { webrtcService } = (req as any).app.locals;

      if (!webrtcService) {
        return res.status(500).json({
          success: false,
          message: "WebRTC service not available",
        });
      }

      const rooms = webrtcService.getActiveRooms();

      // Filter rooms user has access to (public rooms or rooms they're part of)
      const accessibleRooms = rooms.filter((room: any) => {
        return (
          room.settings.isPublic ||
          room.createdBy === (req as any).user?.id ||
          Array.from(room.peers.values()).some(
            (peer: any) => peer.userId === (req as any).user?.id
          )
        );
      });

      return res.json({
        success: true,
        data: {
          rooms: accessibleRooms.map((room: any) => ({
            id: room.id,
            sessionId: room.sessionId,
            name: room.name,
            createdBy: room.createdBy,
            createdAt: room.createdAt,
            participantCount: room.peers.size,
            maxParticipants: room.maxParticipants,
            isRecording: room.isRecording,
            settings: room.settings,
          })),
        },
      });
    } catch (error) {
      console.error("Error fetching WebRTC rooms:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch WebRTC rooms",
      });
    }
  }
);

// Get WebRTC room details
router.get(
  "/webrtc/rooms/:roomId",
  auth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { roomId } = req.params;
      const { webrtcService } = (req as any).app.locals;

      if (!webrtcService) {
        return res.status(500).json({
          success: false,
          message: "WebRTC service not available",
        });
      }

      const room = webrtcService.getRoom(roomId);
      if (!room) {
        return res.status(404).json({
          success: false,
          message: "WebRTC room not found",
        });
      }

      // Check access
      const hasAccess =
        room.settings.isPublic ||
        room.createdBy === (req as any).user?.id ||
        Array.from(room.peers.values()).some(
          (peer: any) => peer.userId === (req as any).user?.id
        );

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: "Access denied to this WebRTC room",
        });
      }

      const participants = Array.from(room.peers.values());

      return res.json({
        success: true,
        data: {
          room: {
            id: room.id,
            sessionId: room.sessionId,
            name: room.name,
            createdBy: room.createdBy,
            createdAt: room.createdAt,
            maxParticipants: room.maxParticipants,
            isRecording: room.isRecording,
            recordingStartedAt: room.recordingStartedAt,
            settings: room.settings,
          },
          participants: participants.map((peer: any) => ({
            id: peer.id,
            userId: peer.userId,
            username: peer.username,
            isInitiator: peer.isInitiator,
            mediaConstraints: peer.mediaConstraints,
            connectionState: peer.connectionState,
            joinedAt: peer.joinedAt,
          })),
        },
      });
    } catch (error) {
      console.error("Error fetching WebRTC room details:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch WebRTC room details",
      });
    }
  }
);

// Create WebRTC room
router.post(
  "/webrtc/rooms",
  auth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { sessionId, name, settings } = req.body;

      if (!sessionId || !name) {
        return res.status(400).json({
          success: false,
          message: "Session ID and room name are required",
        });
      }

      // Return success - actual room creation happens via WebSocket
      return res.json({
        success: true,
        message:
          "Room creation initiated. Connect via WebSocket to complete setup.",
        data: {
          sessionId,
          name,
          settings: settings || {},
        },
      });
    } catch (error) {
      console.error("Error creating WebRTC room:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to create WebRTC room",
      });
    }
  }
);

// Communication Statistics
router.get("/stats", auth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { chatService, webrtcService } = (req as any).app.locals;

    const stats = {
      chat: {
        activeSessions: 0,
        totalMessages: 0,
        totalThreads: 0,
        activeParticipants: 0,
      },
      webrtc: {
        activeRooms: 0,
        totalParticipants: 0,
        ongoingCalls: 0,
        recordingSessions: 0,
      },
    };

    if (chatService) {
      const chatSessions = chatService.getActiveChatSessions();
      stats.chat.activeSessions = chatSessions.length;
      stats.chat.totalMessages = chatSessions.reduce(
        (sum: any, session: any) => sum + session.messages.length,
        0
      );
      stats.chat.totalThreads = chatSessions.reduce(
        (sum: any, session: any) => sum + session.threads.size,
        0
      );
      stats.chat.activeParticipants = chatSessions.reduce(
        (sum: any, session: any) => sum + session.participants.size,
        0
      );
    }

    if (webrtcService) {
      const webrtcRooms = webrtcService.getActiveRooms();
      stats.webrtc.activeRooms = webrtcRooms.length;
      stats.webrtc.totalParticipants = webrtcRooms.reduce(
        (sum: any, room: any) => sum + room.peers.size,
        0
      );
      stats.webrtc.recordingSessions = webrtcRooms.filter(
        (room: any) => room.isRecording
      ).length;

      const callSessions = webrtcService.getCallSessions();
      stats.webrtc.ongoingCalls = callSessions.filter(
        (call: any) => !call.endedAt
      ).length;
    }

    return res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching communication stats:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch communication statistics",
    });
  }
});

// Notification endpoints for communication events
router.get(
  "/notifications",
  auth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { type, limit = 20 } = req.query;

      // This would integrate with the existing notification system
      // For now, return empty array as placeholder
      const notifications: any[] = [];

      return res.json({
        success: true,
        data: {
          notifications,
          unreadCount: 0,
          hasMore: false,
        },
      });
    } catch (error) {
      console.error("Error fetching communication notifications:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch communication notifications",
      });
    }
  }
);

// Mark communication notifications as read
router.post(
  "/notifications/mark-read",
  auth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { notificationIds } = req.body;
      const userId = (req as any).user?.id;

      // This would integrate with the existing notification system
      // For now, return success

      return res.json({
        success: true,
        message: "Notifications marked as read",
      });
    } catch (error) {
      console.error("Error marking notifications as read:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to mark notifications as read",
      });
    }
  }
);

export default router;
