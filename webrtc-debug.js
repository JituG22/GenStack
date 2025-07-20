/**
 * WebRTC Video Streaming Debug Helper
 *
 * Run this script in the browser console to diagnose video streaming issues
 */

console.log("🔍 WebRTC Video Debug Helper Started");
console.log("=====================================");

// Check basic browser support
console.log("1. Browser Support Check:");
console.log("   - Navigator.mediaDevices:", !!navigator.mediaDevices);
console.log(
  "   - getUserMedia available:",
  !!navigator.mediaDevices?.getUserMedia
);
console.log("   - RTCPeerConnection available:", !!window.RTCPeerConnection);
console.log("   - User Agent:", navigator.userAgent);

// Test basic getUserMedia
async function testGetUserMedia() {
  console.log("\n2. Testing getUserMedia:");

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480 },
      audio: true,
    });

    console.log("   ✅ getUserMedia SUCCESS");
    console.log("   - Stream ID:", stream.id);
    console.log("   - Stream active:", stream.active);
    console.log("   - Video tracks:", stream.getVideoTracks().length);
    console.log("   - Audio tracks:", stream.getAudioTracks().length);

    stream.getTracks().forEach((track, i) => {
      console.log(`   - Track ${i}:`, {
        kind: track.kind,
        enabled: track.enabled,
        readyState: track.readyState,
        label: track.label,
      });
    });

    // Test video element
    console.log("\n3. Testing Video Element:");
    const video = document.createElement("video");
    video.style.position = "fixed";
    video.style.top = "10px";
    video.style.right = "10px";
    video.style.width = "200px";
    video.style.height = "150px";
    video.style.border = "2px solid red";
    video.style.zIndex = "9999";
    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;

    document.body.appendChild(video);

    video.srcObject = stream;

    video.onloadedmetadata = () => {
      console.log("   ✅ Video metadata loaded");
      console.log(
        "   - Video dimensions:",
        video.videoWidth,
        "x",
        video.videoHeight
      );
    };

    video.oncanplay = () => {
      console.log("   ✅ Video can play");
    };

    video.onplay = () => {
      console.log("   ✅ Video started playing");
    };

    video.onerror = (error) => {
      console.error("   ❌ Video error:", error);
    };

    try {
      await video.play();
      console.log("   ✅ Video play() succeeded");
    } catch (playError) {
      console.warn("   ⚠️ Video auto-play failed:", playError);
    }

    // Clean up after 10 seconds
    setTimeout(() => {
      stream.getTracks().forEach((track) => track.stop());
      document.body.removeChild(video);
      console.log("   🧹 Test cleanup completed");
    }, 10000);
  } catch (error) {
    console.error("   ❌ getUserMedia FAILED:", error);
    console.error("   - Error name:", error.name);
    console.error("   - Error message:", error.message);

    if (error.name === "NotAllowedError") {
      console.log("   💡 Solution: Grant camera/microphone permissions");
    } else if (error.name === "NotFoundError") {
      console.log("   💡 Solution: Connect a camera/microphone device");
    } else if (error.name === "NotReadableError") {
      console.log("   💡 Solution: Close other apps using camera/microphone");
    }
  }
}

// Test device enumeration
async function testDeviceEnumeration() {
  console.log("\n4. Device Enumeration:");

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    console.log("   - Total devices:", devices.length);

    const videoDevices = devices.filter(
      (device) => device.kind === "videoinput"
    );
    const audioDevices = devices.filter(
      (device) => device.kind === "audioinput"
    );

    console.log("   - Video input devices:", videoDevices.length);
    console.log("   - Audio input devices:", audioDevices.length);

    videoDevices.forEach((device, i) => {
      console.log(`   - Video ${i}:`, device.label || "Unnamed Device");
    });

    audioDevices.forEach((device, i) => {
      console.log(`   - Audio ${i}:`, device.label || "Unnamed Device");
    });
  } catch (error) {
    console.error("   ❌ Device enumeration failed:", error);
  }
}

// Check existing video elements
function checkExistingVideoElements() {
  console.log("\n5. Existing Video Elements:");

  const videos = document.querySelectorAll("video");
  console.log("   - Found video elements:", videos.length);

  videos.forEach((video, i) => {
    console.log(`   - Video ${i}:`, {
      paused: video.paused,
      readyState: video.readyState,
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight,
      srcObject: !!video.srcObject,
      src: video.src || "none",
      autoplay: video.autoplay,
      muted: video.muted,
    });

    if (video.srcObject) {
      const stream = video.srcObject;
      console.log(`   - Video ${i} stream:`, {
        id: stream.id,
        active: stream.active,
        tracks: stream.getTracks().length,
      });
    }
  });
}

// Run all tests
async function runAllTests() {
  await testDeviceEnumeration();
  checkExistingVideoElements();
  await testGetUserMedia();

  console.log("\n=====================================");
  console.log("🏁 WebRTC Video Debug Helper Complete");
  console.log("=====================================");
}

// Auto-run tests
runAllTests();

// Export functions for manual testing
window.webrtcDebug = {
  testGetUserMedia,
  testDeviceEnumeration,
  checkExistingVideoElements,
  runAllTests,
};
