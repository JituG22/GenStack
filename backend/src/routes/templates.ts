import { Router, Response } from "express";
import { auth } from "../middleware/auth";
import { Template } from "../models/Template-simple";
import { AuthRequest } from "../types";

const router = Router();

// @route   GET /api/templates
// @desc    Get all templates (public + organization templates)
// @access  Private
router.get(
  "/",
  auth,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const templates = await Template.find({
        $or: [{ isPublic: true }, { organization: req.user!.organization }],
      })
        .populate("createdBy", "firstName lastName email")
        .sort({ downloads: -1, createdAt: -1 });

      res.json({
        success: true,
        message: "Templates retrieved successfully",
        data: templates,
      });
    } catch (error: any) {
      console.error("Get templates error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve templates",
        error: error.message,
      });
    }
  }
);

// @route   POST /api/templates
// @desc    Create new template
// @access  Private
router.post(
  "/",
  auth,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const templateData = {
        ...req.body,
        organization: req.user!.organization,
        createdBy: req.user!.id,
      };

      const template = await Template.create(templateData);
      await template.populate("createdBy", "firstName lastName email");

      res.status(201).json({
        success: true,
        message: "Template created successfully",
        data: template,
      });
    } catch (error: any) {
      console.error("Create template error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create template",
        error: error.message,
      });
    }
  }
);

export default router;
