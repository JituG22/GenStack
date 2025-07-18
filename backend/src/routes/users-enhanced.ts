import { Router, Request, Response } from "express";
import { UserNew, IUserDocumentNew } from "../models/User-new";
import { auth } from "../middleware/auth";
import { handleValidationErrors } from "../middleware/validation";
import { body, param, query } from "express-validator";
import crypto from "crypto";

const router = Router();

// Extended request interface for authenticated requests
interface AuthenticatedRequest extends Request {
  user?: any;
}

// Define valid feature types
type FeatureType =
  | "templatesCreated"
  | "projectsCreated"
  | "collaborativeSessions";

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get current user profile
 *     description: Retrieve the complete profile information of the authenticated user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               data:
 *                 _id: "64a1b2c3d4e5f6789012345"
 *                 email: "user@example.com"
 *                 firstName: "John"
 *                 lastName: "Doe"
 *                 organization:
 *                   _id: "64a1b2c3d4e5f6789012346"
 *                   name: "GenStack Inc"
 *                 projects: []
 *                 teams: []
 *                 following: []
 *                 followers: []
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Get current user profile with all enhanced fields
router.get(
  "/profile",
  auth,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = await UserNew.findById(req.user.id)
        .populate("organization", "name")
        .populate("projects", "name description")
        .populate("teams", "name description")
        .populate("following", "firstName lastName email avatar")
        .populate("followers", "firstName lastName email avatar");

      if (!user) {
        res.status(404).json({
          success: false,
          message: "User not found",
        });
        return;
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      console.error("Profile fetch error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch user profile",
      });
    }
  }
);

// Update user profile
router.put(
  "/profile",
  [
    auth,
    body("firstName").optional().isLength({ min: 1, max: 50 }),
    body("lastName").optional().isLength({ min: 1, max: 50 }),
    body("bio").optional().isLength({ max: 500 }),
    body("timezone").optional().isString(),
    body("avatar").optional().isURL(),
    handleValidationErrors,
  ],
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { firstName, lastName, bio, timezone, avatar } = req.body;

      const user = await UserNew.findById(req.user.id);
      if (!user) {
        res.status(404).json({
          success: false,
          message: "User not found",
        });
        return;
      }

      // Update basic profile fields
      if (firstName !== undefined) user.firstName = firstName;
      if (lastName !== undefined) user.lastName = lastName;
      if (bio !== undefined) user.bio = bio;
      if (timezone !== undefined) user.timezone = timezone;
      if (avatar !== undefined) user.avatar = avatar;

      await user.updateLastActivity();
      await user.save();

      res.json({
        success: true,
        message: "Profile updated successfully",
        data: user,
      });
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update profile",
      });
    }
  }
);

// Update user preferences
router.put(
  "/preferences",
  [
    auth,
    body("theme").optional().isIn(["light", "dark", "auto"]),
    body("language").optional().isString(),
    body("notifications").optional().isObject(),
    body("dashboard").optional().isObject(),
    handleValidationErrors,
  ],
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { theme, language, notifications, dashboard } = req.body;

      const user = await UserNew.findById(req.user.id);
      if (!user) {
        res.status(404).json({
          success: false,
          message: "User not found",
        });
        return;
      }

      // Update preferences
      if (theme !== undefined) user.preferences.theme = theme;
      if (language !== undefined) user.preferences.language = language;
      if (notifications !== undefined) {
        user.preferences.notifications = {
          ...user.preferences.notifications,
          ...notifications,
        };
      }
      if (dashboard !== undefined) {
        user.preferences.dashboard = {
          ...user.preferences.dashboard,
          ...dashboard,
        };
      }

      await user.updateLastActivity();
      await user.save();

      res.json({
        success: true,
        message: "Preferences updated successfully",
        data: user.preferences,
      });
    } catch (error) {
      console.error("Preferences update error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update preferences",
      });
    }
  }
);

// Update collaboration settings
router.put(
  "/collaboration-settings",
  [
    auth,
    body("allowRealTimeEditing").optional().isBoolean(),
    body("showCursor").optional().isBoolean(),
    body("sharePresence").optional().isBoolean(),
    body("defaultProjectVisibility")
      .optional()
      .isIn(["private", "team", "organization"]),
    handleValidationErrors,
  ],
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const {
        allowRealTimeEditing,
        showCursor,
        sharePresence,
        defaultProjectVisibility,
      } = req.body;

      const user = await UserNew.findById(req.user.id);
      if (!user) {
        res.status(404).json({
          success: false,
          message: "User not found",
        });
        return;
      }

      // Update collaboration settings
      if (allowRealTimeEditing !== undefined)
        user.collaborationSettings.allowRealTimeEditing = allowRealTimeEditing;
      if (showCursor !== undefined)
        user.collaborationSettings.showCursor = showCursor;
      if (sharePresence !== undefined)
        user.collaborationSettings.sharePresence = sharePresence;
      if (defaultProjectVisibility !== undefined)
        user.collaborationSettings.defaultProjectVisibility =
          defaultProjectVisibility;

      await user.updateLastActivity();
      await user.save();

      res.json({
        success: true,
        message: "Collaboration settings updated successfully",
        data: user.collaborationSettings,
      });
    } catch (error) {
      console.error("Collaboration settings update error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update collaboration settings",
      });
    }
  }
);

// Get user activity and analytics
router.get(
  "/activity",
  auth,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = await UserNew.findById(req.user.id);
      if (!user) {
        res.status(404).json({
          success: false,
          message: "User not found",
        });
        return;
      }

      const activityData = {
        lastLogin: user.lastLogin,
        lastActivity: user.lastActivity,
        loginHistory: user.loginHistory.slice(-5), // Last 5 logins
        featureUsage: user.featureUsage,
        accountAge: (user as any).createdAt,
        isActive: user.isActive,
      };

      res.json({
        success: true,
        data: activityData,
      });
    } catch (error) {
      console.error("Activity fetch error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch user activity",
      });
    }
  }
);

// Update feature usage (called by other parts of the system)
router.post(
  "/feature-usage",
  [
    auth,
    body("feature").isIn([
      "templatesCreated",
      "projectsCreated",
      "collaborativeSessions",
    ]),
    body("action").isIn(["increment", "set", "add_favorite"]),
    body("value").optional().isNumeric(),
    handleValidationErrors,
  ],
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { feature, action, value } = req.body;

      const user = await UserNew.findById(req.user.id);
      if (!user) {
        res.status(404).json({
          success: false,
          message: "User not found",
        });
        return;
      }

      switch (action) {
        case "increment":
          if (feature in user.featureUsage) {
            (user.featureUsage as any)[feature] += 1;
          }
          break;
        case "set":
          if (feature in user.featureUsage && value !== undefined) {
            (user.featureUsage as any)[feature] = value;
          }
          break;
        case "add_favorite":
          if (!user.featureUsage.favoriteFeatures.includes(feature)) {
            user.featureUsage.favoriteFeatures.push(feature);
          }
          break;
      }

      // Update specific timestamps
      if (feature === "templatesCreated") {
        user.featureUsage.lastTemplateUsed = new Date();
      }

      await user.updateLastActivity();
      await user.save();

      res.json({
        success: true,
        message: "Feature usage updated",
        data: user.featureUsage,
      });
    } catch (error) {
      console.error("Feature usage update error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update feature usage",
      });
    }
  }
);

// API Key Management
router.get(
  "/api-keys",
  auth,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = await UserNew.findById(req.user.id);
      if (!user) {
        res.status(404).json({
          success: false,
          message: "User not found",
        });
        return;
      }

      // Return API keys without the actual key values for security
      const sanitizedKeys = user.apiKeys.map((key, index) => ({
        id: index,
        name: key.name,
        permissions: key.permissions,
        createdAt: key.createdAt,
        lastUsed: key.lastUsed,
        expiresAt: key.expiresAt,
        keyPreview: key.key.substring(0, 8) + "...",
      }));

      res.json({
        success: true,
        data: sanitizedKeys,
      });
    } catch (error) {
      console.error("API keys fetch error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch API keys",
      });
    }
  }
);

// Create new API key
router.post(
  "/api-keys",
  [
    auth,
    body("name").isLength({ min: 1, max: 100 }),
    body("permissions").isArray(),
    body("expiresAt").optional().isISO8601(),
    handleValidationErrors,
  ],
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { name, permissions, expiresAt } = req.body;

      const user = await UserNew.findById(req.user.id);
      if (!user) {
        res.status(404).json({
          success: false,
          message: "User not found",
        });
        return;
      }

      // Generate secure API key
      const apiKey = `gsk_${crypto.randomBytes(32).toString("hex")}`;

      const newApiKey = {
        name,
        key: apiKey,
        permissions,
        createdAt: new Date(),
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      };

      user.apiKeys.push(newApiKey);
      await user.save();

      res.json({
        success: true,
        message: "API key created successfully",
        data: {
          name,
          key: apiKey, // Only return the key once during creation
          permissions,
          createdAt: newApiKey.createdAt,
          expiresAt: newApiKey.expiresAt,
        },
      });
    } catch (error) {
      console.error("API key creation error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create API key",
      });
    }
  }
);

// Delete API key
router.delete(
  "/api-keys/:keyId",
  [auth, param("keyId").isNumeric(), handleValidationErrors],
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { keyId } = req.params;
      const keyIndex = parseInt(keyId);

      const user = await UserNew.findById(req.user.id);
      if (!user) {
        res.status(404).json({
          success: false,
          message: "User not found",
        });
        return;
      }

      if (keyIndex < 0 || keyIndex >= user.apiKeys.length) {
        res.status(404).json({
          success: false,
          message: "API key not found",
        });
        return;
      }

      user.apiKeys.splice(keyIndex, 1);
      await user.save();

      res.json({
        success: true,
        message: "API key deleted successfully",
      });
    } catch (error) {
      console.error("API key deletion error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete API key",
      });
    }
  }
);

// Social features - Follow/Unfollow user
router.post(
  "/follow/:userId",
  [auth, param("userId").isMongoId(), handleValidationErrors],
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;

      if (userId === req.user.id) {
        res.status(400).json({
          success: false,
          message: "Cannot follow yourself",
        });
        return;
      }

      const [currentUser, targetUser] = await Promise.all([
        UserNew.findById(req.user.id),
        UserNew.findById(userId),
      ]);

      if (!currentUser || !targetUser) {
        res.status(404).json({
          success: false,
          message: "User not found",
        });
        return;
      }

      // Check if already following
      const isFollowing = currentUser.following.includes(userId as any);

      if (isFollowing) {
        // Unfollow
        currentUser.following = currentUser.following.filter(
          (id) => id.toString() !== userId
        );
        targetUser.followers = targetUser.followers.filter(
          (id) => id.toString() !== req.user.id
        );
      } else {
        // Follow
        currentUser.following.push(userId as any);
        targetUser.followers.push(req.user.id);
      }

      await Promise.all([currentUser.save(), targetUser.save()]);

      res.json({
        success: true,
        message: isFollowing ? "User unfollowed" : "User followed",
        data: {
          isFollowing: !isFollowing,
          followingCount: currentUser.following.length,
          followersCount: targetUser.followers.length,
        },
      });
    } catch (error) {
      console.error("Follow/unfollow error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update follow status",
      });
    }
  }
);

// Get user's social connections
router.get(
  "/social",
  auth,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = await UserNew.findById(req.user.id)
        .populate(
          "following",
          "firstName lastName email avatar featureUsage.projectsCreated"
        )
        .populate(
          "followers",
          "firstName lastName email avatar featureUsage.projectsCreated"
        )
        .populate("teams", "name description");

      if (!user) {
        res.status(404).json({
          success: false,
          message: "User not found",
        });
        return;
      }

      res.json({
        success: true,
        data: {
          following: user.following,
          followers: user.followers,
          teams: user.teams,
          stats: {
            followingCount: user.following.length,
            followersCount: user.followers.length,
            teamsCount: user.teams.length,
          },
        },
      });
    } catch (error) {
      console.error("Social connections fetch error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch social connections",
      });
    }
  }
);

// Get recently active users
router.get(
  "/active-users",
  [auth, query("hours").optional().isNumeric(), handleValidationErrors],
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const hours = parseInt(req.query.hours as string) || 24;
      const since = new Date(Date.now() - hours * 60 * 60 * 1000);

      const activeUsers = await UserNew.find({
        lastActivity: { $gte: since },
        isActive: true,
        _id: { $ne: req.user.id }, // Exclude current user
      })
        .select(
          "firstName lastName email avatar lastActivity featureUsage.collaborativeSessions"
        )
        .limit(50);

      res.json({
        success: true,
        data: {
          users: activeUsers,
          timeframe: `${hours} hours`,
          count: activeUsers.length,
        },
      });
    } catch (error) {
      console.error("Active users fetch error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch active users",
      });
    }
  }
);

// Search users
router.get(
  "/search",
  [
    auth,
    query("q").isLength({ min: 1 }),
    query("limit").optional().isNumeric(),
    handleValidationErrors,
  ],
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { q, limit = 20 } = req.query;
      const searchTerm = q as string;

      const users = await UserNew.find({
        $and: [
          { _id: { $ne: req.user.id } }, // Exclude current user
          { isActive: true },
          {
            $or: [
              { firstName: { $regex: searchTerm, $options: "i" } },
              { lastName: { $regex: searchTerm, $options: "i" } },
              { email: { $regex: searchTerm, $options: "i" } },
            ],
          },
        ],
      })
        .select(
          "firstName lastName email avatar bio featureUsage.projectsCreated"
        )
        .limit(parseInt(limit as string));

      res.json({
        success: true,
        data: users,
      });
    } catch (error) {
      console.error("User search error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to search users",
      });
    }
  }
);

export default router;
