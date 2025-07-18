import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import path from "path";

import config from "./config/environment";
import { connectDB } from "./config/database";
import { errorHandler } from "./middleware/errorHandler";
import { notFound } from "./middleware/notFound";
import { initializeSimpleWebSocket } from "./services/simpleWebSocket";
import { CollaborationService } from "./services/collaborationService";
import OperationalTransform from "./services/operationalTransform";
import VersionHistoryService from "./services/versionHistoryService";
import PermissionService from "./services/permissionService";
import AnnotationService from "./services/annotationService";
import ErrorBoundaryService from "./services/errorBoundaryService";

// Route imports
import authRoutes from "./routes/auth";
import nodeRoutes from "./routes/nodes";
import templateRoutes from "./routes/templates";
import projectRoutes from "./routes/projects";
import adminRoutes from "./routes/admin";
import websocketTestRoutes from "./routes/websocket-test";
import usersEnhancedRoutes from "./routes/users-enhanced";
import notificationRoutes from "./routes/notifications";
import notificationSimpleRoutes from "./routes/notifications-simple";
import userAnalyticsRoutes from "./routes/user-analytics";
import analyticsDashboardRoutes from "./routes/analytics-dashboard";
import errorRoutes from "./routes/errors";

const app = express();
const httpServer = createServer(app);

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(helmet()); // Set security headers
app.use(compression()); // Compress responses
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);
app.use(morgan("combined")); // Logging
app.use(limiter); // Rate limiting
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "GenStack API is running",
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    version: "1.0.0",
  });
});

// Root route - serve HTML dashboard
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/nodes", nodeRoutes);
app.use("/api/templates", templateRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/websocket-test", websocketTestRoutes);
app.use("/api/users", usersEnhancedRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/notifications-simple", notificationSimpleRoutes);
app.use("/api/analytics", userAnalyticsRoutes);
app.use("/api/analytics", analyticsDashboardRoutes);
app.use("/api/errors", errorRoutes);

// 404 handler
app.use(notFound);

// Error handling middleware
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Initialize Simple WebSocket service
    const wsService = initializeSimpleWebSocket(httpServer);
    // Make it globally available for API routes
    (global as any).simpleWebSocketService = wsService;

    // Initialize Collaboration Service
    const collaborationService = new CollaborationService(httpServer);
    // Make it globally available for API routes
    (global as any).collaborationService = collaborationService;

    // Initialize Advanced Services
    const operationalTransform = new OperationalTransform();
    const versionHistoryService = new VersionHistoryService();
    const permissionService = new PermissionService();
    const annotationService = new AnnotationService();
    const errorBoundaryService = new ErrorBoundaryService();

    // Make services globally available for API routes
    (global as any).operationalTransform = operationalTransform;
    (global as any).versionHistoryService = versionHistoryService;
    (global as any).permissionService = permissionService;
    (global as any).annotationService = annotationService;
    (global as any).errorBoundaryService = errorBoundaryService;

    httpServer.listen(config.port, () => {
      console.log(`🚀 Server running on port ${config.port}`);
      console.log(`🌍 Environment: ${config.nodeEnv}`);
      console.log(`📊 Health check: http://localhost:${config.port}/health`);
      console.log(`🔄 WebSocket enabled for real-time features`);
      console.log(`🤝 Collaboration service initialized`);
      console.log(`🔧 Advanced services initialized:`);
      console.log(`   - Operational Transform`);
      console.log(`   - Version History`);
      console.log(`   - Permission Management`);
      console.log(`   - Annotation System`);
      console.log(`   - Error Boundary & Monitoring`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on("unhandledRejection", (err: Error) => {
  console.error("Unhandled Promise Rejection:", err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on("uncaughtException", (err: Error) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

startServer();

export default app;
