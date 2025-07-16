import { Router, Request, Response } from "express";
import { auth } from "../middleware/auth";
import { handleValidationErrors } from "../middleware/validation";
import { query, param } from "express-validator";
import { userAnalyticsService } from "../services/userAnalyticsService";

const router = Router();

// Extended request interface for authenticated requests
interface AuthenticatedRequest extends Request {
  user?: any;
}

// Get platform analytics (admin only)
router.get(
  "/platform",
  [
    auth,
    query("organizationId").optional().isMongoId(),
    handleValidationErrors,
  ],
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // In a real app, you'd check for admin role here
      const { organizationId } = req.query;

      const analytics = await userAnalyticsService.getPlatformAnalytics(
        organizationId as string
      );

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      console.error("Platform analytics error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch platform analytics",
      });
    }
  }
);

// Get personal user analytics
router.get(
  "/personal",
  auth,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;

      const analytics = await userAnalyticsService.getUserPersonalAnalytics(
        userId
      );

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      console.error("Personal analytics error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch personal analytics",
      });
    }
  }
);

// Get user activity timeline
router.get(
  "/timeline",
  [
    auth,
    query("days").optional().isInt({ min: 1, max: 365 }),
    handleValidationErrors,
  ],
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;
      const days = parseInt(req.query.days as string) || 30;

      const timeline = await userAnalyticsService.getUserActivityTimeline(
        userId,
        days
      );

      res.json({
        success: true,
        data: {
          timeline,
          period: `${days} days`,
          userId,
        },
      });
    } catch (error) {
      console.error("Timeline analytics error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch activity timeline",
      });
    }
  }
);

// Get user recommendations
router.get(
  "/recommendations",
  auth,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;

      const recommendations =
        await userAnalyticsService.generateUserRecommendations(userId);

      res.json({
        success: true,
        data: recommendations,
      });
    } catch (error) {
      console.error("Recommendations error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to generate recommendations",
      });
    }
  }
);

// Get analytics for specific user (admin or self)
router.get(
  "/user/:userId",
  [auth, param("userId").isMongoId(), handleValidationErrors],
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;

      // Check if user is requesting their own analytics or is admin
      if (userId !== req.user.id) {
        // In a real app, check for admin role here
        // For now, allow access
      }

      const analytics = await userAnalyticsService.getUserPersonalAnalytics(
        userId
      );

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      console.error("User analytics error:", error);
      if (error instanceof Error && error.message === "User not found") {
        res.status(404).json({
          success: false,
          message: "User not found",
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: "Failed to fetch user analytics",
      });
    }
  }
);

// Get dashboard summary (quick stats for user dashboard)
router.get(
  "/dashboard",
  auth,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;

      const [personalAnalytics, recommendations] = await Promise.all([
        userAnalyticsService.getUserPersonalAnalytics(userId),
        userAnalyticsService.generateUserRecommendations(userId),
      ]);

      // Create a condensed dashboard summary
      const dashboardSummary = {
        quickStats: {
          totalLogins: personalAnalytics.activitySummary.totalLogins,
          currentStreak: personalAnalytics.activitySummary.currentStreak,
          templatesCreated: personalAnalytics.productivity.templatesCreated,
          projectsCreated: personalAnalytics.productivity.projectsCreated,
          collaborationScore: personalAnalytics.social.collaborationScore,
          learningProgress: personalAnalytics.growth.learningProgress,
        },
        recentActivity: {
          lastLoginDays: personalAnalytics.activitySummary.lastLoginDays,
          featuresExplored: personalAnalytics.productivity.featuresExplored,
          teamContributions: personalAnalytics.social.teamContributions,
        },
        achievements: {
          badges: personalAnalytics.growth.achievementsBadges,
          skills: personalAnalytics.growth.skillsAcquired,
        },
        recommendations: {
          featuresCount: recommendations.features.length,
          usersCount: recommendations.users.length,
          contentCount: recommendations.content.length,
          topFeature: recommendations.features[0] || null,
          topContent: recommendations.content[0] || null,
        },
      };

      res.json({
        success: true,
        data: dashboardSummary,
      });
    } catch (error) {
      console.error("Dashboard analytics error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch dashboard analytics",
      });
    }
  }
);

// Get leaderboard (top users by various metrics)
router.get(
  "/leaderboard",
  [
    auth,
    query("metric")
      .optional()
      .isIn(["templates", "projects", "collaboration", "followers"]),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    handleValidationErrors,
  ],
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const metric = (req.query.metric as string) || "collaboration";
      const limit = parseInt(req.query.limit as string) || 10;

      let sortField = "";
      let displayField = "";

      switch (metric) {
        case "templates":
          sortField = "featureUsage.templatesCreated";
          displayField = "templatesCreated";
          break;
        case "projects":
          sortField = "featureUsage.projectsCreated";
          displayField = "projectsCreated";
          break;
        case "collaboration":
          sortField = "featureUsage.collaborativeSessions";
          displayField = "collaborativeSessions";
          break;
        case "followers":
          sortField = "followers";
          displayField = "followersCount";
          break;
        default:
          sortField = "featureUsage.collaborativeSessions";
          displayField = "collaborativeSessions";
      }

      const leaderboard = await userAnalyticsService.getLeaderboard(
        metric,
        limit
      );

      res.json({
        success: true,
        data: {
          metric,
          leaderboard,
          currentUserRank: 0, // Would need to calculate user's rank
        },
      });
    } catch (error) {
      console.error("Leaderboard error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch leaderboard",
      });
    }
  }
);

// Export usage statistics for admin/reporting
router.get(
  "/export",
  [
    auth,
    query("format").optional().isIn(["json", "csv"]),
    query("organizationId").optional().isMongoId(),
    handleValidationErrors,
  ],
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // In a real app, check for admin role here
      const { format = "json", organizationId } = req.query;

      const analytics = await userAnalyticsService.getPlatformAnalytics(
        organizationId as string
      );

      if (format === "csv") {
        // Convert to CSV format
        const csvData = [
          "Metric,Value",
          `Total Users,${analytics.overview.totalUsers}`,
          `Active Users,${analytics.overview.activeUsers}`,
          `New Users Today,${analytics.overview.newUsersToday}`,
          `New Users This Week,${analytics.overview.newUsersThisWeek}`,
          `Average Session Duration,${analytics.overview.averageSessionDuration}`,
          `Daily Active Users,${analytics.engagement.dailyActiveUsers}`,
          `Weekly Active Users,${analytics.engagement.weeklyActiveUsers}`,
          `Monthly Active Users,${analytics.engagement.monthlyActiveUsers}`,
          `Retention Rate,${analytics.engagement.retentionRate}%`,
          `Templates Created,${analytics.features.templatesCreated}`,
          `Projects Created,${analytics.features.projectsCreated}`,
          `Collaborative Sessions,${analytics.features.collaborativeSessions}`,
        ].join("\n");

        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          "attachment; filename=user-analytics.csv"
        );
        res.send(csvData);
        return;
      }

      res.json({
        success: true,
        data: analytics,
        exportedAt: new Date().toISOString(),
        format,
      });
    } catch (error) {
      console.error("Export analytics error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to export analytics",
      });
    }
  }
);

export default router;
