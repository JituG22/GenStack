import * as dotenv from "dotenv";
import * as path from "path";

// Load environment-specific config file
const environment = process.env.NODE_ENV || "development";
const envFile = `.env.${environment}`;

// Load the environment file
dotenv.config({
  path: path.resolve(process.cwd(), envFile),
});

// Environment configuration with defaults
export const config = {
  // Server
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "5000", 10),

  // Database
  mongodbUri:
    process.env.MONGODB_URI || "mongodb://localhost:27017/genstack-dev",
  dbName: process.env.DB_NAME || "genstack-dev",

  // JWT
  jwtSecret: process.env.JWT_SECRET || "fallback-secret-only-for-development",
  jwtExpire: process.env.JWT_EXPIRE || "7d",

  // CORS
  corsOrigin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
    : ["http://localhost:3000"],

  // Rate Limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10),
  rateLimitMaxRequests: parseInt(
    process.env.RATE_LIMIT_MAX_REQUESTS || "100",
    10
  ),

  // Logging
  logLevel: process.env.LOG_LEVEL || "info",

  // File Upload
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || "10485760", 10),
  uploadPath: process.env.UPLOAD_PATH || "./uploads",

  // Email
  emailService: process.env.EMAIL_SERVICE || "console",
  emailHost: process.env.EMAIL_HOST,
  emailPort: parseInt(process.env.EMAIL_PORT || "587", 10),
  emailUser: process.env.EMAIL_USER,
  emailPass: process.env.EMAIL_PASS,
  emailFrom: process.env.EMAIL_FROM || "noreply@genstack.com",

  // Security
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || "12", 10),
  encryptionKey:
    process.env.ENCRYPTION_KEY || "your-secret-key-32-characters!!",

  // Performance (production only)
  clusterMode: process.env.CLUSTER_MODE === "true",
  enableCompression: process.env.ENABLE_COMPRESSION === "true",
  enableHelmet: process.env.ENABLE_HELMET === "true",

  // GitHub Integration
  github: {
    token: process.env.GITHUB_TOKEN || "",
    username: process.env.GITHUB_USERNAME || "",
    organization: process.env.GITHUB_ORG || "",
    enabled: process.env.GITHUB_ENABLED === "true",
  },

  // Utility functions
  isDevelopment: () => environment === "development",
  isTest: () => environment === "test",
  isProduction: () => environment === "production",
  isStaging: () => environment === "staging",
};

// Validate required environment variables
const requiredEnvVars = ["JWT_SECRET"];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    if (!config.isDevelopment()) {
      process.exit(1);
    }
  }
}

console.log(`🔧 Environment: ${environment}`);
console.log(`📄 Config file: ${envFile}`);
console.log(`🗄️  Database: ${config.dbName}`);
console.log(`🌐 CORS Origin: ${config.corsOrigin}`);

export default config;
