// WebRTC Room Join Debug Script
// Run this in the browser console to test room joining

console.log("🚀 WebRTC Room Join Debug Script loaded!");

// Function to list available rooms
function listRooms() {
  const rooms = document.querySelectorAll(
    '[class*="border border-gray-200 rounded-lg"]'
  );
  console.log(`🏠 Found ${rooms.length} rooms in the UI:`);

  rooms.forEach((roomEl, index) => {
    const nameEl = roomEl.querySelector("h4");
    const joinBtn = roomEl.querySelector('button[class*="bg-green"]');
    const name = nameEl ? nameEl.textContent : "Unknown";

    console.log(
      `Room ${index}: "${name}" - Join button: ${
        joinBtn ? "Available" : "Not found"
      }`
    );

    if (joinBtn) {
      // Add click listener to monitor join attempts
      const originalClick = joinBtn.onclick;
      joinBtn.onclick = function (e) {
        console.log(`🎯 ATTEMPTING TO JOIN ROOM: "${name}"`);
        console.log("🎯 Starting getUserMedia monitoring...");

        // Call original handler
        if (originalClick) {
          originalClick.call(this, e);
        }
      };
    }
  });

  return rooms.length;
}

// Function to create a test room
function createTestRoom() {
  console.log("🏗️ Creating test room...");
  const createBtn = document.querySelector('button[class*="bg-blue-500"]');

  if (createBtn && createBtn.textContent.includes("Create New Room")) {
    console.log("✅ Found create room button, clicking...");
    createBtn.click();

    // Wait for prompt and auto-fill
    setTimeout(() => {
      console.log("🎯 Auto-filling room name...");
      // Note: Can't auto-fill prompt, user needs to enter name
    }, 100);
  } else {
    console.log("❌ Create room button not found");
  }
}

// Function to automatically join the first available room
function joinFirstRoom() {
  const joinButtons = document.querySelectorAll('button[class*="bg-green"]');

  if (joinButtons.length > 0) {
    console.log(
      `🎯 Found ${joinButtons.length} join buttons, clicking the first one...`
    );

    // Setup monitoring before clicking
    console.log("🔍 Setting up pre-join monitoring...");

    // Click the first join button
    joinButtons[0].click();

    console.log(
      "✅ Join button clicked! Watch console for getUserMedia calls..."
    );
    return true;
  } else {
    console.log("❌ No join buttons found. Creating a test room first...");
    createTestRoom();
    return false;
  }
}

// Function to monitor React state changes
function monitorReactState() {
  console.log("🔍 Setting up React state monitoring...");

  // Monitor for new video elements
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.tagName === "VIDEO") {
          console.log("🎥 NEW VIDEO ELEMENT DETECTED!", {
            id: node.id,
            className: node.className,
            srcObject: !!node.srcObject,
            autoplay: node.autoplay,
            muted: node.muted,
          });
        }

        // Monitor for active room UI changes
        if (
          node.nodeType === 1 &&
          node.querySelector &&
          node.querySelector(".bg-gray-900")
        ) {
          console.log("🏠 ACTIVE ROOM UI DETECTED!");
        }
      });
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
  console.log("✅ React state monitoring active");
}

// Main test function
function runJoinTest() {
  console.clear();
  console.log("🚀 Starting WebRTC Join Test...");

  // Step 1: List available rooms
  const roomCount = listRooms();

  // Step 2: Set up monitoring
  monitorReactState();

  // Step 3: Attempt to join or create room
  if (roomCount > 0) {
    console.log("📋 Next step: Try joining a room by clicking a Join button");
    console.log("Or run: joinFirstRoom() to auto-join the first room");
  } else {
    console.log("📋 No rooms found. Run: createTestRoom() to create one");
  }
}

// Export functions for manual use
window.webrtcJoinDebug = {
  runJoinTest,
  listRooms,
  createTestRoom,
  joinFirstRoom,
  monitorReactState,
};

console.log("🔧 WebRTC Join Debug tools loaded!");
console.log("Available functions:", Object.keys(window.webrtcJoinDebug));
console.log("💡 Run 'webrtcJoinDebug.runJoinTest()' to start");
