// API Configuration for GenStack
// Automatically detects environment and sets appropriate API endpoints

// Get the current host (works for both localhost and IP addresses)
const getApiBaseUrl = (): string => {
  // For development with Vite proxy, use relative URLs
  if (process.env.NODE_ENV === "development") {
    return ""; // Empty string for relative URLs through proxy
  }

  // In production, use full URLs
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;

  // If we're accessing via IP address (mobile), use that IP for API calls
  if (hostname !== "localhost" && hostname !== "127.0.0.1") {
    return `${protocol}//${hostname}:5000`;
  }

  // Default to localhost for local development
  return `${protocol}//localhost:5000`;
};

// Get WebSocket URL
const getWebSocketUrl = (): string => {
  // For development with Vite proxy, use current origin (goes through proxy)
  if (process.env.NODE_ENV === "development") {
    return window.location.origin; // This will be https://localhost:3002 or https://192.168.1.26:3002
  }

  return getApiBaseUrl();
};

// Configuration object
export const apiConfig = {
  baseUrl: getApiBaseUrl(),
  wsUrl: getWebSocketUrl(),
  apiUrl:
    process.env.NODE_ENV === "development" ? "/api" : `${getApiBaseUrl()}/api`,

  // Specific namespace URLs for Socket.IO - use relative URLs in development
  chatNamespace:
    process.env.NODE_ENV === "development"
      ? "/chat"
      : `${getApiBaseUrl()}/chat`,
  collaborationNamespace:
    process.env.NODE_ENV === "development"
      ? "/collaboration"
      : `${getApiBaseUrl()}/collaboration`,
};

// Debug logging
console.log("🔧 API Configuration:", {
  hostname: window.location.hostname,
  protocol: window.location.protocol,
  port: window.location.port,
  isHTTPS: window.location.protocol === "https:",
  baseUrl: apiConfig.baseUrl,
  wsUrl: apiConfig.wsUrl,
  apiUrl: apiConfig.apiUrl,
});

export default apiConfig;
