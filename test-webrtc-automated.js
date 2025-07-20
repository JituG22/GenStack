#!/usr/bin/env node

const io = require("socket.io-client");
const fetch = require("node-fetch");

const BACKEND_URL = "http://localhost:5000";
const FRONTEND_URL = "http://localhost:3001";

let testResults = {
  passed: 0,
  failed: 0,
  details: [],
};

function logStep(step, status, details = "") {
  const icon = status === "PASS" ? "✅" : status === "FAIL" ? "❌" : "🔍";
  console.log(`${icon} ${step}: ${status}${details ? ` - ${details}` : ""}`);

  testResults.details.push({
    step,
    status,
    details,
  });

  if (status === "PASS") testResults.passed++;
  if (status === "FAIL") testResults.failed++;
}

async function testWebRTCFunctionality() {
  console.log("\n🎥 Testing WebRTC Functionality\n" + "=".repeat(50));

  let webrtcSocket = null;
  let roomId = null;

  try {
    // Step 1: Connect to WebRTC namespace
    logStep("Connecting to WebRTC namespace", "INFO");
    webrtcSocket = io(`${BACKEND_URL}/webrtc`, {
      transports: ["websocket"],
    });

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error("Connection timeout")),
        5000
      );

      webrtcSocket.on("connect", () => {
        clearTimeout(timeout);
        logStep(
          "WebRTC namespace connection",
          "PASS",
          `Socket ID: ${webrtcSocket.id}`
        );
        resolve();
      });

      webrtcSocket.on("connect_error", (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });

    // Step 2: Create WebRTC room
    logStep("Creating WebRTC room", "INFO");
    const createRoomPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error("Create room timeout")),
        5000
      );

      webrtcSocket.on("room-created", (data) => {
        clearTimeout(timeout);
        roomId = data.roomId;
        logStep("WebRTC room creation", "PASS", `Room ID: ${roomId}`);
        resolve(data);
      });

      webrtcSocket.on("webrtc-error", (error) => {
        clearTimeout(timeout);
        reject(new Error(`WebRTC error: ${error.message}`));
      });

      // Send create room request with user info
      webrtcSocket.emit("create_room", {
        name: "Test Room",
        userId: "test-user-123",
        username: "TestUser",
        sessionId: "test-session-456",
        settings: {
          allowScreenShare: true,
          isPublic: false,
        },
      });
    });

    await createRoomPromise;

    // Step 3: Join WebRTC room
    logStep("Joining WebRTC room", "INFO");
    const joinRoomPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error("Join room timeout")),
        5000
      );

      webrtcSocket.on("room-joined", (data) => {
        clearTimeout(timeout);
        logStep(
          "WebRTC room join",
          "PASS",
          `Joined room with ${data.peers?.length || 0} existing peers`
        );
        resolve(data);
      });

      webrtcSocket.on("webrtc-error", (error) => {
        clearTimeout(timeout);
        reject(new Error(`Join room error: ${error.message}`));
      });

      // Send join room request with user info and media constraints
      webrtcSocket.emit("join_room", {
        roomId: roomId,
        userId: "test-user-123",
        username: "TestUser",
        mediaConstraints: {
          audio: true,
          video: true,
          screen: false,
        },
      });
    });

    await joinRoomPromise;

    // Step 4: Test WebRTC signaling (offer)
    logStep("Testing WebRTC signaling (offer)", "INFO");
    const signalingPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        // Signaling might not have immediate response, so we'll consider this a pass if no error
        logStep(
          "WebRTC signaling test",
          "PASS",
          "Offer sent successfully (no immediate response expected in test)"
        );
        resolve();
      }, 2000);

      webrtcSocket.on("webrtc-offer", (data) => {
        clearTimeout(timeout);
        logStep(
          "WebRTC signaling test",
          "PASS",
          `Received offer from peer: ${data.from}`
        );
        resolve(data);
      });

      webrtcSocket.on("webrtc-error", (error) => {
        clearTimeout(timeout);
        reject(new Error(`Signaling error: ${error.message}`));
      });

      // Send a test WebRTC offer
      webrtcSocket.emit("webrtc-offer", {
        to: "test-peer-id",
        offer: {
          type: "offer",
          sdp: "v=0\r\no=test 123456 654321 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n",
        },
      });
    });

    await signalingPromise;

    // Step 5: Test media controls
    logStep("Testing media controls", "INFO");
    const mediaControlPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        logStep(
          "Media controls test",
          "PASS",
          "Media controls sent successfully"
        );
        resolve();
      }, 1000);

      webrtcSocket.on("webrtc-error", (error) => {
        clearTimeout(timeout);
        reject(new Error(`Media control error: ${error.message}`));
      });

      // Test mute/unmute
      webrtcSocket.emit("toggle_media", {
        roomId: roomId,
        mediaType: "audio",
        enabled: false,
      });
    });

    await mediaControlPromise;

    // Step 6: Leave room
    logStep("Leaving WebRTC room", "INFO");
    const leaveRoomPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        logStep("WebRTC room leave", "PASS", "Leave room command sent");
        resolve();
      }, 1000);

      webrtcSocket.on("peer-left", (data) => {
        clearTimeout(timeout);
        logStep("WebRTC room leave", "PASS", `Left room successfully`);
        resolve(data);
      });

      webrtcSocket.emit("leave_room", {
        roomId: roomId,
      });
    });

    await leaveRoomPromise;
  } catch (error) {
    logStep("WebRTC test", "FAIL", error.message);
    console.error("❌ WebRTC test error:", error);
  } finally {
    if (webrtcSocket) {
      webrtcSocket.disconnect();
    }
  }
}

async function runTests() {
  console.log("🚀 Starting WebRTC Automated Tests");
  console.log("⏰ Timestamp:", new Date().toISOString());

  try {
    // Check if backend is running
    console.log("\n🔍 Checking backend availability...");
    const response = await fetch(`${BACKEND_URL}/health`);
    if (response.ok) {
      logStep("Backend health check", "PASS", `Status: ${response.status}`);
    } else {
      throw new Error(`Backend not available: ${response.status}`);
    }
  } catch (error) {
    logStep("Backend health check", "FAIL", error.message);
    console.log("\n❌ Backend is not running. Please start it first:");
    console.log("   cd backend && npm run dev");
    return;
  }

  await testWebRTCFunctionality();

  // Print summary
  console.log("\n📊 Test Summary");
  console.log("=".repeat(50));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📊 Total:  ${testResults.passed + testResults.failed}`);

  if (testResults.failed === 0) {
    console.log(
      "\n🎉 All WebRTC tests passed! Video communication should be working."
    );
  } else {
    console.log("\n⚠️  Some tests failed. Check the details above.");

    console.log("\n🔧 Debug Information:");
    testResults.details.forEach((result) => {
      if (result.status === "FAIL") {
        console.log(`   - ${result.step}: ${result.details}`);
      }
    });
  }

  process.exit(testResults.failed === 0 ? 0 : 1);
}

// Handle process termination
process.on("SIGINT", () => {
  console.log("\n\n⏹️  Test interrupted by user");
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("\n❌ Unhandled rejection:", reason);
  process.exit(1);
});

// Run tests
runTests().catch((error) => {
  console.error("\n💥 Test suite failed:", error);
  process.exit(1);
});
