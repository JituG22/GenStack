#!/usr/bin/env node

// Simple test script to verify error boundary functionality
const http = require("http");

// Test error reporting without authentication
const testErrorReporting = () => {
  const postData = JSON.stringify({
    message: "Test error from Node.js script",
    stack: "Error: Test error\n    at test.js:1:1",
    componentStack: "    at ErrorTest\n    at App",
    userAgent: "Node.js/test",
    url: "http://localhost:3000/test",
    context: { test: true, timestamp: new Date().toISOString() },
  });

  const options = {
    hostname: "localhost",
    port: 5000,
    path: "/api/errors/report",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(postData),
    },
  };

  const req = http.request(options, (res) => {
    let data = "";
    res.on("data", (chunk) => {
      data += chunk;
    });
    res.on("end", () => {
      console.log("Error Report Response:", data);
      console.log("Status Code:", res.statusCode);
    });
  });

  req.on("error", (err) => {
    console.error("Error reporting failed:", err.message);
  });

  req.write(postData);
  req.end();
};

// Test health endpoint
const testHealthEndpoint = () => {
  const options = {
    hostname: "localhost",
    port: 5000,
    path: "/api/errors/health",
    method: "GET",
  };

  const req = http.request(options, (res) => {
    let data = "";
    res.on("data", (chunk) => {
      data += chunk;
    });
    res.on("end", () => {
      console.log("Health Check Response:", data);
      console.log("Status Code:", res.statusCode);
    });
  });

  req.on("error", (err) => {
    console.error("Health check failed:", err.message);
  });

  req.end();
};

// Test metrics endpoint (will fail without auth)
const testMetricsEndpoint = () => {
  const options = {
    hostname: "localhost",
    port: 5000,
    path: "/api/errors/metrics",
    method: "GET",
  };

  const req = http.request(options, (res) => {
    let data = "";
    res.on("data", (chunk) => {
      data += chunk;
    });
    res.on("end", () => {
      console.log("Metrics Response:", data);
      console.log("Status Code:", res.statusCode);
    });
  });

  req.on("error", (err) => {
    console.error("Metrics check failed:", err.message);
  });

  req.end();
};

console.log("🧪 Testing Error Boundary API Endpoints...\n");

console.log("1. Testing Health Endpoint:");
testHealthEndpoint();

setTimeout(() => {
  console.log("\n2. Testing Error Reporting Endpoint:");
  testErrorReporting();
}, 1000);

setTimeout(() => {
  console.log("\n3. Testing Metrics Endpoint (should require auth):");
  testMetricsEndpoint();
}, 2000);

setTimeout(() => {
  console.log("\n✅ API Testing Complete!");
}, 3000);
