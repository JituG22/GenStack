import { Router, Response } from "express";
import { auth } from "../middleware/auth";
import { Project } from "../models/Project-simple";
import { AuthRequest } from "../types";

const router = Router();

// @route   GET /api/projects
// @desc    Get all projects for user's organization
// @access  Private
router.get(
  "/",
  auth,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const projects = await Project.find({
        organization: req.user!.organization,
      })
        .populate("createdBy", "firstName lastName email")
        .populate("collaborators", "firstName lastName email")
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        message: "Projects retrieved successfully",
        data: projects,
      });
    } catch (error: any) {
      console.error("Get projects error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve projects",
        error: error.message,
      });
    }
  }
);

// @route   POST /api/projects
// @desc    Create new project
// @access  Private
router.post(
  "/",
  auth,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const projectData = {
        ...req.body,
        organization: req.user!.organization,
        createdBy: req.user!.id,
      };

      const project = await Project.create(projectData);
      await project.populate("createdBy", "firstName lastName email");

      res.status(201).json({
        success: true,
        message: "Project created successfully",
        data: project,
      });
    } catch (error: any) {
      console.error("Create project error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create project",
        error: error.message,
      });
    }
  }
);

// @route   GET /api/projects/:id
// @desc    Get project by ID
// @access  Private
router.get(
  "/:id",
  auth,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const project = await Project.findOne({
        _id: req.params.id,
        organization: req.user!.organization,
      })
        .populate("createdBy", "firstName lastName email")
        .populate("collaborators", "firstName lastName email")
        .populate("nodes");

      if (!project) {
        res.status(404).json({
          success: false,
          message: "Project not found",
        });
        return;
      }

      res.json({
        success: true,
        message: "Project retrieved successfully",
        data: project,
      });
    } catch (error: any) {
      console.error("Get project error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve project",
        error: error.message,
      });
    }
  }
);

export default router;
