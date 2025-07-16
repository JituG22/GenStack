import express from "express";
import cors from "cors";
import { createServer } from "http";
import { WebSocketService } from "./services/websocket";

const app = express();
const httpServer = createServer(app);

// Basic middleware
app.use(
  cors({
    origin: "http://localhost:3010",
    credentials: true,
  })
);
app.use(express.json());

// Simple test routes
app.get("/api/health", (req, res) => {
  res.json({
    message: "Server is running!",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/test", (req, res) => {
  res.json({ message: "API is working!" });
});

// Initialize WebSocket
const webSocketService = new WebSocketService(httpServer);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 WebSocket server initialized`);
});

export default app;
