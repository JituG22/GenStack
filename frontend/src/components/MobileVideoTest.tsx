import React, { useState, useRef, useEffect } from "react";

const MobileVideoTest: React.FC = () => {
  const [isVideoActive, setIsVideoActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    setLogs((prev) => [...prev, logMessage]);
    console.log(logMessage);
  };

  const stopVideo = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsVideoActive(false);
    setIsLoading(false);
    addLog("🛑 Video stopped");
  };

  const testMobileVideo = async () => {
    try {
      setError(null);
      setIsLoading(true);
      addLog("📱 Starting mobile video test...");

      // Stop any existing video
      stopVideo();

      // Detect mobile
      const isMobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );
      addLog(`📱 Mobile detected: ${isMobile}`);

      // Check support
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("getUserMedia not supported");
      }
      addLog("✅ getUserMedia supported");

      // Check HTTPS
      const isSecure = window.location.protocol === "https:";
      addLog(`🔒 HTTPS: ${isSecure ? "Yes" : "No"}`);

      if (!isSecure) {
        addLog(
          "⚠️ Warning: Mobile browsers may require HTTPS for camera access"
        );
      }

      // Mobile-optimized constraints
      const constraints = {
        video: {
          width: { ideal: 320, max: 480 },
          height: { ideal: 240, max: 360 },
          frameRate: { ideal: 15, max: 30 },
          facingMode: "user",
        },
        audio: true,
      };

      addLog(`📋 Using constraints: ${JSON.stringify(constraints)}`);
      addLog("🎥 Requesting camera access...");

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        addLog("📺 Setting video source...");

        // For mobile, use a simpler approach
        if (isMobile) {
          addLog("📱 Using mobile-optimized loading...");

          // Simple approach for mobile - just set source and play
          try {
            await videoRef.current.play();
            addLog("▶️ Mobile video started");
          } catch (playError: any) {
            addLog(
              `⚠️ Mobile play warning (may be normal): ${playError.message}`
            );
          }

          // Give mobile a moment to start video
          setTimeout(() => {
            if (streamRef.current && streamRef.current.getTracks().length > 0) {
              setIsVideoActive(true);
              setIsLoading(false);
              addLog("✅ Mobile video activated");
            }
          }, 1000);
        } else {
          // Desktop approach with full loading detection
          await Promise.race([
            new Promise((resolve, reject) => {
              const video = videoRef.current!;

              const onLoadedData = () => {
                video.removeEventListener("loadeddata", onLoadedData);
                video.removeEventListener("error", onError);
                video.removeEventListener("loadedmetadata", onLoadedData);
                resolve(void 0);
              };

              const onError = (e: any) => {
                video.removeEventListener("loadeddata", onLoadedData);
                video.removeEventListener("error", onError);
                video.removeEventListener("loadedmetadata", onLoadedData);
                reject(
                  new Error(
                    `Video loading error: ${
                      e.target?.error?.message || "Unknown"
                    }`
                  )
                );
              };

              // Try multiple events
              video.addEventListener("loadeddata", onLoadedData);
              video.addEventListener("loadedmetadata", onLoadedData);
              video.addEventListener("error", onError);

              // For mobile, sometimes we need to manually trigger play
              if (video.readyState >= 2) {
                // Video is already loaded
                resolve(void 0);
              }
            }),
            // 10 second timeout
            new Promise((_, reject) =>
              setTimeout(
                () =>
                  reject(new Error("Video loading timeout after 10 seconds")),
                10000
              )
            ),
          ]);

          addLog("🎬 Starting video playback...");
          try {
            await videoRef.current.play();
            addLog("▶️ Video play successful");
          } catch (playError: any) {
            addLog(`⚠️ Play error (may be normal): ${playError.message}`);
            // On mobile, play() might fail but video still works
          }

          setIsVideoActive(true);
          setIsLoading(false);
        }
      }

      // For desktop, set active state here
      if (!isMobile) {
        // Already handled above
      }
      addLog(`✅ Video started! Tracks: ${stream.getTracks().length}`);

      // Log track details
      stream.getTracks().forEach((track) => {
        addLog(`📊 ${track.kind}: ${track.label} (${track.readyState})`);
      });
    } catch (err) {
      setIsLoading(false);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      addLog(`❌ Video failed: ${errorMessage}`);

      // Try simpler fallback
      try {
        addLog("🔄 Trying fallback...");
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240 },
          audio: false,
        });

        streamRef.current = fallbackStream;
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
          await videoRef.current.play();
        }
        setIsVideoActive(true);
        addLog("✅ Fallback successful");
      } catch (fallbackErr) {
        addLog(
          `❌ Fallback failed: ${
            fallbackErr instanceof Error ? fallbackErr.message : "Unknown"
          }`
        );
      }
    }
  };

  const testPermissions = async () => {
    addLog("🔑 Testing permissions...");

    try {
      if ("permissions" in navigator) {
        const camera = await navigator.permissions.query({
          name: "camera" as PermissionName,
        });
        const microphone = await navigator.permissions.query({
          name: "microphone" as PermissionName,
        });
        addLog(`📷 Camera: ${camera.state}`);
        addLog(`🎤 Microphone: ${microphone.state}`);
      } else {
        addLog("⚠️ Permissions API not available");
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === "videoinput");
      addLog(`📷 Video devices: ${videoInputs.length}`);
    } catch (err) {
      addLog(
        `❌ Permission test failed: ${
          err instanceof Error ? err.message : "Unknown"
        }`
      );
    }
  };

  useEffect(() => {
    addLog("📱 Mobile Video Test Component loaded");
    return () => stopVideo();
  }, []);

  return (
    <div className="w-full max-w-sm mx-auto p-3 bg-white rounded-lg shadow-lg">
      <h2 className="text-lg font-bold mb-3 text-center">
        📱 Mobile Video Test
      </h2>

      <div className="relative w-full aspect-video bg-black rounded mb-3 overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
        />

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
              <div className="text-sm">Loading camera...</div>
            </div>
          </div>
        )}

        {/* No video message */}
        {!isVideoActive && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center text-white text-center">
            <div>
              <div className="text-3xl mb-2">📹</div>
              <div className="text-sm">Tap "Test Mobile Video" to start</div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2 mb-3">
        <button
          onClick={testMobileVideo}
          disabled={isLoading}
          className={`w-full px-3 py-2 text-sm rounded transition-colors ${
            isLoading
              ? "bg-gray-400 text-gray-200 cursor-not-allowed"
              : "bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700"
          }`}
        >
          {isLoading ? "⏳ Loading Camera..." : "🎥 Test Mobile Video"}
        </button>

        <button
          onClick={testPermissions}
          className="w-full px-3 py-2 text-sm bg-green-500 text-white rounded hover:bg-green-600 active:bg-green-700 transition-colors"
        >
          🔑 Test Permissions
        </button>

        <button
          onClick={stopVideo}
          className="w-full px-3 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600 active:bg-red-700 transition-colors"
        >
          🛑 Stop Video
        </button>
      </div>

      {error && (
        <div className="mb-3 p-2 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
          <strong>Error:</strong> <span className="break-words">{error}</span>
        </div>
      )}

      <div className="bg-gray-100 p-2 rounded max-h-32 overflow-y-auto">
        <h3 className="font-semibold text-xs mb-1">Debug Log:</h3>
        <div className="space-y-1">
          {logs.slice(-4).map((log, index) => (
            <div
              key={index}
              className="text-xs font-mono text-gray-700 break-words"
            >
              {log}
            </div>
          ))}
          {logs.length > 4 && (
            <div className="text-xs text-gray-500 text-center">
              ... and {logs.length - 4} more entries
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileVideoTest;
