import React, { useState, useEffect } from "react";

interface WebRTCDiagnosticProps {}

const WebRTCDiagnostic: React.FC<WebRTCDiagnosticProps> = () => {
  const [status, setStatus] = useState<string>("Checking...");
  const [logs, setLogs] = useState<string[]>([]);
  const [isSupported, setIsSupported] = useState<boolean>(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
    console.log(message);
  };

  const checkWebRTCSupport = async () => {
    try {
      addLog("🔍 Checking WebRTC support in React app...");

      // Check basic support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setStatus("❌ WebRTC not supported");
        addLog("❌ navigator.mediaDevices.getUserMedia not available");
        setIsSupported(false);
        return;
      }

      addLog("✅ navigator.mediaDevices.getUserMedia available");

      // Check secure context
      const isSecure = window.isSecureContext;
      addLog(
        `🔒 Secure context: ${isSecure ? "Yes" : "No"} (${
          window.location.protocol
        })`
      );

      // Test basic video access
      try {
        addLog("📹 Testing camera access...");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240 },
          audio: true,
        });

        const videoTracks = stream.getVideoTracks();
        const audioTracks = stream.getAudioTracks();

        addLog(
          `✅ Camera access successful! Video: ${videoTracks.length}, Audio: ${audioTracks.length}`
        );

        if (videoTracks.length > 0) {
          const settings = videoTracks[0].getSettings();
          addLog(
            `📊 Video: ${settings.width}x${settings.height} @ ${settings.frameRate}fps`
          );
        }

        // Clean up
        stream.getTracks().forEach((track) => track.stop());

        setStatus("✅ WebRTC fully working in React app!");
        setIsSupported(true);
        addLog("🎉 All WebRTC features working correctly");
      } catch (videoError: any) {
        setStatus(`❌ Camera access failed: ${videoError.name}`);
        addLog(
          `❌ Camera test failed: ${videoError.name} - ${videoError.message}`
        );
        setIsSupported(false);
      }
    } catch (error: any) {
      setStatus(`❌ WebRTC check failed: ${error.message}`);
      addLog(`💥 WebRTC check failed: ${error.message}`);
      setIsSupported(false);
    }
  };

  useEffect(() => {
    checkWebRTCSupport();
  }, []);

  return (
    <div className="w-full max-w-sm mx-auto p-4 bg-white rounded-lg shadow-lg">
      <h2 className="text-lg font-bold mb-3 text-center">
        🔍 WebRTC Diagnostic
      </h2>

      <div
        className={`p-3 rounded-lg mb-3 text-center ${
          status.includes("✅")
            ? "bg-green-100 text-green-800"
            : status.includes("❌")
            ? "bg-red-100 text-red-800"
            : "bg-yellow-100 text-yellow-800"
        }`}
      >
        <strong className="text-sm">{status}</strong>
      </div>

      <div className="mb-3">
        <h3 className="font-semibold text-sm mb-2">Environment Info:</h3>
        <div className="text-xs space-y-1 bg-gray-50 p-2 rounded">
          <div className="flex justify-between">
            <span>🌐 Protocol:</span>
            <span className="font-mono">{window.location.protocol}</span>
          </div>
          <div className="flex justify-between">
            <span>🏠 Host:</span>
            <span className="font-mono text-xs truncate max-w-32">
              {window.location.hostname}
            </span>
          </div>
          <div className="flex justify-between">
            <span>🔢 Port:</span>
            <span className="font-mono">{window.location.port}</span>
          </div>
          <div className="flex justify-between">
            <span>🔒 Secure:</span>
            <span
              className={
                window.isSecureContext ? "text-green-600" : "text-red-600"
              }
            >
              {window.isSecureContext ? "Yes" : "No"}
            </span>
          </div>
          <div className="flex justify-between">
            <span>📱 Mobile:</span>
            <span className="text-blue-600">
              {/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
                navigator.userAgent
              )
                ? "Yes"
                : "No"}
            </span>
          </div>
        </div>
      </div>

      {isSupported && (
        <div className="mb-3">
          <button
            onClick={checkWebRTCSupport}
            className="w-full bg-blue-500 text-white py-2 px-3 text-sm rounded-lg hover:bg-blue-600 active:bg-blue-700 transition-colors"
          >
            🔄 Test Again
          </button>
        </div>
      )}

      <div className="bg-gray-100 p-2 rounded-lg max-h-32 overflow-y-auto">
        <h4 className="font-semibold text-xs mb-1">Diagnostic Logs:</h4>
        <div className="text-xs font-mono space-y-1">
          {logs.slice(-5).map((log, index) => (
            <div key={index} className="text-gray-700 break-words">
              {log}
            </div>
          ))}
          {logs.length > 5 && (
            <div className="text-gray-500 text-center">
              ... and {logs.length - 5} more entries
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WebRTCDiagnostic;
