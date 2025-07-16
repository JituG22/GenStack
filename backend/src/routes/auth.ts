import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { auth } from "../middleware/auth";
import { User } from "../models/User";
import { Organization } from "../models/Organization";
import { generateToken } from "../utils/jwt";
import { sendSuccess, sendError } from "../utils/response";
import { AuthRequest } from "../types";
import config from "../config/environment";

const router = Router();

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
    }

    // Hash password
    const saltRounds = config.bcryptRounds;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Handle organization
    let organizationId;
    if (organization) {
      // Try to find existing organization or create new one
      let org = await Organization.findOne({ name: organization });
      if (!org) {
        // For now, we'll create a temporary organization structure
        // In a real app, this would be more sophisticated
        org = await Organization.create({
          name: organization,
          owner: null, // Will be set after user creation
          members: [],
          projects: [],
        });
      }
      organizationId = org._id;
    }

    // Create user first
    const user = await User.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      organization: organizationId,
    });

    // If we created a new organization without an existing owner, set this user as owner
    if (organization && organizationId) {
      const org = await Organization.findById(organizationId);
      if (org && !org.owner) {
        org.owner = user._id;
        org.members.push(user._id);
        await org.save();
      } else if (org && !org.members.includes(user._id)) {
        org.members.push(user._id);
        await org.save();
      }
    }

    // Generate JWT
    const token = generateToken({
      id: user._id.toString(),
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
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      sendError(res, "Invalid credentials", 401);
      return;
    }

    // Generate JWT
    const token = generateToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      organizationId: user.organization.toString(),
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
router.get(
  "/me",
  auth,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = await User.findById(req.user?.id)
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
  }
);

// @route   POST /api/auth/refresh
// @desc    Refresh JWT token
// @access  Private
router.post(
  "/refresh",
  auth,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = await User.findById(req.user?.id);
      if (!user) {
        sendError(res, "User not found", 404);
        return;
      }

      // Generate new token
      const token = generateToken({
        id: user._id.toString(),
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

export default router;
