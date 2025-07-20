import React, { useState, useRef } from "react";

const SimpleMobileVideoTest: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startVideo = async () => {
    try {
      setError(null);
      setIsLoading(true);

      console.log("📱 Starting simple mobile video test...");

      // Stop any existing video
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      // Very simple constraints for mobile
      const constraints = {
        video: {
          width: 320,
          height: 240,
          facingMode: "user",
        },
        audio: false, // Skip audio for simplicity
      };

      console.log("📸 Getting camera...");
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        console.log("📺 Setting video source...");
        videoRef.current.srcObject = stream;

        // Simple play without waiting for events
        videoRef.current.play().catch((e) => {
          console.log("Play promise rejected (normal on mobile):", e.message);
        });

        // Wait a short time then mark as active
        setTimeout(() => {
          setIsActive(true);
          setIsLoading(false);
          console.log("✅ Video should be working now");
        }, 500);
      }
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message);
      console.error("❌ Camera error:", err);
    }
  };

  const stopVideo = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
    setIsLoading(false);
    setError(null);
  };

  return (
    <div className="w-full max-w-sm mx-auto p-4 bg-white rounded-lg shadow-lg">
      <h2 className="text-lg font-bold mb-3 text-center">
        📱 Simple Mobile Test
      </h2>

      <div className="relative w-full aspect-video bg-black rounded mb-3 overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          controls={false}
          className="w-full h-full object-cover"
        />

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="animate-pulse text-4xl mb-2">📷</div>
              <div className="text-sm">Getting camera...</div>
            </div>
          </div>
        )}

        {/* Start message */}
        {!isActive && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center text-white text-center">
            <div>
              <div className="text-4xl mb-2">🎥</div>
              <div className="text-sm">Tap Start to test camera</div>
            </div>
          </div>
        )}

        {/* Success indicator */}
        {isActive && (
          <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs">
            ✅ LIVE
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <button
          onClick={startVideo}
          disabled={isLoading}
          className={`px-3 py-2 text-sm rounded font-medium transition-colors ${
            isLoading
              ? "bg-gray-400 text-gray-200 cursor-not-allowed"
              : "bg-green-500 text-white hover:bg-green-600 active:bg-green-700"
          }`}
        >
          {isLoading ? "⏳" : "▶️"} Start
        </button>

        <button
          onClick={stopVideo}
          disabled={isLoading}
          className="px-3 py-2 text-sm bg-red-500 text-white rounded font-medium hover:bg-red-600 active:bg-red-700 transition-colors"
        >
          ⏹️ Stop
        </button>
      </div>

      {error && (
        <div className="mb-3 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="text-xs text-gray-600 text-center">
        <p>Simple test for mobile camera access</p>
        <p className="mt-1">Protocol: {window.location.protocol}</p>
      </div>
    </div>
  );
};

export default SimpleMobileVideoTest;
