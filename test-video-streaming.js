#!/usr/bin/env node

/**
 * Video Streaming Test Script
 * Tests WebRTC video functionality
 */

const puppeteer = require("puppeteer");

async function testVideoStreaming() {
  console.log("🎥 Starting video streaming test...");

  let browser;
  try {
    // Launch browser with video/audio permissions
    browser = await puppeteer.launch({
      headless: false, // Show browser for testing
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
        "--allow-running-insecure-content",
        "--disable-web-security",
        "--disable-features=VizDisplayCompositor",
        "--autoplay-policy=no-user-gesture-required",
      ],
    });

    const page = await browser.newPage();

    // Grant camera and microphone permissions
    const context = browser.defaultBrowserContext();
    await context.overridePermissions("http://localhost:3000", [
      "camera",
      "microphone",
    ]);

    // Set viewport
    await page.setViewport({ width: 1280, height: 720 });

    console.log("📱 Opening application...");
    await page.goto("http://localhost:3000", { waitUntil: "networkidle2" });

    // Wait for login form and login
    console.log("🔐 Logging in...");
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.type('input[type="email"]', "admin@example.com");
    await page.type('input[type="password"]', "admin123");
    await page.click('button[type="submit"]');

    // Wait for dashboard
    await page.waitForSelector('[data-testid="dashboard"]', { timeout: 10000 });
    console.log("✅ Logged in successfully");

    // Navigate to Communication page
    console.log("🗨️ Navigating to Communication...");
    await page.click('a[href="/communication"]');
    await page.waitForSelector('[data-testid="communication-page"]', {
      timeout: 5000,
    });

    // Click on Video tab
    console.log("🎥 Clicking Video tab...");
    await page.click('button:has-text("Video")');
    await page.waitForTimeout(2000);

    // Create a new room
    console.log("🏠 Creating new room...");
    await page.click('button:has-text("Create New Room")');

    // Handle the prompt dialog
    page.on("dialog", async (dialog) => {
      console.log("📝 Entering room name...");
      await dialog.accept("Test Video Room");
    });

    await page.waitForTimeout(3000);

    // Join the room
    console.log("🚪 Joining room...");
    const joinButton = await page.$('button:has-text("Join")');
    if (joinButton) {
      await joinButton.click();
      await page.waitForTimeout(5000);

      console.log("🎬 Checking for video elements...");

      // Check for local video
      const localVideo = await page.$("video[autoplay][muted]");
      if (localVideo) {
        console.log("✅ Local video element found");

        // Check if video is playing
        const videoProperties = await page.evaluate(() => {
          const videos = document.querySelectorAll("video");
          return Array.from(videos).map((video) => ({
            paused: video.paused,
            readyState: video.readyState,
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight,
            srcObject: !!video.srcObject,
            currentTime: video.currentTime,
          }));
        });

        console.log(
          "📹 Video properties:",
          JSON.stringify(videoProperties, null, 2)
        );

        // Check for getUserMedia success
        const streamInfo = await page.evaluate(() => {
          return new Promise((resolve) => {
            navigator.mediaDevices
              .getUserMedia({ video: true, audio: true })
              .then((stream) => {
                resolve({
                  success: true,
                  videoTracks: stream.getVideoTracks().length,
                  audioTracks: stream.getAudioTracks().length,
                  trackStates: stream.getTracks().map((track) => ({
                    kind: track.kind,
                    enabled: track.enabled,
                    readyState: track.readyState,
                    label: track.label,
                  })),
                });
                stream.getTracks().forEach((track) => track.stop());
              })
              .catch((err) => {
                resolve({
                  success: false,
                  error: err.message,
                });
              });
          });
        });

        console.log(
          "🎯 Media stream info:",
          JSON.stringify(streamInfo, null, 2)
        );

        if (streamInfo.success) {
          console.log("🎉 Video streaming test PASSED!");
          console.log(
            `📊 Found ${streamInfo.videoTracks} video track(s) and ${streamInfo.audioTracks} audio track(s)`
          );
        } else {
          console.log("❌ Video streaming test FAILED!");
          console.log("Error:", streamInfo.error);
        }
      } else {
        console.log("❌ No local video element found");
      }
    } else {
      console.log("❌ Join button not found");
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
if (require.main === module) {
  testVideoStreaming()
    .then(() => console.log("🏁 Test completed"))
    .catch((err) => console.error("💥 Test error:", err));
}

module.exports = { testVideoStreaming };
