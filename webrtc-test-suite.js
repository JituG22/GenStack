// Comprehensive WebRTC Testing Suite
// Run this in the browser console for full system testing

console.log("🚀 Starting Comprehensive WebRTC Testing Suite...");

class WebRTCTester {
  constructor() {
    this.testResults = {};
    this.startTime = Date.now();
  }

  // Test 1: Basic Browser Compatibility
  async testBrowserCompatibility() {
    console.log("\n=== Test 1: Browser Compatibility ===");
    const results = {
      getUserMedia: !!(
        navigator.mediaDevices && navigator.mediaDevices.getUserMedia
      ),
      enumerateDevices: !!(
        navigator.mediaDevices && navigator.mediaDevices.enumerateDevices
      ),
      RTCPeerConnection: !!window.RTCPeerConnection,
      secureContext: window.isSecureContext,
      protocol: window.location.protocol,
      userAgent: navigator.userAgent.includes("Chrome")
        ? "Chrome"
        : navigator.userAgent.includes("Firefox")
        ? "Firefox"
        : navigator.userAgent.includes("Safari")
        ? "Safari"
        : "Other",
    };

    console.log("Browser Support:", results);
    this.testResults.browserCompatibility = results;
    return (
      results.getUserMedia && results.RTCPeerConnection && results.secureContext
    );
  }

  // Test 2: Device Enumeration and Capabilities
  async testDeviceCapabilities() {
    console.log("\n=== Test 2: Device Capabilities ===");
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === "videoinput");
      const audioDevices = devices.filter((d) => d.kind === "audioinput");

      const capabilities = {
        totalDevices: devices.length,
        videoDevices: videoDevices.length,
        audioDevices: audioDevices.length,
        devices: {
          video: videoDevices.map((d) => ({
            label: d.label || "Camera",
            deviceId: d.deviceId,
          })),
          audio: audioDevices.map((d) => ({
            label: d.label || "Microphone",
            deviceId: d.deviceId,
          })),
        },
      };

      console.log("Device Capabilities:", capabilities);
      this.testResults.deviceCapabilities = capabilities;
      return capabilities.videoDevices > 0 && capabilities.audioDevices > 0;
    } catch (error) {
      console.error("Device enumeration failed:", error);
      return false;
    }
  }

  // Test 3: Media Stream Acquisition
  async testMediaStreamAcquisition() {
    console.log("\n=== Test 3: Media Stream Acquisition ===");
    const tests = [
      { name: "Video + Audio", constraints: { video: true, audio: true } },
      { name: "Video Only", constraints: { video: true, audio: false } },
      { name: "Audio Only", constraints: { video: false, audio: true } },
      {
        name: "HD Video",
        constraints: {
          video: { width: 1280, height: 720 },
          audio: true,
        },
      },
      {
        name: "Low Quality",
        constraints: {
          video: { width: 320, height: 240 },
          audio: true,
        },
      },
    ];

    const results = {};

    for (const test of tests) {
      try {
        console.log(`Testing: ${test.name}`);
        const stream = await navigator.mediaDevices.getUserMedia(
          test.constraints
        );

        const streamInfo = {
          success: true,
          streamId: stream.id,
          active: stream.active,
          videoTracks: stream.getVideoTracks().length,
          audioTracks: stream.getAudioTracks().length,
          videoSettings: stream.getVideoTracks()[0]?.getSettings() || null,
          audioSettings: stream.getAudioTracks()[0]?.getSettings() || null,
        };

        console.log(`✅ ${test.name}:`, streamInfo);
        results[test.name] = streamInfo;

        // Clean up
        stream.getTracks().forEach((track) => track.stop());
      } catch (error) {
        console.log(`❌ ${test.name} failed:`, error.message);
        results[test.name] = { success: false, error: error.message };
      }
    }

    this.testResults.mediaStreamAcquisition = results;
    return Object.values(results).some((r) => r.success);
  }

  // Test 4: Video Element Integration
  async testVideoElementIntegration() {
    console.log("\n=== Test 4: Video Element Integration ===");

    try {
      // Get a test stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      // Create test video element
      const testVideo = document.createElement("video");
      testVideo.autoplay = true;
      testVideo.muted = true;
      testVideo.style.position = "fixed";
      testVideo.style.top = "10px";
      testVideo.style.left = "10px";
      testVideo.style.width = "200px";
      testVideo.style.height = "150px";
      testVideo.style.border = "3px solid lime";
      testVideo.style.zIndex = "10000";
      testVideo.id = "webrtc-test-video";

      // Add to page
      document.body.appendChild(testVideo);

      // Test stream assignment
      testVideo.srcObject = stream;

      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.log("❌ Video element test timed out");
          cleanup();
          resolve(false);
        }, 5000);

        testVideo.onloadedmetadata = () => {
          console.log("✅ Video metadata loaded");
        };

        testVideo.oncanplay = () => {
          console.log("✅ Video can play");

          const result = {
            success: true,
            videoWidth: testVideo.videoWidth,
            videoHeight: testVideo.videoHeight,
            duration: testVideo.duration,
            readyState: testVideo.readyState,
          };

          console.log("Video Element Test Result:", result);
          this.testResults.videoElementIntegration = result;

          clearTimeout(timeout);
          cleanup();
          resolve(true);
        };

        testVideo.onerror = (error) => {
          console.log("❌ Video element error:", error);
          clearTimeout(timeout);
          cleanup();
          resolve(false);
        };

        const cleanup = () => {
          stream.getTracks().forEach((track) => track.stop());
          if (document.getElementById("webrtc-test-video")) {
            document.body.removeChild(testVideo);
          }
        };
      });
    } catch (error) {
      console.log("❌ Video element integration test failed:", error);
      return false;
    }
  }

  // Test 5: Current App State
  testCurrentAppState() {
    console.log("\n=== Test 5: Current App State ===");

    const videos = document.querySelectorAll("video");
    const webrtcElements = {
      videoElements: videos.length,
      activeRoom: !!document.querySelector(".bg-gray-900"),
      localVideoContainer: !!document.querySelector(".absolute.top-4.right-4"),
      createRoomButton: !!document.querySelector(
        'button[class*="bg-blue-500"]'
      ),
      joinButtons: document.querySelectorAll('button[class*="bg-green"]')
        .length,
      callControls: !!document.querySelector('[class*="bg-gray-800"]'),
    };

    const videoStates = Array.from(videos).map((video, i) => ({
      index: i,
      hasStream: !!video.srcObject,
      playing: !video.paused,
      dimensions: `${video.videoWidth}x${video.videoHeight}`,
      visible: video.getBoundingClientRect().width > 0,
      position: video.getBoundingClientRect(),
    }));

    const appState = {
      webrtcElements,
      videoStates,
      currentURL: window.location.href,
      timestamp: new Date().toISOString(),
    };

    console.log("Current App State:", appState);
    this.testResults.currentAppState = appState;

    return webrtcElements.videoElements > 0 || webrtcElements.createRoomButton;
  }

  // Test 6: Performance Metrics
  async testPerformanceMetrics() {
    console.log("\n=== Test 6: Performance Metrics ===");

    const startTime = performance.now();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      const acquisitionTime = performance.now() - startTime;

      const metrics = {
        streamAcquisitionTime: Math.round(acquisitionTime),
        memoryUsage: performance.memory
          ? {
              used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
              total: Math.round(
                performance.memory.totalJSHeapSize / 1024 / 1024
              ),
              limit: Math.round(
                performance.memory.jsHeapSizeLimit / 1024 / 1024
              ),
            }
          : "Not available",
        timing: performance.timing
          ? {
              pageLoad:
                performance.timing.loadEventEnd -
                performance.timing.navigationStart,
              domReady:
                performance.timing.domContentLoadedEventEnd -
                performance.timing.navigationStart,
            }
          : "Not available",
      };

      console.log("Performance Metrics:", metrics);
      this.testResults.performanceMetrics = metrics;

      // Clean up
      stream.getTracks().forEach((track) => track.stop());

      return true;
    } catch (error) {
      console.log("❌ Performance test failed:", error);
      return false;
    }
  }

  // Run all tests
  async runAllTests() {
    console.log("🚀 Running Complete WebRTC Test Suite...");
    console.log("=".repeat(50));

    const tests = [
      {
        name: "Browser Compatibility",
        fn: () => this.testBrowserCompatibility(),
      },
      { name: "Device Capabilities", fn: () => this.testDeviceCapabilities() },
      {
        name: "Media Stream Acquisition",
        fn: () => this.testMediaStreamAcquisition(),
      },
      {
        name: "Video Element Integration",
        fn: () => this.testVideoElementIntegration(),
      },
      { name: "Current App State", fn: () => this.testCurrentAppState() },
      { name: "Performance Metrics", fn: () => this.testPerformanceMetrics() },
    ];

    const results = {};

    for (const test of tests) {
      try {
        const result = await test.fn();
        results[test.name] = { success: result, timestamp: Date.now() };
        console.log(
          `${result ? "✅" : "❌"} ${test.name}: ${
            result ? "PASSED" : "FAILED"
          }`
        );
      } catch (error) {
        results[test.name] = { success: false, error: error.message };
        console.log(`❌ ${test.name}: FAILED (${error.message})`);
      }
    }

    // Summary
    const totalTime = Date.now() - this.startTime;
    const passedTests = Object.values(results).filter((r) => r.success).length;
    const totalTests = Object.keys(results).length;

    console.log("\n" + "=".repeat(50));
    console.log("🏁 TEST SUITE COMPLETE");
    console.log("=".repeat(50));
    console.log(`📊 Results: ${passedTests}/${totalTests} tests passed`);
    console.log(`⏱️  Total time: ${totalTime}ms`);
    console.log(
      `🎯 Success rate: ${Math.round((passedTests / totalTests) * 100)}%`
    );

    // Detailed results
    console.log("\n📋 Detailed Results:");
    console.log(this.testResults);

    return {
      summary: {
        passedTests,
        totalTests,
        totalTime,
        successRate: passedTests / totalTests,
      },
      results,
      detailedResults: this.testResults,
    };
  }
}

// Create global tester instance
window.webrtcTester = new WebRTCTester();

console.log("🔧 WebRTC Testing Suite loaded!");
console.log(
  "💡 Run 'webrtcTester.runAllTests()' to start comprehensive testing"
);
console.log(
  "💡 Or run individual tests like 'webrtcTester.testBrowserCompatibility()'"
);
