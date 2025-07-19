import { communicationService } from "./communicationService";
import websocketService from "./websocketService";
import { authApi } from "../lib/api";

class LogoutService {
  /**
   * Comprehensive logout cleanup
   * Handles all data cleanup and connection termination
   */
  async performLogout(): Promise<void> {
    console.log("🚪 Starting comprehensive logout cleanup...");

    try {
      // 1. Call backend logout API for server-side cleanup
      await this.callBackendLogout();

      // 2. Disconnect WebSocket services
      await this.disconnectWebSocketServices();

      // 3. Disconnect communication services
      await this.disconnectCommunicationServices();

      // 4. Clear all local storage
      this.clearLocalStorage();

      // 5. Clear session storage
      this.clearSessionStorage();

      // 6. Clear IndexedDB if used
      await this.clearIndexedDB();

      // 7. Clear any cached data in memory
      this.clearInMemoryCache();

      // 8. Revoke any media permissions
      await this.revokeMedisPermissions();

      console.log("✅ Logout cleanup completed successfully");
    } catch (error) {
      console.error("❌ Error during logout cleanup:", error);
      // Continue with logout even if some cleanup fails
    }
  }

  /**
   * Call backend logout API for server-side cleanup
   */
  private async callBackendLogout(): Promise<void> {
    try {
      console.log("🌐 Calling backend logout API...");
      await authApi.logout();
      console.log("✅ Backend logout completed");
    } catch (error) {
      console.error("❌ Backend logout failed:", error);
      // Continue with client-side cleanup even if server call fails
    }
  }

  /**
   * Disconnect all WebSocket services
   */
  private async disconnectWebSocketServices(): Promise<void> {
    try {
      console.log("🔌 Disconnecting WebSocket services...");

      // Disconnect main websocket service
      if (websocketService && websocketService.isConnected()) {
        websocketService.disconnect();
      }

      console.log("✅ WebSocket services disconnected");
    } catch (error) {
      console.error("❌ Error disconnecting WebSocket services:", error);
    }
  }

  /**
   * Disconnect communication services (chat, WebRTC)
   */
  private async disconnectCommunicationServices(): Promise<void> {
    try {
      console.log("💬 Disconnecting communication services...");

      // Disconnect communication service (chat and WebRTC)
      communicationService.disconnect();

      console.log("✅ Communication services disconnected");
    } catch (error) {
      console.error("❌ Error disconnecting communication services:", error);
    }
  }

  /**
   * Clear all localStorage data
   */
  private clearLocalStorage(): void {
    try {
      console.log("🗂️ Clearing localStorage...");

      // Core authentication data
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Application-specific data
      localStorage.removeItem("lastActiveProject");
      localStorage.removeItem("userPreferences");
      localStorage.removeItem("recentProjects");
      localStorage.removeItem("currentWorkspace");
      localStorage.removeItem("editorState");
      localStorage.removeItem("chatSessions");
      localStorage.removeItem("collaborationSessions");
      localStorage.removeItem("notificationSettings");
      localStorage.removeItem("analyticsCache");
      localStorage.removeItem("templateCache");
      localStorage.removeItem("nodeCache");

      // Communication-specific data
      localStorage.removeItem("chatHistory");
      localStorage.removeItem("webrtcSettings");
      localStorage.removeItem("callHistory");
      localStorage.removeItem("presenceStatus");

      // UI state
      localStorage.removeItem("sidebarCollapsed");
      localStorage.removeItem("themePreference");
      localStorage.removeItem("layoutSettings");

      console.log("✅ localStorage cleared");
    } catch (error) {
      console.error("❌ Error clearing localStorage:", error);
    }
  }

  /**
   * Clear all sessionStorage data
   */
  private clearSessionStorage(): void {
    try {
      console.log("📝 Clearing sessionStorage...");
      sessionStorage.clear();
      console.log("✅ sessionStorage cleared");
    } catch (error) {
      console.error("❌ Error clearing sessionStorage:", error);
    }
  }

  /**
   * Clear IndexedDB databases
   */
  private async clearIndexedDB(): Promise<void> {
    try {
      if (typeof window === "undefined" || !("indexedDB" in window)) {
        return;
      }

      console.log("🗄️ Clearing IndexedDB...");

      // List of potential IndexedDB databases used by the app
      const databaseNames = [
        "GenStackCache",
        "GenStackProjects",
        "GenStackTemplates",
        "GenStackCollaboration",
        "GenStackAnalytics",
        "ChatStorage",
        "WebRTCStorage",
      ];

      const deletePromises = databaseNames.map(async (dbName) => {
        try {
          await this.deleteDatabase(dbName);
        } catch (error) {
          console.log(`Failed to delete database ${dbName}:`, error);
        }
      });

      await Promise.allSettled(deletePromises);
      console.log("✅ IndexedDB cleanup completed");
    } catch (error) {
      console.error("❌ Error clearing IndexedDB:", error);
    }
  }

  /**
   * Delete a specific IndexedDB database
   */
  private deleteDatabase(name: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const deleteReq = indexedDB.deleteDatabase(name);

      deleteReq.onsuccess = () => resolve();
      deleteReq.onerror = () => reject(deleteReq.error);
      deleteReq.onblocked = () => {
        console.warn(`Database ${name} deletion blocked`);
        // Resolve anyway after a timeout
        setTimeout(() => resolve(), 1000);
      };
    });
  }

  /**
   * Clear in-memory caches and global state
   */
  private clearInMemoryCache(): void {
    try {
      console.log("🧠 Clearing in-memory cache...");

      // Clear any global variables or caches
      if ((window as any).GenStackCache) {
        (window as any).GenStackCache = null;
      }

      if ((window as any).projectCache) {
        (window as any).projectCache = null;
      }

      if ((window as any).userPresenceCache) {
        (window as any).userPresenceCache = null;
      }

      console.log("✅ In-memory cache cleared");
    } catch (error) {
      console.error("❌ Error clearing in-memory cache:", error);
    }
  }

  /**
   * Revoke media permissions and stop any active streams
   */
  private async revokeMedisPermissions(): Promise<void> {
    try {
      console.log("🎥 Revoking media permissions...");

      // Stop any active media streams
      if (navigator.mediaDevices) {
        // Check for any global media streams that might be active
        if ((window as any).localStream) {
          const stream = (window as any).localStream as MediaStream;
          stream.getTracks().forEach((track) => {
            track.stop();
          });
          (window as any).localStream = null;
        }
      }

      // Close any active peer connections
      if ((window as any).activePeerConnections) {
        const connections = (window as any)
          .activePeerConnections as RTCPeerConnection[];
        connections.forEach((pc) => {
          pc.close();
        });
        (window as any).activePeerConnections = [];
      }

      console.log("✅ Media permissions revoked");
    } catch (error) {
      console.error("❌ Error revoking media permissions:", error);
    }
  }

  /**
   * Emergency cleanup - force clear everything
   */
  async emergencyCleanup(): Promise<void> {
    console.log("🚨 Performing emergency cleanup...");

    try {
      // Clear all storage synchronously
      localStorage.clear();
      sessionStorage.clear();

      // Force disconnect all connections
      if ((window as any).socket) {
        (window as any).socket.disconnect();
      }

      // Reload the page to ensure complete cleanup
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (error) {
      console.error("❌ Emergency cleanup failed:", error);
      // Force page reload as last resort
      window.location.reload();
    }
  }
}

// Export singleton instance
export const logoutService = new LogoutService();
export default logoutService;
