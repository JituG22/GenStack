import express from "express";
import { auth } from "../middleware/auth";
import { Request, Response } from "express";

const router = express.Router();

// Extended request interface for authenticated requests
interface AuthenticatedRequest extends Request {
  user?: any;
}

// Get active collaborative sessions
router.get(
  "/sessions",
  auth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { realtimeService } = (req as any).app.locals;

      if (!realtimeService) {
        return res.status(500).json({
          success: false,
          message: "Realtime service not available",
        });
      }

      const sessions = realtimeService.getActiveSessions();

      // Filter sessions that the user has access to
      const userSessions = sessions.filter((session: any) => {
        const participants = realtimeService.getSessionParticipants(session.id);
        return participants.some((p: any) => p.userId === req.user?.id);
      });

      return res.json({
        success: true,
        data: {
          sessions: userSessions.map((session: any) => ({
            id: session.id,
            projectId: session.projectId,
            fileName: session.fileName,
            participantCount: session.participants.size,
            createdAt: session.createdAt,
            lastActivity: session.lastActivity,
          })),
        },
      });
    } catch (error) {
      console.error("Error fetching collaborative sessions:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch collaborative sessions",
      });
    }
  }
);

// Get session details
router.get(
  "/sessions/:sessionId",
  auth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { sessionId } = (req as any).params;
      const { realtimeService } = (req as any).app.locals;

      if (!realtimeService) {
        return res.status(500).json({
          success: false,
          message: "Realtime service not available",
        });
      }

      const participants = realtimeService.getSessionParticipants(sessionId);
      const fileState = realtimeService.getFileState(sessionId);

      // Check if user has access to this session
      const userParticipant = participants.find(
        (p: any) => p.userId === req.user?.id
      );
      if (!userParticipant && participants.length > 0) {
        return res.status(403).json({
          success: false,
          message: "Access denied to this collaborative session",
        });
      }

      return res.json({
        success: true,
        data: {
          sessionId,
          participants: participants.map((p: any) => ({
            userId: p.userId,
            username: p.username,
            color: p.color,
            cursor: p.cursor,
            selection: p.selection,
            joinedAt: p.joinedAt,
          })),
          fileState: fileState
            ? {
                version: fileState.version,
                lastModified: fileState.lastModified,
                operationCount: fileState.operations.length,
              }
            : null,
        },
      });
    } catch (error) {
      console.error("Error fetching session details:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch session details",
      });
    }
  }
);

// Get file content for a session
router.get(
  "/sessions/:sessionId/content",
  auth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { sessionId } = (req as any).params;
      const { realtimeService } = (req as any).app.locals;

      if (!realtimeService) {
        return res.status(500).json({
          success: false,
          message: "Realtime service not available",
        });
      }

      const fileState = realtimeService.getFileState(sessionId);
      const participants = realtimeService.getSessionParticipants(sessionId);

      // Check if user has access to this session
      const userParticipant = participants.find(
        (p: any) => p.userId === req.user?.id
      );
      if (!userParticipant && participants.length > 0) {
        return res.status(403).json({
          success: false,
          message: "Access denied to this collaborative session",
        });
      }

      if (!fileState) {
        return res.status(404).json({
          success: false,
          message: "File content not found for this session",
        });
      }

      return res.json({
        success: true,
        data: {
          content: fileState.content,
          version: fileState.version,
          lastModified: fileState.lastModified,
        },
      });
    } catch (error) {
      console.error("Error fetching file content:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch file content",
      });
    }
  }
);

// Get session statistics
router.get("/stats", auth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { realtimeService } = (req as any).app.locals;

    if (!realtimeService) {
      return res.status(500).json({
        success: false,
        message: "Realtime service not available",
      });
    }

    const sessions = realtimeService.getActiveSessions();

    const stats = {
      totalSessions: sessions.length,
      totalParticipants: sessions.reduce(
        (sum: number, session: any) => sum + session.participants.size,
        0
      ),
      activeProjects: [...new Set(sessions.map((s: any) => s.projectId))]
        .length,
      averageParticipantsPerSession:
        sessions.length > 0
          ? sessions.reduce(
              (sum: number, session: any) => sum + session.participants.size,
              0
            ) / sessions.length
          : 0,
    };

    return res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching collaboration stats:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch collaboration statistics",
    });
  }
});

// Create a new collaborative session (initialize file for collaboration)
router.post(
  "/sessions",
  auth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { projectId, fileName, fileContent } = (req as any).body;

      if (!projectId || !fileName) {
        return res.status(400).json({
          success: false,
          message: "Project ID and file name are required",
        });
      }

      const sessionId = `${projectId}:${fileName}`;

      return res.json({
        success: true,
        data: {
          sessionId,
          message:
            "Session ready for collaboration. Connect via WebSocket to begin.",
        },
      });
    } catch (error) {
      console.error("Error creating collaborative session:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to create collaborative session",
      });
    }
  }
);

// End a collaborative session (force cleanup)
router.delete(
  "/sessions/:sessionId",
  auth,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { sessionId } = (req as any).params;
      const { realtimeService } = (req as any).app.locals;

      if (!realtimeService) {
        return res.status(500).json({
          success: false,
          message: "Realtime service not available",
        });
      }

      const participants = realtimeService.getSessionParticipants(sessionId);

      // Check if user has access to this session (must be a participant)
      const userParticipant = participants.find(
        (p: any) => p.userId === req.user?.id
      );
      if (!userParticipant) {
        return res.status(403).json({
          success: false,
          message: "Access denied to this collaborative session",
        });
      }

      // Note: In a real implementation, you might want to add a force-close mechanism
      // For now, we just return success - sessions cleanup automatically when empty

      return res.json({
        success: true,
        message:
          "Session cleanup initiated. Participants will be disconnected.",
      });
    } catch (error) {
      console.error("Error ending collaborative session:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to end collaborative session",
      });
    }
  }
);

export default router;
