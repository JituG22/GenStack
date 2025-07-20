// Video Element Diagnostic Script
// Run this in the browser console to check video element state

console.log("🔍 Video Element Diagnostic Starting...");

// Check all video elements
const videos = document.querySelectorAll("video");
console.log(`Found ${videos.length} video elements:`);

videos.forEach((video, i) => {
  console.log(`\n=== Video Element ${i} ===`);
  console.log("Basic Properties:", {
    id: video.id || "NO_ID",
    className: video.className,
    hasStream: !!video.srcObject,
    playing: !video.paused,
    videoWidth: video.videoWidth,
    videoHeight: video.videoHeight,
    readyState: video.readyState,
    currentTime: video.currentTime,
    duration: video.duration,
  });

  console.log("Positioning:", {
    visible: video.style.display !== "none",
    position: video.getBoundingClientRect(),
    computedStyle: {
      display: getComputedStyle(video).display,
      visibility: getComputedStyle(video).visibility,
      opacity: getComputedStyle(video).opacity,
      width: getComputedStyle(video).width,
      height: getComputedStyle(video).height,
    },
  });

  if (video.srcObject) {
    const stream = video.srcObject;
    console.log("Stream Details:", {
      id: stream.id,
      active: stream.active,
      videoTracks: stream.getVideoTracks().length,
      audioTracks: stream.getAudioTracks().length,
      tracks: stream.getTracks().map((t) => ({
        kind: t.kind,
        label: t.label,
        enabled: t.enabled,
        readyState: t.readyState,
        settings: t.kind === "video" ? t.getSettings() : null,
      })),
    });

    // Try to force play the video
    console.log("🎬 Attempting to play video...");
    video
      .play()
      .then(() => {
        console.log("✅ Video play successful");
      })
      .catch((err) => {
        console.log("❌ Video play failed:", err);
      });
  } else {
    console.log("❌ No stream attached to this video element");
  }

  // Check parent container
  console.log("Parent Container:", {
    tagName: video.parentElement?.tagName,
    className: video.parentElement?.className,
    position: video.parentElement?.getBoundingClientRect(),
  });
});

// Check for local video specifically
const localVideoContainer = document.querySelector(".absolute.top-4.right-4");
console.log("\n=== Local Video Container ===");
if (localVideoContainer) {
  console.log("✅ Local video container found:", {
    position: localVideoContainer.getBoundingClientRect(),
    style: {
      display: getComputedStyle(localVideoContainer).display,
      visibility: getComputedStyle(localVideoContainer).visibility,
      opacity: getComputedStyle(localVideoContainer).opacity,
    },
  });

  const videoInContainer = localVideoContainer.querySelector("video");
  if (videoInContainer) {
    console.log("✅ Video found in local container");
  } else {
    console.log("❌ No video found in local container");
  }
} else {
  console.log("❌ Local video container not found");
}

// Check if we're in active room state
const activeRoomIndicator = document.querySelector(".bg-gray-900");
console.log("\n=== Room State ===");
console.log("Active room UI:", !!activeRoomIndicator);

if (activeRoomIndicator) {
  console.log("✅ In active room - video UI should be visible");
} else {
  console.log("❌ Not in active room - still in room list view");
}

console.log("\n=== Diagnostic Complete ===");
console.log(
  "💡 If videos exist but aren't visible, there might be a CSS/positioning issue"
);
console.log("💡 If no videos exist, the stream assignment failed");
console.log(
  "💡 If videos exist with no stream, the getUserMedia result wasn't assigned properly"
);
