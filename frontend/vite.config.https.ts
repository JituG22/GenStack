import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0", // Allow external connections
    port: 3002, // Use available port
    https: {
      key: fs.readFileSync("localhost-key.pem"),
      cert: fs.readFileSync("localhost.pem"),
    },
    proxy: {
      "/api": {
        target: "http://192.168.1.26:5000", // Use actual IP for mobile access
        changeOrigin: true,
      },
      "/socket.io": {
        target: "http://192.168.1.26:5000", // WebSocket proxy for mobile
        ws: true,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
