// Enhanced WebRTC Debug Script for Browser Console
// Copy and paste this into the browser console when on the app page

console.log("🚀 Starting Enhanced WebRTC Debug Session...");

// Enhanced logging function
function debugLog(message, data = null, type = "info") {
  const timestamp = new Date().toLocaleTimeString();
  const emoji =
    type === "error"
      ? "❌"
      : type === "success"
      ? "✅"
      : type === "warning"
      ? "⚠️"
      : "🔍";

  console.log(`${emoji} [${timestamp}] ${message}`);
  if (data) {
    console.log(data);
  }
}

// Function to test basic camera access
async function testCameraAccess() {
  debugLog("Testing basic camera access...");
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });
    debugLog(
      "Basic camera access successful!",
      {
        streamId: stream.id,
        active: stream.active,
        videoTracks: stream.getVideoTracks().length,
      },
      "success"
    );

    // Create a test video element
    const testVideo = document.createElement("video");
    testVideo.autoplay = true;
    testVideo.muted = true;
    testVideo.style.position = "fixed";
    testVideo.style.top = "10px";
    testVideo.style.right = "10px";
    testVideo.style.width = "200px";
    testVideo.style.height = "150px";
    testVideo.style.border = "2px solid green";
    testVideo.style.zIndex = "10000";
    testVideo.srcObject = stream;
    document.body.appendChild(testVideo);

    debugLog("Test video element added to page", null, "success");

    // Remove after 10 seconds
    setTimeout(() => {
      stream.getTracks().forEach((track) => track.stop());
      document.body.removeChild(testVideo);
      debugLog("Test video stopped and removed", null, "info");
    }, 10000);

    return true;
  } catch (error) {
    debugLog(
      "Basic camera access failed!",
      {
        name: error.name,
        message: error.message,
        toString: error.toString(),
      },
      "error"
    );
    return false;
  }
}

// Function to check browser capabilities
function checkBrowserCapabilities() {
  debugLog("Checking browser capabilities...");

  const capabilities = {
    getUserMedia: !!(
      navigator.mediaDevices && navigator.mediaDevices.getUserMedia
    ),
    enumerateDevices: !!(
      navigator.mediaDevices && navigator.mediaDevices.enumerateDevices
    ),
    RTCPeerConnection: !!window.RTCPeerConnection,
    secureContext: window.isSecureContext,
    protocol: window.location.protocol,
    userAgent: navigator.userAgent,
  };

  debugLog(
    "Browser capabilities:",
    capabilities,
    capabilities.getUserMedia ? "success" : "error"
  );
  return capabilities;
}

// Function to enumerate devices
async function checkDevices() {
  debugLog("Enumerating media devices...");
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter((d) => d.kind === "videoinput");
    const audioDevices = devices.filter((d) => d.kind === "audioinput");

    debugLog(
      "Device enumeration successful!",
      {
        total: devices.length,
        video: videoDevices.length,
        audio: audioDevices.length,
        videoDevices: videoDevices.map((d) => ({
          label: d.label,
          deviceId: d.deviceId,
        })),
        audioDevices: audioDevices.map((d) => ({
          label: d.label,
          deviceId: d.deviceId,
        })),
      },
      "success"
    );

    return { videoDevices, audioDevices };
  } catch (error) {
    debugLog("Device enumeration failed!", error, "error");
    return null;
  }
}

// Function to monitor React component state
function monitorReactState() {
  debugLog("Monitoring React component state...");

  // Try to find WebRTC-related elements
  const videoElements = document.querySelectorAll("video");
  const webrtcButtons = document.querySelectorAll(
    'button[class*="webrtc"], button[class*="video"], button[class*="call"]'
  );

  debugLog(
    "Found elements:",
    {
      videoElements: videoElements.length,
      webrtcButtons: webrtcButtons.length,
      videos: Array.from(videoElements).map((v) => ({
        id: v.id,
        className: v.className,
        srcObject: !!v.srcObject,
        src: v.src,
        autoplay: v.autoplay,
        muted: v.muted,
      })),
    },
    "info"
  );

  // Try to access React DevTools if available
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    debugLog("React DevTools detected", null, "success");
  } else {
    debugLog("React DevTools not available", null, "warning");
  }
}

// Function to intercept getUserMedia calls
function interceptGetUserMedia() {
  debugLog("Setting up getUserMedia interception...");

  const originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(
    navigator.mediaDevices
  );

  navigator.mediaDevices.getUserMedia = async function (constraints) {
    debugLog("🎥 getUserMedia called!", constraints, "info");

    try {
      const stream = await originalGetUserMedia(constraints);
      debugLog(
        "🎥 getUserMedia successful!",
        {
          streamId: stream.id,
          active: stream.active,
          videoTracks: stream.getVideoTracks().length,
          audioTracks: stream.getAudioTracks().length,
          tracks: stream.getTracks().map((t) => ({
            kind: t.kind,
            label: t.label,
            enabled: t.enabled,
            readyState: t.readyState,
          })),
        },
        "success"
      );

      return stream;
    } catch (error) {
      debugLog(
        "🎥 getUserMedia failed!",
        {
          name: error.name,
          message: error.message,
          constraints: constraints,
        },
        "error"
      );
      throw error;
    }
  };

  debugLog("getUserMedia interception set up", null, "success");
}

// Function to monitor video element changes
function monitorVideoElements() {
  debugLog("Setting up video element monitoring...");

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.tagName === "VIDEO") {
          debugLog(
            "📹 New video element added!",
            {
              id: node.id,
              className: node.className,
              autoplay: node.autoplay,
              muted: node.muted,
            },
            "info"
          );

          // Monitor this video element
          node.addEventListener("loadedmetadata", () => {
            debugLog(
              "📹 Video metadata loaded",
              { videoId: node.id },
              "success"
            );
          });

          node.addEventListener("canplay", () => {
            debugLog("📹 Video can play", { videoId: node.id }, "success");
          });

          node.addEventListener("error", (e) => {
            debugLog("📹 Video error", { videoId: node.id, error: e }, "error");
          });
        }
      });
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
  debugLog("Video element monitoring active", null, "success");
}

// Main debug function
async function runFullDiagnostic() {
  console.clear();
  debugLog("🚀 Starting Full WebRTC Diagnostic...", null, "info");

  console.group("Browser Capabilities");
  const capabilities = checkBrowserCapabilities();
  console.groupEnd();

  if (!capabilities.getUserMedia) {
    debugLog("getUserMedia not supported - aborting", null, "error");
    return;
  }

  console.group("Device Enumeration");
  const devices = await checkDevices();
  console.groupEnd();

  if (!devices || devices.videoDevices.length === 0) {
    debugLog("No video devices found - aborting", null, "error");
    return;
  }

  console.group("Camera Access Test");
  const cameraWorking = await testCameraAccess();
  console.groupEnd();

  console.group("React Component Monitoring");
  monitorReactState();
  console.groupEnd();

  // Set up monitoring
  interceptGetUserMedia();
  monitorVideoElements();

  debugLog(
    "🎉 Full diagnostic complete! Monitoring is now active.",
    null,
    "success"
  );
  debugLog(
    "Try joining a WebRTC room now and watch the console output.",
    null,
    "info"
  );
}

// Utility functions to call manually
window.webrtcDebug = {
  runFullDiagnostic,
  testCameraAccess,
  checkBrowserCapabilities,
  checkDevices,
  monitorReactState,
  interceptGetUserMedia,
  monitorVideoElements,
};

debugLog(
  "🔧 WebRTC Debug tools loaded! Run 'webrtcDebug.runFullDiagnostic()' to start.",
  null,
  "success"
);
debugLog("Available functions:", Object.keys(window.webrtcDebug), "info");
