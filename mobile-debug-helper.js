// Mobile WebRTC Debug Helper
// Run this in your mobile browser console to diagnose video call issues

console.log("📱 Mobile WebRTC Debug Helper Started");

// Function to test mobile media access
async function testMobileMediaAccess() {
  console.log("🔍 Testing mobile media access...");

  // Device info
  console.log("📱 User Agent:", navigator.userAgent);
  console.log(
    "📱 Is Mobile:",
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )
  );

  // Check for getUserMedia support
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    console.error("❌ getUserMedia not supported");
    return false;
  }

  console.log("✅ getUserMedia is supported");

  // Test permissions API
  if ("permissions" in navigator) {
    try {
      const cameraPermission = await navigator.permissions.query({
        name: "camera",
      });
      const microphonePermission = await navigator.permissions.query({
        name: "microphone",
      });
      console.log("📷 Camera permission:", cameraPermission.state);
      console.log("🎤 Microphone permission:", microphonePermission.state);
    } catch (e) {
      console.log("⚠️ Permissions API not fully supported");
    }
  }

  // Test basic media access
  try {
    console.log("🧪 Testing basic media access...");
    const basicStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    console.log("✅ Basic media access successful!");
    console.log("📊 Stream info:", {
      id: basicStream.id,
      active: basicStream.active,
      videoTracks: basicStream.getVideoTracks().length,
      audioTracks: basicStream.getAudioTracks().length,
    });
    basicStream.getTracks().forEach((track) => track.stop());
    return true;
  } catch (error) {
    console.error("❌ Basic media access failed:", error.name, error.message);
    return false;
  }
}

// Function to test mobile-optimized constraints
async function testMobileConstraints() {
  console.log("🧪 Testing mobile-optimized constraints...");

  const mobileConstraints = {
    video: {
      width: { ideal: 320 },
      height: { ideal: 240 },
      frameRate: { ideal: 15 },
    },
    audio: true,
  };

  try {
    const stream = await navigator.mediaDevices.getUserMedia(mobileConstraints);
    console.log("✅ Mobile constraints successful!");
    console.log("📊 Stream details:", {
      videoTracks: stream.getVideoTracks().map((track) => ({
        kind: track.kind,
        label: track.label,
        enabled: track.enabled,
        readyState: track.readyState,
        settings: track.getSettings(),
      })),
    });
    stream.getTracks().forEach((track) => track.stop());
    return true;
  } catch (error) {
    console.error("❌ Mobile constraints failed:", error.name, error.message);
    return false;
  }
}

// Function to test network connectivity
async function testNetworkConnectivity() {
  console.log("🌐 Testing network connectivity...");

  const apiUrl =
    window.location.hostname === "localhost"
      ? "http://localhost:5000"
      : `http://${window.location.hostname}:5000`;

  console.log("🔗 Testing API URL:", apiUrl);

  try {
    const response = await fetch(`${apiUrl}/health`);
    if (response.ok) {
      console.log("✅ Backend connectivity successful!");
      return true;
    } else {
      console.error("❌ Backend returned error:", response.status);
      return false;
    }
  } catch (error) {
    console.error("❌ Backend connectivity failed:", error);
    return false;
  }
}

// Run comprehensive test
async function runMobileDebugTest() {
  console.log("🚀 Starting comprehensive mobile debug test...");

  const results = {
    mediaAccess: await testMobileMediaAccess(),
    mobileConstraints: await testMobileConstraints(),
    networkConnectivity: await testNetworkConnectivity(),
  };

  console.log("📊 Test Results:", results);

  if (
    results.mediaAccess &&
    results.mobileConstraints &&
    results.networkConnectivity
  ) {
    console.log("🎉 All tests passed! Your device should support video calls.");
  } else {
    console.log("⚠️ Some tests failed. Check the details above.");
  }

  return results;
}

// Make functions available globally for easy testing
window.mobileDebug = {
  testMediaAccess: testMobileMediaAccess,
  testConstraints: testMobileConstraints,
  testNetwork: testNetworkConnectivity,
  runAll: runMobileDebugTest,
};

console.log("✅ Mobile debug helper loaded! Use:");
console.log("   window.mobileDebug.runAll() - Run all tests");
console.log("   window.mobileDebug.testMediaAccess() - Test media access");
console.log(
  "   window.mobileDebug.testConstraints() - Test mobile constraints"
);
console.log("   window.mobileDebug.testNetwork() - Test network connectivity");
