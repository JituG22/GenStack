// WebRTC Performance Monitor
// Run this to monitor real-time performance metrics

console.log("🚀 Starting WebRTC Performance Monitor...");

class WebRTCPerformanceMonitor {
  constructor() {
    this.isMonitoring = false;
    this.metrics = [];
    this.startTime = null;
  }

  startMonitoring() {
    if (this.isMonitoring) {
      console.log("⚠️ Monitoring already active");
      return;
    }

    this.isMonitoring = true;
    this.startTime = Date.now();
    this.metrics = [];

    console.log("🔍 Performance monitoring started...");

    const monitorInterval = setInterval(() => {
      if (!this.isMonitoring) {
        clearInterval(monitorInterval);
        return;
      }

      const metrics = this.captureMetrics();
      this.metrics.push(metrics);

      // Log every 5 seconds
      if (this.metrics.length % 5 === 0) {
        console.log("📊 Performance Update:", metrics);
      }
    }, 1000);

    return monitorInterval;
  }

  stopMonitoring() {
    this.isMonitoring = false;
    console.log("🛑 Performance monitoring stopped");
    this.generateReport();
  }

  captureMetrics() {
    const now = Date.now();
    const elapsed = this.startTime ? now - this.startTime : 0;

    // Video elements metrics
    const videos = document.querySelectorAll("video");
    const videoMetrics = Array.from(videos).map((video) => ({
      hasStream: !!video.srcObject,
      playing: !video.paused,
      dimensions: `${video.videoWidth}x${video.videoHeight}`,
      readyState: video.readyState,
      currentTime: video.currentTime,
    }));

    // Memory metrics
    const memory = performance.memory
      ? {
          used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
          total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
          limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024),
        }
      : null;

    // CPU approximation
    const cpuStart = performance.now();
    for (let i = 0; i < 1000; i++) {
      Math.random();
    }
    const cpuTime = performance.now() - cpuStart;

    return {
      timestamp: now,
      elapsed,
      videoElements: videos.length,
      videoMetrics,
      memory,
      cpuTime: Math.round(cpuTime * 100) / 100,
      connectionCount: document.querySelectorAll('[class*="bg-gray-800"]')
        .length,
    };
  }

  generateReport() {
    if (this.metrics.length === 0) {
      console.log("❌ No metrics collected");
      return;
    }

    const totalTime = this.metrics[this.metrics.length - 1].elapsed;
    const avgCpuTime =
      this.metrics.reduce((sum, m) => sum + m.cpuTime, 0) / this.metrics.length;

    const memoryTrend = this.metrics.map((m) => m.memory?.used || 0);
    const maxMemory = Math.max(...memoryTrend);
    const minMemory = Math.min(...memoryTrend.filter((m) => m > 0));

    const report = {
      duration: `${Math.round(totalTime / 1000)}s`,
      totalSamples: this.metrics.length,
      avgCpuTime: Math.round(avgCpuTime * 100) / 100,
      memoryUsage: {
        min: minMemory,
        max: maxMemory,
        trend: maxMemory - minMemory > 10 ? "Increasing" : "Stable",
      },
      videoElementsStable: this.metrics.every(
        (m) => m.videoElements === this.metrics[0].videoElements
      ),
      recommendations: [],
    };

    // Generate recommendations
    if (avgCpuTime > 5) {
      report.recommendations.push(
        "High CPU usage detected - consider optimizing video processing"
      );
    }
    if (maxMemory - minMemory > 50) {
      report.recommendations.push(
        "Memory usage increasing - check for memory leaks"
      );
    }
    if (!report.videoElementsStable) {
      report.recommendations.push(
        "Video elements changing - check component stability"
      );
    }

    console.log("\n" + "=".repeat(50));
    console.log("📊 PERFORMANCE REPORT");
    console.log("=".repeat(50));
    console.log(report);
    console.log("\n📈 Detailed Metrics:");
    console.log(this.metrics);

    return report;
  }

  quickTest() {
    console.log("⚡ Running quick performance test...");

    const testStart = performance.now();

    // Test video element access
    const videos = document.querySelectorAll("video");
    console.log(`📹 Found ${videos.length} video elements`);

    // Test stream access if available
    let streamTests = 0;
    videos.forEach((video) => {
      if (video.srcObject) {
        streamTests++;
        const stream = video.srcObject;
        console.log(`🎥 Stream ${streamTests}:`, {
          active: stream.active,
          tracks: stream.getTracks().length,
        });
      }
    });

    // Memory snapshot
    if (performance.memory) {
      console.log("💾 Memory:", {
        used: `${Math.round(
          performance.memory.usedJSHeapSize / 1024 / 1024
        )}MB`,
        total: `${Math.round(
          performance.memory.totalJSHeapSize / 1024 / 1024
        )}MB`,
      });
    }

    const testTime = performance.now() - testStart;
    console.log(`⏱️  Test completed in ${Math.round(testTime * 100) / 100}ms`);

    return {
      videoElements: videos.length,
      activeStreams: streamTests,
      testDuration: testTime,
      memoryUsed: performance.memory
        ? Math.round(performance.memory.usedJSHeapSize / 1024 / 1024)
        : null,
    };
  }
}

// Create global monitor instance
window.webrtcMonitor = new WebRTCPerformanceMonitor();

console.log("🔧 WebRTC Performance Monitor loaded!");
console.log("💡 Commands:");
console.log("  webrtcMonitor.startMonitoring() - Start real-time monitoring");
console.log(
  "  webrtcMonitor.stopMonitoring() - Stop monitoring and get report"
);
console.log("  webrtcMonitor.quickTest() - Run quick performance test");
