#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

console.log("🚀 Setting up GenStack Backend...\n");

// Create .env from .env.example if it doesn't exist
const envPath = path.join(__dirname, "../backend/.env");
const envExamplePath = path.join(__dirname, "../backend/.env.example");

if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
  fs.copyFileSync(envExamplePath, envPath);
  console.log("✅ Created .env file from .env.example");
} else if (fs.existsSync(envPath)) {
  console.log("ℹ️  .env file already exists");
} else {
  console.log("⚠️  No .env.example file found");
}

// Create necessary directories
const dirs = ["../backend/logs", "../backend/uploads", "../backend/dist"];

dirs.forEach((dir) => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

console.log("\n🎉 Backend setup complete!");
console.log("\nNext steps:");
console.log("1. Update the .env file with your MongoDB connection string");
console.log("2. Start MongoDB service");
console.log("3. Run: npm run dev (from backend directory)");
console.log("\nHappy coding! 🚀");
