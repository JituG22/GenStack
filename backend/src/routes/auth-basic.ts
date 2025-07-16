import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { auth } from "../middleware/auth";
import { User } from "../models/User-basic";
import { Organization } from "../models/Organization-basic";
import { generateToken } from "../utils/jwt";

const router = Router();

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post("/register", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Basic validation
    if (!email || !password || !firstName || !lastName) {
      res.status(400).json({
        success: false,
        message: "All fields are required",
      });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
      return;
    }

    // Create a basic organization for the user
    const org = await Organization.create({
      name: `${firstName} ${lastName}'s Organization`,
      description: "Personal organization",
      owner: null, // Will be set after user creation
      members: [],
      projects: [],
    });

    // Create user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      organization: org._id,
    });

    // Update organization owner
    org.owner = user._id;
    org.members.push(user._id);
    await org.save();

    // Generate JWT
    const token = generateToken({
      id: user._id.toString(),
      email: user.email,
      role: (user as any).role,
      organizationId: org._id.toString(),
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: (user as any).firstName,
          lastName: (user as any).lastName,
          role: (user as any).role,
        },
        token,
      },
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message,
    });
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
      res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
      return;
    }

    // Check if user exists and get password
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
      return;
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(
      password,
      (user as any).password
    );
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
      return;
    }

    // Update last login
    (user as any).lastLoginAt = new Date();
    await user.save();

    // Generate JWT
    const token = generateToken({
      id: user._id.toString(),
      email: user.email,
      role: (user as any).role,
      organizationId: (user as any).organization.toString(),
    });

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: (user as any).firstName,
          lastName: (user as any).lastName,
          role: (user as any).role,
        },
        token,
      },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get("/me", auth, async (req: any, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id).select("-password");

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    res.json({
      success: true,
      message: "User profile retrieved successfully",
      data: user,
    });
  } catch (error: any) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user profile",
      error: error.message,
    });
  }
});

export default router;
