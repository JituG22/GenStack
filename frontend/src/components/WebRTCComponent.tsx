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
  const [showDebugPanel, setShowDebugPanel] = useState(false);

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
        setRooms(
          Array.isArray(roomsData)
            ? roomsData.filter((room) => room && room.id)
            : []
        );
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
      if (room && room.id) {
        setRooms((prev) => [...prev, room]);
      }
    };

    const handleRoomUpdated = (room: WebRTCRoom) => {
      if (room && room.id) {
        setRooms((prev) => prev.map((r) => (r.id === room.id ? room : r)));
        if (activeRoom?.id === room.id) {
          setActiveRoom(room);
        }
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

    const handleRoomJoined = (data: any) => {
      console.log("🎥 Room joined:", data);
      if (data.room) {
        setActiveRoom(data.room);
      }
      if (data.peers) {
        setPeers(data.peers);
      }
    };

    // Register event listeners
    communicationService.on("room_created", handleRoomCreated);
    communicationService.on("room_joined", handleRoomJoined);
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
      communicationService.off("room_joined", handleRoomJoined);
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

      // Handle remote stream with enhanced error handling
      connection.ontrack = (event) => {
        console.log("🎥 Received remote track:", event);
        console.log("🎥 Remote track details:", {
          kind: event.track.kind,
          enabled: event.track.enabled,
          readyState: event.track.readyState,
          label: event.track.label,
          streams: event.streams.length,
        });

        if (event.streams[0]) {
          const remoteStream = event.streams[0];
          console.log(
            "🎥 Remote stream tracks:",
            remoteStream.getTracks().map((track) => ({
              kind: track.kind,
              enabled: track.enabled,
              readyState: track.readyState,
              label: track.label,
            }))
          );

          // Update peer connection with remote stream
          setPeerConnections((prev) => {
            const newMap = new Map(prev);
            const existingPeer = newMap.get(peer.id);
            if (existingPeer) {
              existingPeer.remoteStream = remoteStream;
              newMap.set(peer.id, existingPeer);
            }
            return newMap;
          });

          const remoteVideo = remoteVideosRef.current.get(peer.id);
          if (remoteVideo) {
            console.log("🎥 Setting remote video stream for peer:", peer.id);
            remoteVideo.srcObject = remoteStream;

            // Enhanced remote video setup
            remoteVideo.onloadedmetadata = () => {
              console.log("🎥 Remote video metadata loaded for peer:", peer.id);
            };

            remoteVideo.oncanplay = () => {
              console.log("🎥 Remote video can play for peer:", peer.id);
            };

            remoteVideo.onerror = (error) => {
              console.error("🎥 Remote video error for peer:", peer.id, error);
            };

            // Multiple attempts to start remote video playback
            remoteVideo.play().catch((playError) => {
              console.warn(
                "🎥 Remote video auto-play failed for peer:",
                peer.id,
                playError
              );

              setTimeout(() => {
                if (remoteVideo.srcObject) {
                  remoteVideo.play().catch((retryError) => {
                    console.warn(
                      "🎥 Remote video manual play failed for peer:",
                      peer.id,
                      retryError
                    );
                  });
                }
              }, 1000);
            });
          } else {
            console.warn(
              "🎥 Remote video element not found for peer:",
              peer.id
            );
          }
        } else {
          console.warn("🎥 No remote stream in track event");
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

  // Get user media with enhanced error handling
  const getUserMedia = async (audio: boolean, video: boolean) => {
    try {
      console.log("🎥 Requesting user media:", { audio, video });

      // Enhanced video constraints for better compatibility
      const constraints: MediaStreamConstraints = {
        audio: audio
          ? {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            }
          : false,
        video: video
          ? {
              width: { ideal: 640, max: 1280 },
              height: { ideal: 480, max: 720 },
              frameRate: { ideal: 30, max: 60 },
              facingMode: "user",
            }
          : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log("🎥 Got user media stream:", stream);
      console.log(
        "🎥 Stream tracks:",
        stream.getTracks().map((track) => ({
          kind: track.kind,
          enabled: track.enabled,
          readyState: track.readyState,
          label: track.label,
        }))
      );

      setLocalStream(stream);

      if (localVideoRef.current && stream.getVideoTracks().length > 0) {
        console.log("🎥 Setting local video stream");
        localVideoRef.current.srcObject = stream;

        // Enhanced video element setup
        localVideoRef.current.onloadedmetadata = () => {
          console.log("🎥 Local video metadata loaded");
        };

        localVideoRef.current.oncanplay = () => {
          console.log("🎥 Local video can play");
        };

        localVideoRef.current.onerror = (error) => {
          console.error("🎥 Local video error:", error);
        };

        // Multiple attempts to start video playback
        try {
          await localVideoRef.current.play();
          console.log("🎥 Local video started playing");
        } catch (playError) {
          console.warn(
            "🎥 Auto-play failed, attempting manual play:",
            playError
          );

          // Try with different approaches
          setTimeout(async () => {
            try {
              if (localVideoRef.current) {
                await localVideoRef.current.play();
                console.log("🎥 Local video started playing (delayed)");
              }
            } catch (retryError) {
              console.warn("🎥 Manual play also failed:", retryError);
              setError(
                "Video auto-play blocked. Please click on the video to start."
              );
            }
          }, 1000);
        }
      }

      return stream;
    } catch (err) {
      console.error("❌ Error accessing media devices:", err);

      let errorMessage = "Failed to access camera/microphone";

      if (err instanceof Error) {
        switch (err.name) {
          case "NotAllowedError":
            errorMessage =
              "Camera/microphone access denied. Please allow permissions and try again.";
            break;
          case "NotFoundError":
            errorMessage =
              "No camera/microphone found. Please check your devices.";
            break;
          case "NotReadableError":
            errorMessage =
              "Camera/microphone is already in use by another application.";
            break;
          case "OverconstrainedError":
            errorMessage = "Camera/microphone constraints cannot be satisfied.";
            break;
          case "SecurityError":
            errorMessage =
              "Camera/microphone access blocked due to security settings.";
            break;
          default:
            errorMessage = `Media device error: ${err.message}`;
        }
      }

      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Debug function to check media capabilities
  const checkMediaCapabilities = async () => {
    try {
      console.log("🔍 Checking media capabilities...");

      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error("❌ getUserMedia is not supported");
        setError("Your browser doesn't support video calls");
        return false;
      }

      // Check available devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(
        (device) => device.kind === "videoinput"
      );
      const audioDevices = devices.filter(
        (device) => device.kind === "audioinput"
      );

      console.log("🎥 Available video devices:", videoDevices.length);
      console.log("🎤 Available audio devices:", audioDevices.length);

      if (videoDevices.length === 0) {
        console.warn("⚠️ No video devices found");
        setError("No camera found. Please connect a camera and try again.");
        return false;
      }

      if (audioDevices.length === 0) {
        console.warn("⚠️ No audio devices found");
      }

      return true;
    } catch (err) {
      console.error("❌ Error checking media capabilities:", err);
      setError("Failed to check media capabilities");
      return false;
    }
  };

  // Enhanced join room function
  const joinRoom = async (room: WebRTCRoom) => {
    try {
      setError(null);
      console.log("🚀 Joining room:", room.id);

      // Check media capabilities first
      const capabilitiesOk = await checkMediaCapabilities();
      if (!capabilitiesOk) {
        return;
      }

      // Get user media with retries
      let stream: MediaStream | null = null;
      let retryCount = 0;
      const maxRetries = 3;

      while (!stream && retryCount < maxRetries) {
        try {
          stream = await getUserMedia(isAudioEnabled, isVideoEnabled);
          break;
        } catch (err) {
          retryCount++;
          console.warn(`🔄 getUserMedia attempt ${retryCount} failed:`, err);

          if (retryCount >= maxRetries) {
            throw err;
          }

          // Wait before retry
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      if (!stream) {
        throw new Error("Failed to get media stream after retries");
      }

      console.log("✅ Successfully got media stream, joining WebRTC room...");

      await communicationService.joinWebRTCRoom(room.id, {
        audio: isAudioEnabled,
        video: isVideoEnabled,
      });

      const roomDetails = await communicationService.getWebRTCRoomDetails(
        room.id
      );
      setActiveRoom(room);
      setPeers(roomDetails.participants);
      setIsInCall(true);

      console.log("👥 Room participants:", roomDetails.participants.length);

      // Create peer connections for existing participants
      roomDetails.participants.forEach((peer) => {
        if (peer.userId !== currentUserId) {
          console.log("🤝 Creating peer connection for:", peer.username);
          createPeerConnection(peer);
        }
      });

      console.log("🎉 Successfully joined room!");
    } catch (err) {
      console.error("❌ Failed to join room:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to join room";
      setError(errorMessage);
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
      const sessionId = `session-${Date.now()}`; // Generate a session ID
      await communicationService.createWebRTCRoom(sessionId, name, {
        allowScreenShare: true,
        requireMicPermission: false,
        requireVideoPermission: false,
        isPublic: true,
      });

      // Note: The room will be added to the list via the 'room_created' event listener
      // We don't need to manually update the rooms state here since createWebRTCRoom returns void
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
        <div className="text-center p-6 max-w-md">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <VideoOff className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Video Call Error
          </h3>
          <p className="text-sm text-red-600 mb-4">{error}</p>

          <div className="bg-gray-50 p-4 rounded-lg mb-4 text-left">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Troubleshooting Tips:
            </h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Ensure your camera and microphone are connected</li>
              <li>• Allow camera/microphone permissions when prompted</li>
              <li>• Try refreshing the page</li>
              <li>• Check if another app is using your camera</li>
              <li>
                • Make sure you're using a supported browser (Chrome, Firefox,
                Safari)
              </li>
            </ul>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => {
                setError(null);
                window.location.reload();
              }}
              className="flex-1 px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600"
            >
              Retry
            </button>
            <button
              onClick={() => setError(null)}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 text-sm rounded-lg hover:bg-gray-300"
            >
              Dismiss
            </button>
          </div>
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
              {activeRoom
                ? `Call: ${activeRoom.name || "Unnamed Room"}`
                : "Video Calls"}
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
              {/* Local video with enhanced error handling */}
              {localStream && (
                <div className="absolute top-4 right-4 w-32 h-24 bg-black rounded-lg overflow-hidden z-10">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    controls={false}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error("🎥 Local video element error:", e);
                      setError("Local video playback error");
                    }}
                    onLoadedMetadata={() => {
                      console.log("🎥 Local video metadata loaded");
                    }}
                    onCanPlay={() => {
                      console.log("🎥 Local video ready to play");
                    }}
                    onClick={() => {
                      // Allow manual play on click
                      if (localVideoRef.current) {
                        localVideoRef.current.play().catch(console.warn);
                      }
                    }}
                  />
                  <div className="absolute bottom-1 left-1 text-xs text-white bg-black bg-opacity-50 px-1 rounded">
                    You {!isVideoEnabled && "(Video Off)"}
                  </div>
                  {!isVideoEnabled && (
                    <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                      <VideoOff className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
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
                            console.log(
                              "🎥 Setting remote video ref for peer:",
                              peer.id
                            );
                            remoteVideosRef.current.set(peer.id, ref);

                            // Enhanced video element setup
                            ref.onloadedmetadata = () => {
                              console.log(
                                "🎥 Remote video metadata loaded for peer:",
                                peer.id
                              );
                            };

                            ref.oncanplay = () => {
                              console.log(
                                "🎥 Remote video can play for peer:",
                                peer.id
                              );
                            };

                            ref.onerror = (error) => {
                              console.error(
                                "🎥 Remote video element error for peer:",
                                peer.id,
                                error
                              );
                            };

                            // If there's already a stream for this peer, set it
                            const peerConnection = peerConnections.get(peer.id);
                            if (peerConnection?.remoteStream) {
                              console.log(
                                "🎥 Setting existing remote stream for peer:",
                                peer.id
                              );
                              ref.srcObject = peerConnection.remoteStream;
                              ref.play().catch((playError) => {
                                console.warn(
                                  "🎥 Remote video play failed for peer:",
                                  peer.id,
                                  playError
                                );
                              });
                            }
                          } else {
                            remoteVideosRef.current.delete(peer.id);
                          }
                        }}
                        autoPlay
                        playsInline
                        controls={false}
                        className="w-full h-full object-cover"
                        onClick={(e) => {
                          // Allow manual play on click
                          const video = e.target as HTMLVideoElement;
                          video.play().catch(console.warn);
                        }}
                      />
                      {!peer.mediaConstraints.video && (
                        <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                          <VideoOff className="h-16 w-16 text-gray-400" />
                        </div>
                      )}
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
              <button
                onClick={() => setShowDebugPanel(!showDebugPanel)}
                className="p-2 rounded-full bg-gray-600 hover:bg-gray-700 text-white text-xs"
                title="Debug Info"
              >
                🔧
              </button>
            </div>

            {/* Debug Panel */}
            {showDebugPanel && (
              <div className="p-4 bg-gray-100 border-t border-gray-200 max-h-64 overflow-y-auto">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Debug Information
                </h4>
                <div className="space-y-2 text-xs">
                  <div>
                    <strong>Connection Status:</strong>{" "}
                    {isConnected ? "Connected" : "Disconnected"}
                  </div>
                  <div>
                    <strong>Local Stream:</strong>{" "}
                    {localStream ? "Active" : "Inactive"}
                    {localStream && (
                      <div className="ml-2">
                        - Video tracks: {localStream.getVideoTracks().length}-
                        Audio tracks: {localStream.getAudioTracks().length}
                        {localStream.getVideoTracks().map((track, i) => (
                          <div key={i} className="ml-4">
                            Video {i}: {track.readyState} (enabled:{" "}
                            {track.enabled ? "yes" : "no"})
                          </div>
                        ))}
                        {localStream.getAudioTracks().map((track, i) => (
                          <div key={i} className="ml-4">
                            Audio {i}: {track.readyState} (enabled:{" "}
                            {track.enabled ? "yes" : "no"})
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <strong>Peer Connections:</strong> {peerConnections.size}
                    {Array.from(peerConnections.entries()).map(
                      ([peerId, peer]) => (
                        <div key={peerId} className="ml-2">
                          - {peer.username}: {peer.connection.connectionState}
                          {peer.remoteStream && (
                            <div className="ml-4">
                              Remote stream:{" "}
                              {peer.remoteStream.getTracks().length} tracks
                            </div>
                          )}
                        </div>
                      )
                    )}
                  </div>
                  <div>
                    <strong>Room:</strong> {activeRoom?.name || "None"}
                  </div>
                  <div>
                    <strong>Participants:</strong> {peers.length}
                  </div>
                  <div>
                    <strong>Media Constraints:</strong>
                    <div className="ml-2">
                      - Audio: {isAudioEnabled ? "enabled" : "disabled"}- Video:{" "}
                      {isVideoEnabled ? "enabled" : "disabled"}
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <button
                      onClick={async () => {
                        try {
                          const capabilitiesOk = await checkMediaCapabilities();
                          alert(
                            `Media capabilities check: ${
                              capabilitiesOk ? "OK" : "Failed"
                            }`
                          );
                        } catch (err) {
                          alert(
                            `Error: ${
                              err instanceof Error
                                ? err.message
                                : "Unknown error"
                            }`
                          );
                        }
                      }}
                      className="px-2 py-1 bg-blue-500 text-white rounded text-xs mr-2"
                    >
                      Test Capabilities
                    </button>
                    <button
                      onClick={() => {
                        console.log("=== WebRTC Debug Info ===");
                        console.log("Connected:", isConnected);
                        console.log("Local Stream:", localStream);
                        console.log("Peer Connections:", peerConnections);
                        console.log("Active Room:", activeRoom);
                        console.log("Peers:", peers);
                        console.log("========================");
                      }}
                      className="px-2 py-1 bg-gray-500 text-white rounded text-xs"
                    >
                      Log to Console
                    </button>
                  </div>
                </div>
              </div>
            )}
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
              {rooms
                .filter((room) => room && room.id)
                .map((room) => (
                  <div
                    key={room.id}
                    className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {room.name || "Unnamed Room"}
                        </h4>
                        <p className="text-sm text-gray-500">
                          Created by {room.createdBy || "Unknown"} •{" "}
                          {room.maxParticipants || 10} max participants
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
