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
    // Test WebSocket analytics integration via our new API endpoint
    fetch("http://localhost:5000/api/websocket-test/test-websocket", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        organizationId: "test-org-123",
        eventType: "user_action",
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("WebSocket Analytics API response:", data);
        setMessages((prev) => [
          ...prev,
          {
            type: "api_response",
            data: { source: "analytics_api", response: data },
            timestamp: new Date(),
          },
        ]);
      })
      .catch((error) => {
        console.error("WebSocket Analytics API error:", error);
        setMessages((prev) => [
          ...prev,
          {
            type: "api_error",
            data: { source: "analytics_api", error: error.message },
            timestamp: new Date(),
          },
        ]);
      });
  };

  const sendTestPerformanceAlert = () => {
    // Test performance alert via WebSocket
    fetch("http://localhost:5000/api/websocket-test/test-performance-alert", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        organizationId: "test-org-123",
        value: 6000, // This should trigger a critical alert
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Performance Alert API response:", data);
        setMessages((prev) => [
          ...prev,
          {
            type: "api_response",
            data: { source: "performance_api", response: data },
            timestamp: new Date(),
          },
        ]);
      })
      .catch((error) => {
        console.error("Performance Alert API error:", error);
        setMessages((prev) => [
          ...prev,
          {
            type: "api_error",
            data: { source: "performance_api", error: error.message },
            timestamp: new Date(),
          },
        ]);
      });
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={sendTestEvent}
            disabled={!connected}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
          >
            Send Direct WebSocket Event
          </button>
          <button
            onClick={sendTestAnalytics}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Test Analytics WebSocket API
          </button>
          <button
            onClick={sendTestPerformanceAlert}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Test Performance Alert
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-3">
          Use these buttons to test different WebSocket integration scenarios
        </p>
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
            2. Click "Send Direct WebSocket Event" to test direct WebSocket
            communication
          </li>
          <li>
            3. Click "Test Analytics WebSocket API" to test analytics service
            integration
          </li>
          <li>
            4. Click "Test Performance Alert" to trigger a performance threshold
            alert
          </li>
          <li>
            5. Watch for real-time messages appearing in the messages section
          </li>
          <li>6. Open browser console for additional debugging information</li>
          <li>
            7. Each test should generate different types of WebSocket events
          </li>
        </ol>
      </div>
    </div>
  );
};

export default WebSocketTest;
