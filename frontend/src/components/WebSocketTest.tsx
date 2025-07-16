import React, { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

const WebSocketTest: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<
    Array<{ type: string; data: any; timestamp: Date }>
  >([]);

  useEffect(() => {
    // Initialize WebSocket connection
    const newSocket = io("http://localhost:5000", {
      withCredentials: true,
    });

    setSocket(newSocket);

    // Connection event handlers
    newSocket.on("connect", () => {
      console.log("Connected to WebSocket server");
      setConnected(true);

      // Join organization for testing
      newSocket.emit("join_organization", "test-org-123");
    });

    newSocket.on("disconnect", () => {
      console.log("Disconnected from WebSocket server");
      setConnected(false);
    });

    // Listen for analytics updates
    newSocket.on("analytics_update", (data) => {
      console.log("Analytics update received:", data);
      setMessages((prev) => [
        ...prev,
        { type: "analytics_update", data, timestamp: new Date() },
      ]);
    });

    // Listen for performance alerts
    newSocket.on("performance_alert", (data) => {
      console.log("Performance alert received:", data);
      setMessages((prev) => [
        ...prev,
        { type: "performance_alert", data, timestamp: new Date() },
      ]);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const sendTestEvent = () => {
    if (socket && connected) {
      socket.emit("analytics_event", {
        eventType: "user_action",
        eventCategory: "testing",
        eventAction: "websocket_test",
        organizationId: "test-org-123",
        userId: "test-user-123",
        metadata: { testData: "WebSocket test from frontend" },
      });
    }
  };

  const sendTestAnalytics = () => {
    // Simulate direct analytics service call
    fetch("http://localhost:5000/api/analytics/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-session-id": "test-session-123",
      },
      body: JSON.stringify({
        eventType: "user_action",
        eventCategory: "testing",
        eventAction: "api_test",
        eventLabel: "WebSocket Integration Test",
        metadata: { source: "frontend_test", timestamp: new Date() },
      }),
    })
      .then((response) => response.json())
      .then((data) => console.log("Analytics API response:", data))
      .catch((error) => console.error("Analytics API error:", error));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">WebSocket Integration Test</h1>

      {/* Connection Status */}
      <div className="mb-6 p-4 rounded-lg border">
        <h2 className="text-lg font-semibold mb-2">Connection Status</h2>
        <div
          className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
            connected
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {connected ? "Connected" : "Disconnected"}
        </div>
        {connected && (
          <p className="text-sm text-gray-600 mt-2">Socket ID: {socket?.id}</p>
        )}
      </div>

      {/* Test Controls */}
      <div className="mb-6 p-4 rounded-lg border bg-gray-50">
        <h2 className="text-lg font-semibold mb-4">Test Controls</h2>
        <div className="space-x-4">
          <button
            onClick={sendTestEvent}
            disabled={!connected}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
          >
            Send WebSocket Event
          </button>
          <button
            onClick={sendTestAnalytics}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Send Analytics API Call
          </button>
        </div>
      </div>

      {/* Real-time Messages */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">
          Real-time Messages ({messages.length})
        </h2>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {messages.length === 0 ? (
            <p className="text-gray-500 italic">
              No messages received yet. Try sending a test event!
            </p>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className="p-3 rounded border-l-4 border-l-blue-500 bg-blue-50"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium text-blue-800">{msg.type}</span>
                  <span className="text-xs text-gray-500">
                    {msg.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-x-auto">
                  {JSON.stringify(msg.data, null, 2)}
                </pre>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="p-4 rounded-lg border bg-yellow-50">
        <h3 className="font-semibold text-yellow-800 mb-2">
          Testing Instructions:
        </h3>
        <ol className="text-sm text-yellow-700 space-y-1">
          <li>1. Check that connection status shows "Connected"</li>
          <li>
            2. Click "Send WebSocket Event" to test direct WebSocket
            communication
          </li>
          <li>
            3. Click "Send Analytics API Call" to test analytics service
            integration
          </li>
          <li>4. Watch for real-time messages appearing below</li>
          <li>5. Open browser console for additional debugging information</li>
        </ol>
      </div>
    </div>
  );
};

export default WebSocketTest;
