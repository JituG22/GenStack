// Script to inspect the current video element and React component state
// Run this in the browser console after the diagnostic

console.log("🔍 Inspecting current video element...");

// Find all video elements
const videos = document.querySelectorAll("video");
console.log(`Found ${videos.length} video elements:`);

videos.forEach((video, index) => {
  console.log(`Video ${index}:`, {
    id: video.id || "NO_ID",
    className: video.className,
    srcObject: video.srcObject ? "HAS_STREAM" : "NO_STREAM",
    src: video.src || "NO_SRC",
    autoplay: video.autoplay,
    muted: video.muted,
    width: video.videoWidth,
    height: video.videoHeight,
    readyState: video.readyState,
    paused: video.paused,
    currentTime: video.currentTime,
    duration: video.duration,
    style: {
      display: video.style.display,
      visibility: video.style.visibility,
      width: video.style.width,
      height: video.style.height,
    },
    parentElement: video.parentElement?.tagName,
    parentClass: video.parentElement?.className,
  });

  // Check if the video has a stream
  if (video.srcObject) {
    const stream = video.srcObject;
    console.log(`Video ${index} stream details:`, {
      id: stream.id,
      active: stream.active,
      videoTracks: stream.getVideoTracks().length,
      audioTracks: stream.getAudioTracks().length,
      tracks: stream.getTracks().map((t) => ({
        kind: t.kind,
        label: t.label,
        enabled: t.enabled,
        readyState: t.readyState,
      })),
    });
  }
});

// Look for WebRTC-related React components
console.log("🔍 Looking for WebRTC UI elements...");

// Look for buttons or controls
const buttons = document.querySelectorAll("button");
const webrtcButtons = Array.from(buttons).filter(
  (btn) =>
    btn.textContent.toLowerCase().includes("join") ||
    btn.textContent.toLowerCase().includes("call") ||
    btn.textContent.toLowerCase().includes("video") ||
    btn.textContent.toLowerCase().includes("webrtc")
);

console.log(
  `Found ${webrtcButtons.length} potentially WebRTC-related buttons:`
);
webrtcButtons.forEach((btn, index) => {
  console.log(`Button ${index}:`, {
    text: btn.textContent,
    className: btn.className,
    disabled: btn.disabled,
    onClick: btn.onclick ? "HAS_HANDLER" : "NO_HANDLER",
  });
});

// Look for any elements with WebRTC-related classes or IDs
const webrtcElements = document.querySelectorAll(
  '[class*="webrtc"], [class*="video"], [class*="call"], [id*="webrtc"], [id*="video"], [id*="call"]'
);
console.log(
  `Found ${webrtcElements.length} elements with WebRTC-related classes/IDs:`
);
webrtcElements.forEach((el, index) => {
  console.log(`Element ${index}:`, {
    tagName: el.tagName,
    id: el.id,
    className: el.className,
    textContent:
      el.textContent?.substring(0, 50) +
      (el.textContent?.length > 50 ? "..." : ""),
  });
});

console.log("🔍 Inspection complete!");
console.log("📋 Next steps:");
console.log("1. Try to join a WebRTC room");
console.log("2. Watch for getUserMedia calls in the console");
console.log("3. Check if the video element gets a stream assigned");
