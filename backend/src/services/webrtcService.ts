import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";
import Redis from "ioredis";
import { v4 as uuidv4 } from "uuid";

// WebRTC type definitions for Node.js environment
interface RTCSessionDescriptionInit {
  type: "offer" | "answer" | "pranswer" | "rollback";
  sdp?: string;
}

interface RTCIceCandidateInit {
  candidate?: string;
  sdpMLineIndex?: number | null;
  sdpMid?: string | null;
  usernameFragment?: string | null;
}

interface WebRTCPeer {
  id: string;
  userId: string;
  username: string;
  socketId: string;
  roomId: string;
  isInitiator: boolean;
  mediaConstraints: {
    audio: boolean;
    video: boolean;
    screen: boolean;
  };
  connectionState: "connecting" | "connected" | "disconnected" | "failed";
  joinedAt: Date;
}

interface WebRTCRoom {
  id: string;
  sessionId: string;
  name: string;
  createdBy: string;
  createdAt: Date;
  maxParticipants: number;
  peers: Map<string, WebRTCPeer>;
  isRecording: boolean;
  recordingStartedAt?: Date;
  settings: {
    allowScreenShare: boolean;
    requireMicPermission: boolean;
    requireVideoPermission: boolean;
    isPublic: boolean;
  };
}

interface SignalingMessage {
  type:
    | "offer"
    | "answer"
    | "ice-candidate"
    | "join"
    | "leave"
    | "media-change";
  from: string;
  to: string;
  roomId: string;
  data: any;
  timestamp: Date;
}

interface CallSession {
  id: string;
  roomId: string;
  participants: string[];
  startedAt: Date;
  endedAt?: Date;
  duration?: number;
  recordingUrl?: string;
  callType: "audio" | "video" | "screen";
}

export default class WebRTCService {
  private io: SocketIOServer;
  private webrtcNamespace: any;
  private redis: Redis;
  private rooms: Map<string, WebRTCRoom> = new Map();
  private peers: Map<string, WebRTCPeer> = new Map();
  private callSessions: Map<string, CallSession> = new Map();

  constructor(socketIOServer: SocketIOServer) {
    this.io = socketIOServer;

    // Create a dedicated namespace for WebRTC
    this.webrtcNamespace = this.io.of("/webrtc");

    // Initialize Redis for signaling persistence
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
    this.webrtcNamespace.on("connection", (socket: any) => {
      console.log(`WebRTC client connected: ${socket.id}`);

      // Room management
      socket.on("create_room", this.handleCreateRoom.bind(this, socket));
      socket.on("join_room", this.handleJoinRoom.bind(this, socket));
      socket.on("leave_room", this.handleLeaveRoom.bind(this, socket));

      // WebRTC signaling
      socket.on("webrtc_offer", this.handleWebRTCOffer.bind(this, socket));
      socket.on("webrtc_answer", this.handleWebRTCAnswer.bind(this, socket));
      socket.on(
        "webrtc_ice_candidate",
        this.handleICECandidate.bind(this, socket)
      );

      // Media control
      socket.on("toggle_audio", this.handleToggleAudio.bind(this, socket));
      socket.on("toggle_video", this.handleToggleVideo.bind(this, socket));
      socket.on(
        "start_screen_share",
        this.handleStartScreenShare.bind(this, socket)
      );
      socket.on(
        "stop_screen_share",
        this.handleStopScreenShare.bind(this, socket)
      );

      // Recording
      socket.on(
        "start_recording",
        this.handleStartRecording.bind(this, socket)
      );
      socket.on("stop_recording", this.handleStopRecording.bind(this, socket));

      // Call management
      socket.on("initiate_call", this.handleInitiateCall.bind(this, socket));
      socket.on("accept_call", this.handleAcceptCall.bind(this, socket));
      socket.on("reject_call", this.handleRejectCall.bind(this, socket));
      socket.on("end_call", this.handleEndCall.bind(this, socket));

      // Disconnect
      socket.on("disconnect", this.handleDisconnect.bind(this, socket));
    });
  }

  private async handleCreateRoom(
    socket: any,
    data: {
      sessionId?: string;
      name?: string;
      userId?: string;
      username?: string;
      maxParticipants?: number;
      roomType?: string;
      settings?: any;
    } = {}
  ): Promise<void> {
    try {
      console.log(`🎥 WebRTC create room request:`, {
        socketId: socket.id,
        sessionId: data.sessionId,
        name: data.name,
        userId: data.userId,
        username: data.username,
        maxParticipants: data.maxParticipants,
        roomType: data.roomType,
      });

      const roomId = uuidv4();

      const room: WebRTCRoom = {
        id: roomId,
        sessionId: data.sessionId || `session-${roomId.substring(0, 8)}`,
        name: data.name || `Room-${roomId.substring(0, 8)}`,
        createdBy: data.userId || `anonymous-${socket.id}`,
        createdAt: new Date(),
        maxParticipants: data.maxParticipants || 10,
        peers: new Map(),
        isRecording: false,
        settings: {
          allowScreenShare: true,
          requireMicPermission: false,
          requireVideoPermission: false,
          isPublic: false,
          ...data.settings,
        },
      };

      this.rooms.set(roomId, room);

      // Persist room to Redis
      await this.persistRoom(room);

      socket.emit("room-created", {
        roomId,
        room: this.serializeRoom(room),
      });

      console.log(
        `✅ WebRTC room created: ${roomId} by ${
          data.username || "anonymous"
        } (sessionId: ${room.sessionId})`
      );
    } catch (error) {
      console.error("❌ Error creating WebRTC room:", error);
      socket.emit("webrtc-error", { message: "Failed to create room" });
    }
  }

  private async handleJoinRoom(
    socket: any,
    data: {
      roomId: string;
      userId?: string;
      username?: string;
      mediaConstraints: {
        audio: boolean;
        video: boolean;
        screen?: boolean;
      };
    }
  ): Promise<void> {
    try {
      console.log(`🎥 WebRTC join room request:`, {
        socketId: socket.id,
        roomId: data.roomId,
        userId: data.userId,
        username: data.username,
        mediaConstraints: data.mediaConstraints,
      });

      const room = this.rooms.get(data.roomId);
      if (!room) {
        console.error(`❌ WebRTC room not found: ${data.roomId}`);
        socket.emit("webrtc-error", { message: "Room not found" });
        return;
      }

      if (room.peers.size >= room.maxParticipants) {
        console.error(`❌ WebRTC room is full: ${data.roomId}`);
        socket.emit("webrtc-error", { message: "Room is full" });
        return;
      }

      // Create peer
      const peer: WebRTCPeer = {
        id: uuidv4(),
        userId: data.userId || `anonymous-${socket.id}`,
        username: data.username || `User-${socket.id.substring(0, 8)}`,
        socketId: socket.id,
        roomId: data.roomId,
        isInitiator: room.peers.size === 0,
        mediaConstraints: {
          audio: data.mediaConstraints.audio,
          video: data.mediaConstraints.video,
          screen: data.mediaConstraints.screen || false,
        },
        connectionState: "connecting",
        joinedAt: new Date(),
      };

      room.peers.set(peer.id, peer);
      this.peers.set(socket.id, peer);

      // Join socket room
      socket.join(`webrtc-${data.roomId}`);

      console.log(`✅ Peer joined WebRTC room:`, {
        peerId: peer.id,
        userId: peer.userId,
        username: peer.username,
        roomId: data.roomId,
        totalPeers: room.peers.size,
      });

      // Notify existing peers
      socket.to(`webrtc-${data.roomId}`).emit("peer-joined", {
        peer: this.serializePeer(peer),
        roomId: data.roomId,
      });

      // Send room info to new peer
      socket.emit("room-joined", {
        roomId: data.roomId,
        peer: this.serializePeer(peer),
        existingPeers: Array.from(room.peers.values()).map((p) =>
          this.serializePeer(p)
        ),
        room: this.serializeRoom(room),
      });

      console.log(`User ${data.username} joined WebRTC room ${data.roomId}`);
    } catch (error) {
      console.error("Error joining room:", error);
      socket.emit("webrtc-error", { message: "Failed to join room" });
    }
  }

  private async handleLeaveRoom(
    socket: any,
    data: { roomId: string; userId: string }
  ): Promise<void> {
    try {
      const room = this.rooms.get(data.roomId);
      const peer = this.peers.get(socket.id);

      if (room && peer) {
        room.peers.delete(peer.id);
        this.peers.delete(socket.id);

        socket.leave(`webrtc-${data.roomId}`);

        // Notify other peers
        socket.to(`webrtc-${data.roomId}`).emit("peer-left", {
          peerId: peer.id,
          userId: data.userId,
          roomId: data.roomId,
        });

        // Clean up empty rooms
        if (room.peers.size === 0) {
          this.rooms.delete(data.roomId);
          await this.deleteRoomFromRedis(data.roomId);
        } else {
          await this.updateRoomInRedis(room);
        }

        console.log(`User ${peer.username} left WebRTC room ${data.roomId}`);
      }
    } catch (error) {
      console.error("Error leaving room:", error);
    }
  }

  private async handleWebRTCOffer(
    socket: any,
    data: {
      roomId: string;
      targetPeerId: string;
      offer: RTCSessionDescriptionInit;
    }
  ): Promise<void> {
    try {
      const peer = this.peers.get(socket.id);
      if (!peer) return;

      const signalingMessage: SignalingMessage = {
        type: "offer",
        from: peer.id,
        to: data.targetPeerId,
        roomId: data.roomId,
        data: data.offer,
        timestamp: new Date(),
      };

      // Find target peer's socket
      const targetPeer = Array.from(this.peers.values()).find(
        (p) => p.id === data.targetPeerId
      );
      if (targetPeer) {
        this.webrtcNamespace.to(targetPeer.socketId).emit("webrtc_offer", {
          from: peer.id,
          offer: data.offer,
          fromUser: {
            userId: peer.userId,
            username: peer.username,
          },
        });
      }

      await this.persistSignalingMessage(signalingMessage);
    } catch (error) {
      console.error("Error handling WebRTC offer:", error);
    }
  }

  private async handleWebRTCAnswer(
    socket: any,
    data: {
      roomId: string;
      targetPeerId: string;
      answer: RTCSessionDescriptionInit;
    }
  ): Promise<void> {
    try {
      const peer = this.peers.get(socket.id);
      if (!peer) return;

      const signalingMessage: SignalingMessage = {
        type: "answer",
        from: peer.id,
        to: data.targetPeerId,
        roomId: data.roomId,
        data: data.answer,
        timestamp: new Date(),
      };

      // Find target peer's socket
      const targetPeer = Array.from(this.peers.values()).find(
        (p) => p.id === data.targetPeerId
      );
      if (targetPeer) {
        this.webrtcNamespace.to(targetPeer.socketId).emit("webrtc_answer", {
          from: peer.id,
          answer: data.answer,
          fromUser: {
            userId: peer.userId,
            username: peer.username,
          },
        });
      }

      await this.persistSignalingMessage(signalingMessage);
    } catch (error) {
      console.error("Error handling WebRTC answer:", error);
    }
  }

  private async handleICECandidate(
    socket: any,
    data: {
      roomId: string;
      targetPeerId: string;
      candidate: RTCIceCandidateInit;
    }
  ): Promise<void> {
    try {
      const peer = this.peers.get(socket.id);
      if (!peer) return;

      const signalingMessage: SignalingMessage = {
        type: "ice-candidate",
        from: peer.id,
        to: data.targetPeerId,
        roomId: data.roomId,
        data: data.candidate,
        timestamp: new Date(),
      };

      // Find target peer's socket
      const targetPeer = Array.from(this.peers.values()).find(
        (p) => p.id === data.targetPeerId
      );
      if (targetPeer) {
        this.webrtcNamespace
          .to(targetPeer.socketId)
          .emit("webrtc_ice_candidate", {
            from: peer.id,
            candidate: data.candidate,
          });
      }

      await this.persistSignalingMessage(signalingMessage);
    } catch (error) {
      console.error("Error handling ICE candidate:", error);
    }
  }

  private async handleToggleAudio(
    socket: any,
    data: { roomId: string; enabled: boolean }
  ): Promise<void> {
    try {
      const peer = this.peers.get(socket.id);
      if (!peer) return;

      peer.mediaConstraints.audio = data.enabled;

      socket.to(`webrtc-${data.roomId}`).emit("peer-audio-toggle", {
        peerId: peer.id,
        userId: peer.userId,
        audioEnabled: data.enabled,
      });
    } catch (error) {
      console.error("Error handling toggle audio:", error);
    }
  }

  private async handleToggleVideo(
    socket: any,
    data: { roomId: string; enabled: boolean }
  ): Promise<void> {
    try {
      const peer = this.peers.get(socket.id);
      if (!peer) return;

      peer.mediaConstraints.video = data.enabled;

      socket.to(`webrtc-${data.roomId}`).emit("peer-video-toggle", {
        peerId: peer.id,
        userId: peer.userId,
        videoEnabled: data.enabled,
      });
    } catch (error) {
      console.error("Error handling toggle video:", error);
    }
  }

  private async handleStartScreenShare(
    socket: any,
    data: { roomId: string }
  ): Promise<void> {
    try {
      const peer = this.peers.get(socket.id);
      const room = this.rooms.get(data.roomId);

      if (!peer || !room) return;

      if (!room.settings.allowScreenShare) {
        socket.emit("webrtc-error", {
          message: "Screen sharing not allowed in this room",
        });
        return;
      }

      peer.mediaConstraints.screen = true;

      socket.to(`webrtc-${data.roomId}`).emit("peer-screen-share-start", {
        peerId: peer.id,
        userId: peer.userId,
        username: peer.username,
      });
    } catch (error) {
      console.error("Error handling start screen share:", error);
    }
  }

  private async handleStopScreenShare(
    socket: any,
    data: { roomId: string }
  ): Promise<void> {
    try {
      const peer = this.peers.get(socket.id);
      if (!peer) return;

      peer.mediaConstraints.screen = false;

      socket.to(`webrtc-${data.roomId}`).emit("peer-screen-share-stop", {
        peerId: peer.id,
        userId: peer.userId,
      });
    } catch (error) {
      console.error("Error handling stop screen share:", error);
    }
  }

  private async handleStartRecording(
    socket: any,
    data: { roomId: string }
  ): Promise<void> {
    try {
      const room = this.rooms.get(data.roomId);
      const peer = this.peers.get(socket.id);

      if (!room || !peer) return;

      // Check if user is room creator or has permission
      if (room.createdBy !== peer.userId) {
        socket.emit("webrtc-error", {
          message: "Only room creator can start recording",
        });
        return;
      }

      room.isRecording = true;
      room.recordingStartedAt = new Date();

      this.webrtcNamespace
        .to(`webrtc-${data.roomId}`)
        .emit("recording_started", {
          roomId: data.roomId,
          startedBy: peer.username,
          startedAt: room.recordingStartedAt,
        });

      await this.updateRoomInRedis(room);
    } catch (error) {
      console.error("Error handling start recording:", error);
    }
  }

  private async handleStopRecording(
    socket: any,
    data: { roomId: string }
  ): Promise<void> {
    try {
      const room = this.rooms.get(data.roomId);
      const peer = this.peers.get(socket.id);

      if (!room || !peer) return;

      if (room.createdBy !== peer.userId) {
        socket.emit("webrtc-error", {
          message: "Only room creator can stop recording",
        });
        return;
      }

      room.isRecording = false;
      const recordingDuration = room.recordingStartedAt
        ? new Date().getTime() - room.recordingStartedAt.getTime()
        : 0;

      this.webrtcNamespace
        .to(`webrtc-${data.roomId}`)
        .emit("recording_stopped", {
          roomId: data.roomId,
          stoppedBy: peer.username,
          duration: recordingDuration,
        });

      await this.updateRoomInRedis(room);
    } catch (error) {
      console.error("Error handling stop recording:", error);
    }
  }

  private async handleInitiateCall(
    socket: any,
    data: {
      targetUserId: string;
      callType: "audio" | "video";
      sessionId: string;
    }
  ): Promise<void> {
    try {
      const caller = this.peers.get(socket.id);
      if (!caller) return;

      const callId = uuidv4();
      const callSession: CallSession = {
        id: callId,
        roomId: "", // Will be set when accepted
        participants: [caller.userId, data.targetUserId],
        startedAt: new Date(),
        callType: data.callType,
      };

      this.callSessions.set(callId, callSession);

      // Find target user's socket (this would need integration with user session management)
      // For now, emit to session
      this.io.to(`session-${data.sessionId}`).emit("incoming-call", {
        callId,
        from: {
          userId: caller.userId,
          username: caller.username,
        },
        callType: data.callType,
      });

      socket.emit("call-initiated", { callId });
    } catch (error) {
      console.error("Error handling initiate call:", error);
    }
  }

  private async handleAcceptCall(
    socket: any,
    data: { callId: string }
  ): Promise<void> {
    try {
      const callSession = this.callSessions.get(data.callId);
      if (!callSession) return;

      // Create room for the call
      const roomId = uuidv4();
      callSession.roomId = roomId;

      const room: WebRTCRoom = {
        id: roomId,
        sessionId: "", // From call context
        name: `Call ${callSession.id}`,
        createdBy: callSession.participants[0],
        createdAt: new Date(),
        maxParticipants: 2,
        peers: new Map(),
        isRecording: false,
        settings: {
          allowScreenShare: true,
          requireMicPermission: true,
          requireVideoPermission: callSession.callType === "video",
          isPublic: false,
        },
      };

      this.rooms.set(roomId, room);

      // Notify both participants
      for (const participantId of callSession.participants) {
        this.io.emit("call-accepted", {
          callId: data.callId,
          roomId,
          participantId,
        });
      }
    } catch (error) {
      console.error("Error handling accept call:", error);
    }
  }

  private async handleRejectCall(
    socket: any,
    data: { callId: string }
  ): Promise<void> {
    try {
      const callSession = this.callSessions.get(data.callId);
      if (!callSession) return;

      this.callSessions.delete(data.callId);

      // Notify caller
      for (const participantId of callSession.participants) {
        this.io.emit("call-rejected", {
          callId: data.callId,
          participantId,
        });
      }
    } catch (error) {
      console.error("Error handling reject call:", error);
    }
  }

  private async handleEndCall(
    socket: any,
    data: { callId: string }
  ): Promise<void> {
    try {
      const callSession = this.callSessions.get(data.callId);
      if (!callSession) return;

      callSession.endedAt = new Date();
      callSession.duration =
        callSession.endedAt.getTime() - callSession.startedAt.getTime();

      // Clean up room if it exists
      if (callSession.roomId) {
        this.rooms.delete(callSession.roomId);
      }

      // Notify participants
      for (const participantId of callSession.participants) {
        this.io.emit("call-ended", {
          callId: data.callId,
          duration: callSession.duration,
          participantId,
        });
      }

      this.callSessions.delete(data.callId);
    } catch (error) {
      console.error("Error handling end call:", error);
    }
  }

  private async handleDisconnect(socket: any): Promise<void> {
    try {
      const peer = this.peers.get(socket.id);
      if (!peer) return;

      const room = this.rooms.get(peer.roomId);
      if (room) {
        room.peers.delete(peer.id);

        // Notify other peers
        socket.to(`webrtc-${peer.roomId}`).emit("peer-left", {
          peerId: peer.id,
          userId: peer.userId,
          roomId: peer.roomId,
        });

        // Clean up empty rooms
        if (room.peers.size === 0) {
          this.rooms.delete(peer.roomId);
          await this.deleteRoomFromRedis(peer.roomId);
        } else {
          await this.updateRoomInRedis(room);
        }
      }

      this.peers.delete(socket.id);
      console.log(`WebRTC client disconnected: ${socket.id}`);
    } catch (error) {
      console.error("Error handling disconnect:", error);
    }
  }

  // Helper methods for Redis operations
  private async persistRoom(room: WebRTCRoom): Promise<void> {
    try {
      const key = `webrtc:room:${room.id}`;
      await this.redis.set(key, JSON.stringify(this.serializeRoom(room)));
      await this.redis.expire(key, 24 * 60 * 60); // 24 hours
    } catch (error) {
      console.error("Error persisting room:", error);
    }
  }

  private async updateRoomInRedis(room: WebRTCRoom): Promise<void> {
    try {
      const key = `webrtc:room:${room.id}`;
      await this.redis.set(key, JSON.stringify(this.serializeRoom(room)));
    } catch (error) {
      console.error("Error updating room in Redis:", error);
    }
  }

  private async deleteRoomFromRedis(roomId: string): Promise<void> {
    try {
      const key = `webrtc:room:${roomId}`;
      await this.redis.del(key);
    } catch (error) {
      console.error("Error deleting room from Redis:", error);
    }
  }

  private async persistSignalingMessage(
    message: SignalingMessage
  ): Promise<void> {
    try {
      const key = `webrtc:signaling:${message.roomId}`;
      await this.redis.lpush(key, JSON.stringify(message));
      await this.redis.expire(key, 1 * 60 * 60); // 1 hour
    } catch (error) {
      console.error("Error persisting signaling message:", error);
    }
  }

  private serializeRoom(room: WebRTCRoom): any {
    return {
      id: room.id,
      sessionId: room.sessionId,
      name: room.name,
      createdBy: room.createdBy,
      createdAt: room.createdAt,
      maxParticipants: room.maxParticipants,
      peers: Array.from(room.peers.values()).map((p) => this.serializePeer(p)),
      isRecording: room.isRecording,
      recordingStartedAt: room.recordingStartedAt,
      settings: room.settings,
    };
  }

  private serializePeer(peer: WebRTCPeer): any {
    return {
      id: peer.id,
      userId: peer.userId,
      username: peer.username,
      isInitiator: peer.isInitiator,
      mediaConstraints: peer.mediaConstraints,
      connectionState: peer.connectionState,
      joinedAt: peer.joinedAt,
    };
  }

  private startCleanupTimer(): void {
    // Clean up old rooms and peers every 5 minutes
    setInterval(() => {
      const now = new Date();
      for (const [roomId, room] of this.rooms.entries()) {
        const inactiveTime = now.getTime() - room.createdAt.getTime();
        // Remove rooms inactive for more than 4 hours
        if (inactiveTime > 4 * 60 * 60 * 1000 && room.peers.size === 0) {
          this.rooms.delete(roomId);
          this.deleteRoomFromRedis(roomId);
        }
      }
    }, 5 * 60 * 1000);
  }

  // Public methods for external access
  public getActiveRooms(): WebRTCRoom[] {
    return Array.from(this.rooms.values());
  }

  public getRoom(roomId: string): WebRTCRoom | undefined {
    return this.rooms.get(roomId);
  }

  public getRoomParticipants(roomId: string): WebRTCPeer[] {
    const room = this.rooms.get(roomId);
    return room ? Array.from(room.peers.values()) : [];
  }

  public getCallSessions(): CallSession[] {
    return Array.from(this.callSessions.values());
  }
}
