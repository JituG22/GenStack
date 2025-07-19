import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { auth } from "../middleware/auth";
import { User } from "../models/User";
import { Organization } from "../models/Organization";
import { generateToken } from "../utils/jwt";
import { sendSuccess, sendError } from "../utils/response";
import { AuthRequest } from "../types";
import config from "../config/environment";

const router = Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Create a new user account with email, password, and personal information
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *           example:
 *             email: "user@example.com"
 *             password: "password123"
 *             firstName: "John"
 *             lastName: "Doe"
 *             organization: "GenStack Inc"
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               message: "User registered successfully"
 *               data:
 *                 user:
 *                   _id: "64a1b2c3d4e5f6789012345"
 *                   email: "user@example.com"
 *                   firstName: "John"
 *                   lastName: "Doe"
 *                 token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: Validation error or user already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               error: "User already exists with this email"
 *               statusCode: 400
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post("/register", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName, organization } = req.body;

    // Validation
    if (!email || !password || !firstName || !lastName) {
      sendError(res, "All fields are required", 400);
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      sendError(res, "User already exists with this email", 400);
      return;
    } // Password will be hashed by the User model's pre-save hook
    // No need to hash it manually here

    // Handle organization - create a temporary organization for the user
    let organizationId;
    let isNewOrganization = false;

    if (organization) {
      // Try to find existing organization
      let org = await Organization.findOne({ name: organization });
      if (!org) {
        // Create new organization with temporary owner (we'll update it after user creation)
        org = new Organization({
          name: organization,
          owner: new mongoose.Types.ObjectId(), // Temporary ObjectId
          members: [],
          projects: [],
        });
        await org.save();
        isNewOrganization = true;
      }
      organizationId = org._id;
    } else {
      // Create a default organization for the user
      const defaultOrg = new Organization({
        name: `${firstName} ${lastName}'s Organization`,
        owner: new mongoose.Types.ObjectId(), // Temporary ObjectId
        members: [],
        projects: [],
      });
      await defaultOrg.save();
      organizationId = defaultOrg._id;
      isNewOrganization = true;
    }

    // Create user with organization (password will be hashed by pre-save hook)
    const user = await User.create({
      email,
      password, // Raw password - will be hashed by User model
      firstName,
      lastName,
      organization: organizationId,
    });

    // Update organization with the actual user as owner and member
    if (isNewOrganization) {
      await Organization.findByIdAndUpdate(organizationId, {
        owner: user._id,
        members: [user._id],
      });
    } else {
      // Add user to existing organization members if not already present
      await Organization.findByIdAndUpdate(organizationId, {
        $addToSet: { members: user._id },
      });
    }

    // Generate JWT
    const token = generateToken({
      id: (user._id as any).toString(),
      email: user.email,
      role: user.role,
      organizationId: organizationId?.toString() || "",
    });

    // Remove password from response
    const userResponse = {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      organization: organizationId,
    };

    sendSuccess(
      res,
      {
        user: userResponse,
        token,
      },
      "User registered successfully",
      201
    );
  } catch (error: any) {
    console.error("Registration error:", error);
    sendError(res, "Registration failed", 500);
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Authenticate user
 *     description: Login with email and password to get authentication token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           example:
 *             email: "user@example.com"
 *             password: "password123"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               message: "Login successful"
 *               data:
 *                 user:
 *                   _id: "64a1b2c3d4e5f6789012345"
 *                   email: "user@example.com"
 *                   firstName: "John"
 *                   lastName: "Doe"
 *                 token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: Invalid credentials or missing fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               error: "Invalid credentials"
 *               statusCode: 400
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      sendError(res, "Email and password are required", 400);
      return;
    }

    // Check if user exists and get password
    const user = await User.findOne({ email })
      .select("+password")
      .populate("organization");
    if (!user) {
      sendError(res, "Invalid credentials", 401);
      return;
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      sendError(res, "Invalid credentials", 401);
      return;
    }

    // Generate JWT
    const token = generateToken({
      id: (user._id as any).toString(),
      email: user.email,
      role: user.role,
      organizationId:
        (user.organization as any)._id?.toString() ||
        user.organization.toString(),
    });

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Remove password from response
    const userResponse = {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      organization: user.organization,
    };

    sendSuccess(
      res,
      {
        user: userResponse,
        token,
      },
      "Login successful"
    );
  } catch (error: any) {
    console.error("Login error:", error);
    sendError(res, "Login failed", 500);
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get("/me", auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById((req as any).user?.id)
      .populate("organization")
      .select("-password");

    if (!user) {
      sendError(res, "User not found", 404);
      return;
    }

    sendSuccess(res, user, "User profile retrieved successfully");
  } catch (error: any) {
    console.error("Get profile error:", error);
    sendError(res, "Failed to get user profile", 500);
  }
});

// @route   POST /api/auth/refresh
// @desc    Refresh JWT token
// @access  Private
router.post(
  "/refresh",
  auth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      const user = await User.findById(userId);
      if (!user) {
        sendError(res, "User not found", 404);
        return;
      }

      // Generate new token
      const token = generateToken({
        id: (user._id as any).toString(),
        email: user.email,
        role: user.role,
        organizationId: user.organization.toString(),
      });

      sendSuccess(res, { token }, "Token refreshed successfully");
    } catch (error: any) {
      console.error("Token refresh error:", error);
      sendError(res, "Failed to refresh token", 500);
    }
  }
);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     description: Logout user and perform server-side cleanup of sessions and connections
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *             example:
 *               success: true
 *               message: "Logout successful"
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// @route   POST /api/auth/logout
// @desc    Logout user and cleanup server-side sessions
// @access  Private
router.post(
  "/logout",
  auth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        sendError(res, "User not found", 401);
        return;
      }

      // Update user's last logout timestamp
      await User.findByIdAndUpdate(userId, {
        lastLogout: new Date(),
        isOnline: false,
      });

      // Cleanup server-side sessions and connections
      await cleanupUserSessions(userId);

      console.log(`✅ User ${userId} logged out successfully`);
      sendSuccess(res, null, "Logout successful");
    } catch (error: any) {
      console.error("Logout error:", error);
      sendError(res, "Logout failed", 500);
    }
  }
);

/**
 * Cleanup user sessions and connections on logout
 */
async function cleanupUserSessions(userId: string): Promise<void> {
  try {
    // Get global services if available
    const webSocketService = (global as any).webSocketService;
    const collaborationService = (global as any).collaborationService;
    const simpleWebSocketService = (global as any).simpleWebSocketService;

    // Disconnect user from WebSocket services
    if (webSocketService) {
      webSocketService.disconnectUser(userId);
    }

    // Cleanup collaboration sessions
    if (collaborationService) {
      collaborationService.cleanupUserSessions(userId);
    }

    // Cleanup simple WebSocket sessions
    if (simpleWebSocketService) {
      simpleWebSocketService.cleanupUserSessions(userId);
    }

    // Cleanup communication services stored in app.locals
    // Note: This will be handled by the communication service disconnect events

    console.log(`🧹 Cleaned up sessions for user ${userId}`);
  } catch (error) {
    console.error("Error cleaning up user sessions:", error);
  }
}

export default router;
