import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  WebRTCRoom,
  WebRTCPeer,
  communicationService,
} from "../services/communicationService";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Monitor,
  MonitorStop,
  Users,
  Settings,
  MoreVertical,
  Maximize2,
  Minimize2,
} from "lucide-react";

interface WebRTCComponentProps {
  currentUserId: string;
  className?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface PeerConnection {
  id: string;
  userId: string;
  username: string;
  connection: RTCPeerConnection;
  localStream?: MediaStream;
  remoteStream?: MediaStream;
  isInitiator: boolean;
}

const WebRTCComponent: React.FC<WebRTCComponentProps> = ({
  currentUserId,
  className = "",
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const [rooms, setRooms] = useState<WebRTCRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<WebRTCRoom | null>(null);
  const [peers, setPeers] = useState<WebRTCPeer[]>([]);
  const [peerConnections, setPeerConnections] = useState<
    Map<string, PeerConnection>
  >(new Map());
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideosRef = useRef<Map<string, HTMLVideoElement>>(new Map());

  // WebRTC configuration
  const rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  };

  // Initialize WebRTC connection
  useEffect(() => {
    const initializeWebRTC = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No authentication token found");
        }

        await communicationService.connectToWebRTC(token);
        const roomsData = await communicationService.getWebRTCRooms();
        setRooms(roomsData);
        setIsConnected(true);
      } catch (err) {
        console.error("Failed to initialize WebRTC:", err);
        setError(
          err instanceof Error ? err.message : "Failed to connect to WebRTC"
        );
      } finally {
        setLoading(false);
      }
    };

    initializeWebRTC();
  }, []);

  // Set up WebRTC event listeners
  useEffect(() => {
    const handleRoomCreated = (room: WebRTCRoom) => {
      setRooms((prev) => [...prev, room]);
    };

    const handleRoomUpdated = (room: WebRTCRoom) => {
      setRooms((prev) => prev.map((r) => (r.id === room.id ? room : r)));
      if (activeRoom?.id === room.id) {
        setActiveRoom(room);
      }
    };

    const handleRoomDeleted = (roomId: string) => {
      setRooms((prev) => prev.filter((r) => r.id !== roomId));
      if (activeRoom?.id === roomId) {
        setActiveRoom(null);
        leaveCall();
      }
    };

    const handlePeerJoined = (peer: WebRTCPeer) => {
      setPeers((prev) => [...prev, peer]);
      if (localStream && peer.userId !== currentUserId) {
        createPeerConnection(peer);
      }
    };

    const handlePeerLeft = (peerId: string) => {
      setPeers((prev) => prev.filter((p) => p.id !== peerId));

      // Clean up peer connection
      const peerConnection = peerConnections.get(peerId);
      if (peerConnection) {
        peerConnection.connection.close();
        setPeerConnections((prev) => {
          const newMap = new Map(prev);
          newMap.delete(peerId);
          return newMap;
        });
      }
    };

    const handlePeerUpdated = (peer: WebRTCPeer) => {
      setPeers((prev) => prev.map((p) => (p.id === peer.id ? peer : p)));
    };

    const handleWebRTCOffer = async (data: {
      from: string;
      offer: RTCSessionDescriptionInit;
    }) => {
      const peer = peers.find((p) => p.userId === data.from);
      if (!peer) return;

      const peerConnection = peerConnections.get(peer.id);
      if (!peerConnection) return;

      try {
        await peerConnection.connection.setRemoteDescription(data.offer);
        const answer = await peerConnection.connection.createAnswer();
        await peerConnection.connection.setLocalDescription(answer);

        await communicationService.sendWebRTCAnswer(
          activeRoom!.id,
          peer.id,
          answer
        );
      } catch (err) {
        console.error("Error handling WebRTC offer:", err);
      }
    };

    const handleWebRTCAnswer = async (data: {
      from: string;
      answer: RTCSessionDescriptionInit;
    }) => {
      const peer = peers.find((p) => p.userId === data.from);
      if (!peer) return;

      const peerConnection = peerConnections.get(peer.id);
      if (!peerConnection) return;

      try {
        await peerConnection.connection.setRemoteDescription(data.answer);
      } catch (err) {
        console.error("Error handling WebRTC answer:", err);
      }
    };

    const handleWebRTCIceCandidate = async (data: {
      from: string;
      candidate: RTCIceCandidateInit;
    }) => {
      const peer = peers.find((p) => p.userId === data.from);
      if (!peer) return;

      const peerConnection = peerConnections.get(peer.id);
      if (!peerConnection) return;

      try {
        await peerConnection.connection.addIceCandidate(data.candidate);
      } catch (err) {
        console.error("Error handling ICE candidate:", err);
      }
    };

    const handleCallStarted = (data: { roomId: string; callId: string }) => {
      if (activeRoom?.id === data.roomId) {
        setIsInCall(true);
      }
    };

    const handleCallEnded = (data: { roomId: string; callId: string }) => {
      if (activeRoom?.id === data.roomId) {
        setIsInCall(false);
        leaveCall();
      }
    };

    // Register event listeners
    communicationService.on("room_created", handleRoomCreated);
    communicationService.on("room_updated", handleRoomUpdated);
    communicationService.on("room_deleted", handleRoomDeleted);
    communicationService.on("peer_joined", handlePeerJoined);
    communicationService.on("peer_left", handlePeerLeft);
    communicationService.on("peer_updated", handlePeerUpdated);
    communicationService.on("webrtc_offer", handleWebRTCOffer);
    communicationService.on("webrtc_answer", handleWebRTCAnswer);
    communicationService.on("webrtc_ice_candidate", handleWebRTCIceCandidate);
    communicationService.on("call_started", handleCallStarted);
    communicationService.on("call_ended", handleCallEnded);

    return () => {
      // Cleanup event listeners
      communicationService.off("room_created", handleRoomCreated);
      communicationService.off("room_updated", handleRoomUpdated);
      communicationService.off("room_deleted", handleRoomDeleted);
      communicationService.off("peer_joined", handlePeerJoined);
      communicationService.off("peer_left", handlePeerLeft);
      communicationService.off("peer_updated", handlePeerUpdated);
      communicationService.off("webrtc_offer", handleWebRTCOffer);
      communicationService.off("webrtc_answer", handleWebRTCAnswer);
      communicationService.off(
        "webrtc_ice_candidate",
        handleWebRTCIceCandidate
      );
      communicationService.off("call_started", handleCallStarted);
      communicationService.off("call_ended", handleCallEnded);
    };
  }, [activeRoom, peers, peerConnections, localStream, currentUserId]);

  // Create peer connection
  const createPeerConnection = useCallback(
    async (peer: WebRTCPeer) => {
      if (!localStream || !activeRoom) return;

      const connection = new RTCPeerConnection(rtcConfig);

      // Add local stream to connection
      localStream.getTracks().forEach((track) => {
        connection.addTrack(track, localStream);
      });

      // Handle ICE candidates
      connection.onicecandidate = (event) => {
        if (event.candidate && activeRoom) {
          communicationService.sendWebRTCIceCandidate(
            activeRoom.id,
            peer.id,
            event.candidate
          );
        }
      };

      // Handle remote stream
      connection.ontrack = (event) => {
        const remoteVideo = remoteVideosRef.current.get(peer.id);
        if (remoteVideo && event.streams[0]) {
          remoteVideo.srcObject = event.streams[0];
        }
      };

      const peerConnection: PeerConnection = {
        id: peer.id,
        userId: peer.userId,
        username: peer.username,
        connection,
        localStream,
        isInitiator: peer.userId > currentUserId, // Simple rule to determine initiator
      };

      setPeerConnections((prev) => new Map(prev).set(peer.id, peerConnection));

      // If we're the initiator, create offer
      if (peerConnection.isInitiator) {
        try {
          const offer = await connection.createOffer();
          await connection.setLocalDescription(offer);
          await communicationService.sendWebRTCOffer(
            activeRoom.id,
            peer.id,
            offer
          );
        } catch (err) {
          console.error("Error creating offer:", err);
        }
      }
    },
    [localStream, activeRoom, currentUserId]
  );

  // Get user media
  const getUserMedia = async (audio: boolean, video: boolean) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio,
        video,
      });
      setLocalStream(stream);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      return stream;
    } catch (err) {
      console.error("Error accessing media devices:", err);
      throw new Error("Failed to access camera/microphone");
    }
  };

  // Join room
  const joinRoom = async (room: WebRTCRoom) => {
    try {
      await getUserMedia(isAudioEnabled, isVideoEnabled);
      await communicationService.joinWebRTCRoom(room.id, {
        audio: isAudioEnabled,
        video: isVideoEnabled,
      });

      const roomDetails = await communicationService.getWebRTCRoomDetails(
        room.id
      );
      setActiveRoom(room);
      setPeers(roomDetails.participants);

      // Create peer connections for existing participants
      roomDetails.participants.forEach((peer) => {
        if (peer.userId !== currentUserId) {
          createPeerConnection(peer);
        }
      });
    } catch (err) {
      console.error("Failed to join room:", err);
      setError("Failed to join room");
    }
  };

  // Leave call
  const leaveCall = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }

    peerConnections.forEach((peer) => {
      peer.connection.close();
    });
    setPeerConnections(new Map());

    if (activeRoom) {
      communicationService.leaveWebRTCRoom(activeRoom.id);
    }

    setActiveRoom(null);
    setPeers([]);
    setIsInCall(false);
    setIsScreenSharing(false);
  }, [localStream, peerConnections, activeRoom]);

  // Toggle audio
  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  // Toggle screen sharing
  const toggleScreenShare = async () => {
    if (!activeRoom) return;

    try {
      if (isScreenSharing) {
        await communicationService.stopScreenShare(activeRoom.id);
        setIsScreenSharing(false);
      } else {
        await communicationService.startScreenShare(activeRoom.id);
        setIsScreenSharing(true);
      }
    } catch (err) {
      console.error("Error toggling screen share:", err);
    }
  };

  // Create new room
  const createRoom = async (name: string) => {
    try {
      const room = await communicationService.createWebRTCRoom(name, {
        isPublic: true,
        requireApproval: false,
        audioEnabled: true,
        videoEnabled: true,
        screenShareEnabled: true,
      });
      setRooms((prev) => [...prev, room]);
      return room;
    } catch (err) {
      console.error("Failed to create room:", err);
      throw err;
    }
  };

  if (isCollapsed) {
    return (
      <div className={`bg-white border-l border-gray-200 ${className}`}>
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={onToggleCollapse}
            className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            <Video className="h-4 w-4" />
            <span>Video Call</span>
            {isInCall && (
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            )}
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        className={`bg-white border-l border-gray-200 ${className} flex items-center justify-center`}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">
            Connecting to video service...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`bg-white border-l border-gray-200 ${className} flex items-center justify-center`}
      >
        <div className="text-center p-4">
          <p className="text-sm text-red-600 mb-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white border-l border-gray-200 flex flex-col ${className} ${
        isFullscreen ? "fixed inset-0 z-50" : ""
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {onToggleCollapse && !isFullscreen && (
              <button
                onClick={onToggleCollapse}
                className="text-gray-500 hover:text-gray-700"
              >
                <Video className="h-4 w-4" />
              </button>
            )}
            <h3 className="text-sm font-medium text-gray-900">
              {activeRoom ? `Call: ${activeRoom.name}` : "Video Calls"}
            </h3>
            <div className="flex items-center space-x-1">
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <span className="text-xs text-gray-500">
                {peers.length} participant{peers.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </button>
            <button className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded">
              <Settings className="h-4 w-4" />
            </button>
            <button className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded">
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeRoom ? (
          <div className="h-full flex flex-col">
            {/* Video grid */}
            <div className="flex-1 bg-gray-900 relative">
              {/* Local video */}
              {localStream && (
                <div className="absolute top-4 right-4 w-32 h-24 bg-black rounded-lg overflow-hidden z-10">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-1 left-1 text-xs text-white bg-black bg-opacity-50 px-1 rounded">
                    You
                  </div>
                </div>
              )}

              {/* Remote videos */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 h-full">
                {peers
                  .filter((peer) => peer.userId !== currentUserId)
                  .map((peer) => (
                    <div
                      key={peer.id}
                      className="bg-gray-800 rounded-lg overflow-hidden relative"
                    >
                      <video
                        ref={(ref) => {
                          if (ref) {
                            remoteVideosRef.current.set(peer.id, ref);
                          }
                        }}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-2 left-2 text-sm text-white bg-black bg-opacity-50 px-2 py-1 rounded">
                        {peer.username}
                      </div>
                      <div className="absolute top-2 right-2 flex space-x-1">
                        {!peer.mediaConstraints.audio && (
                          <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                            <MicOff className="h-3 w-3 text-white" />
                          </div>
                        )}
                        {!peer.mediaConstraints.video && (
                          <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                            <VideoOff className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>

              {/* No video placeholder */}
              {peers.filter((peer) => peer.userId !== currentUserId).length ===
                0 && (
                <div className="flex items-center justify-center h-full text-white">
                  <div className="text-center">
                    <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Waiting for others to join...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Call controls */}
            <div className="p-4 bg-gray-800 flex items-center justify-center space-x-4">
              <button
                onClick={toggleAudio}
                className={`p-3 rounded-full ${
                  isAudioEnabled
                    ? "bg-gray-600 hover:bg-gray-700"
                    : "bg-red-500 hover:bg-red-600"
                } text-white`}
              >
                {isAudioEnabled ? (
                  <Mic className="h-5 w-5" />
                ) : (
                  <MicOff className="h-5 w-5" />
                )}
              </button>
              <button
                onClick={toggleVideo}
                className={`p-3 rounded-full ${
                  isVideoEnabled
                    ? "bg-gray-600 hover:bg-gray-700"
                    : "bg-red-500 hover:bg-red-600"
                } text-white`}
              >
                {isVideoEnabled ? (
                  <Video className="h-5 w-5" />
                ) : (
                  <VideoOff className="h-5 w-5" />
                )}
              </button>
              <button
                onClick={toggleScreenShare}
                className={`p-3 rounded-full ${
                  isScreenSharing
                    ? "bg-blue-500 hover:bg-blue-600"
                    : "bg-gray-600 hover:bg-gray-700"
                } text-white`}
              >
                {isScreenSharing ? (
                  <MonitorStop className="h-5 w-5" />
                ) : (
                  <Monitor className="h-5 w-5" />
                )}
              </button>
              <button
                onClick={leaveCall}
                className="p-3 rounded-full bg-red-500 hover:bg-red-600 text-white"
              >
                <PhoneOff className="h-5 w-5" />
              </button>
            </div>
          </div>
        ) : (
          /* Room list */
          <div className="p-4">
            <div className="mb-4">
              <button
                onClick={() => {
                  const name = prompt("Enter room name:");
                  if (name) createRoom(name);
                }}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Create New Room
              </button>
            </div>

            <div className="space-y-2">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{room.name}</h4>
                      <p className="text-sm text-gray-500">
                        Created by {room.createdBy} • {room.maxParticipants} max
                        participants
                      </p>
                    </div>
                    <button
                      onClick={() => joinRoom(room)}
                      className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 flex items-center space-x-1"
                    >
                      <Phone className="h-4 w-4" />
                      <span>Join</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {rooms.length === 0 && (
              <div className="text-center py-8">
                <Video className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No video rooms available</p>
                <p className="text-sm text-gray-400">
                  Create a room to start a video call
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WebRTCComponent;
