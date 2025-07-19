const io = require("socket.io-client");

const API_BASE = "http://localhost:5000";
const CHAT_URL = "http://localhost:5000/chat";

// Test configuration
const TEST_USER = {
  email: "test@example.com",
  password: "password123",
};
const SESSION_ID = "test-session-automated";

let authToken = null;
let user = null;
let chatSocket = null;

// Helper function to wait
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Login function
async function login() {
  try {
    const fetch = (await import("node-fetch")).default;

    console.log("🔐 Logging in...");
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(TEST_USER),
    });

    const data = await response.json();
    if (data.success) {
      authToken = data.token;
      user = data.data.user; // Fix: user is nested in data.data
      console.log("✅ Login successful:", user.firstName, user.lastName);
      return true;
    } else {
      console.error("❌ Login failed:", data.message);
      return false;
    }
  } catch (error) {
    console.error("❌ Login error:", error.message);
    return false;
  }
}

// Connect to chat
function connectToChat() {
  return new Promise((resolve, reject) => {
    console.log("🔌 Connecting to chat...");

    chatSocket = io(CHAT_URL, {
      auth: { token: authToken },
      transports: ["websocket"],
    });

    chatSocket.on("connect", () => {
      console.log("✅ Connected to chat:", chatSocket.id);
      resolve();
    });

    chatSocket.on("connect_error", (error) => {
      console.error("❌ Chat connection error:", error.message);
      reject(error);
    });

    chatSocket.on("disconnect", (reason) => {
      console.log("🔌 Disconnected from chat:", reason);
    });

    // Chat event listeners
    chatSocket.on("chat-joined", (data) => {
      console.log("🚪 Joined chat session:", data.sessionId);
    });

    chatSocket.on("message_received", (message) => {
      console.log("📨 Message received:", {
        id: message.id,
        username: message.username,
        content: message.content,
        timestamp: message.timestamp,
      });
    });

    chatSocket.on("chat-error", (error) => {
      console.error("❌ Chat error:", error.message);
    });

    chatSocket.on("participant-joined", (data) => {
      console.log("👋 Participant joined:", data.participant.username);
    });

    chatSocket.on("participant-left", (data) => {
      console.log("👋 Participant left:", data.userId);
    });
  });
}

// Join chat session
function joinChatSession() {
  return new Promise((resolve, reject) => {
    console.log("🚪 Joining chat session:", SESSION_ID);

    const username =
      `${user.firstName} ${user.lastName}`.trim() ||
      user.email ||
      "Unknown User";

    chatSocket.emit("join_session", {
      sessionId: SESSION_ID,
      userId: user.id,
      username: username,
    });

    // Wait for join confirmation
    const timeout = setTimeout(() => {
      reject(new Error("Join session timeout"));
    }, 5000);

    chatSocket.once("chat-joined", (data) => {
      clearTimeout(timeout);
      console.log("✅ Successfully joined session");
      resolve(data);
    });

    chatSocket.once("chat-error", (error) => {
      clearTimeout(timeout);
      reject(new Error(error.message));
    });
  });
}

// Send a message
function sendMessage(content, messageNumber) {
  return new Promise((resolve, reject) => {
    console.log(`📤 Sending message ${messageNumber}: "${content}"`);

    chatSocket.emit("send_message", {
      sessionId: SESSION_ID,
      content: content,
      type: "text",
    });

    // Wait for message to be received back
    const timeout = setTimeout(() => {
      reject(new Error(`Message ${messageNumber} timeout`));
    }, 10000);

    const messageHandler = (message) => {
      if (message.content === content) {
        clearTimeout(timeout);
        chatSocket.off("message_received", messageHandler);
        console.log(`✅ Message ${messageNumber} confirmed received`);
        resolve(message);
      }
    };

    chatSocket.on("message_received", messageHandler);

    // Also listen for errors
    const errorHandler = (error) => {
      clearTimeout(timeout);
      chatSocket.off("message_received", messageHandler);
      chatSocket.off("chat-error", errorHandler);
      reject(new Error(`Message ${messageNumber} error: ${error.message}`));
    };

    chatSocket.once("chat-error", errorHandler);
  });
}

// Main test function
async function runChatTest() {
  console.log("🧪 Starting comprehensive chat test...\n");

  try {
    // Step 1: Login
    const loginSuccess = await login();
    if (!loginSuccess) {
      throw new Error("Login failed");
    }
    await wait(1000);

    // Step 2: Connect to chat
    await connectToChat();
    await wait(1000);

    // Step 3: Join session
    await joinChatSession();
    await wait(1000);

    // Step 4: Send multiple messages
    console.log("\n📨 Testing multiple messages...");

    const messages = [
      "Hello, this is message 1",
      "Second message to test continuity",
      "Third message - checking if chat works",
      "Fourth message - still going strong",
      "Fifth and final test message",
    ];

    for (let i = 0; i < messages.length; i++) {
      try {
        await sendMessage(messages[i], i + 1);
        await wait(2000); // Wait 2 seconds between messages
      } catch (error) {
        console.error(`❌ Failed to send message ${i + 1}:`, error.message);
        throw error;
      }
    }

    console.log(
      "\n✅ All messages sent successfully! Chat system is working properly."
    );
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
  } finally {
    if (chatSocket) {
      chatSocket.disconnect();
      console.log("🔌 Disconnected from chat");
    }
    process.exit(0);
  }
}

// Run the test
runChatTest().catch(console.error);
