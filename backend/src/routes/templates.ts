import { Router, Response } from "express";
import { auth } from "../middleware/auth";
import { Template } from "../models/Template-simple";
import { AuthRequest } from "../types";
import {
  validateTemplate,
  validatePagination,
  handleValidationErrors,
} from "../middleware/validation";

const router = Router();

// @route   GET /api/templates
// @desc    Get all templates (public + organization templates) with pagination and search
// @access  Private
router.get(
  "/",
  auth,
  validatePagination,
  handleValidationErrors,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const category = req.query.category as string;
      const isPublic = req.query.isPublic as string;
      const sortBy = (req.query.sortBy as string) || "downloads";
      const sortOrder = (req.query.sortOrder as string) || "desc";

      const skip = (page - 1) * limit;

      // Build search query
      const searchQuery: any = {
        $or: [{ isPublic: true }, { organization: req.user!.organization }],
      };

      if (search) {
        searchQuery.$and = [
          {
            $or: [{ isPublic: true }, { organization: req.user!.organization }],
          },
          {
            $or: [
              { name: { $regex: search, $options: "i" } },
              { description: { $regex: search, $options: "i" } },
              { tags: { $in: [new RegExp(search, "i")] } },
            ],
          },
        ];
        delete searchQuery.$or;
      }

      if (category) {
        searchQuery.category = category;
      }

      if (isPublic === "true") {
        searchQuery.isPublic = true;
        delete searchQuery.$or;
        delete searchQuery.$and;
      } else if (isPublic === "false") {
        searchQuery.organization = req.user!.organization;
        searchQuery.isPublic = false;
        delete searchQuery.$or;
        delete searchQuery.$and;
      }

      // Build sort object
      const validSortFields = [
        "name",
        "createdAt",
        "updatedAt",
        "downloads",
        "category",
        "rating.average",
      ];
      const sortField = validSortFields.includes(sortBy) ? sortBy : "downloads";
      const sort: any = {};
      sort[sortField] = sortOrder === "asc" ? 1 : -1;

      // Add secondary sort by createdAt for consistency
      if (sortField !== "createdAt") {
        sort.createdAt = -1;
      }

      const total = await Template.countDocuments(searchQuery);
      const templates = await Template.find(searchQuery)
        .populate("createdBy", "firstName lastName email")
        .sort(sort)
        .skip(skip)
        .limit(limit);

      const pages = Math.ceil(total / limit);

      res.json({
        success: true,
        message: "Templates retrieved successfully",
        data: templates,
        pagination: {
          page,
          limit,
          total,
          pages,
          hasNext: page < pages,
          hasPrev: page > 1,
        },
        sort: {
          sortBy: sortField,
          sortOrder,
        },
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
  validateTemplate,
  handleValidationErrors,
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

// @route   GET /api/templates/:id
// @desc    Get template by ID
// @access  Private
router.get(
  "/:id",
  auth,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const template = await Template.findOne({
        _id: req.params.id,
        $or: [{ isPublic: true }, { organization: req.user!.organization }],
      }).populate("createdBy", "firstName lastName email");

      if (!template) {
        res.status(404).json({
          success: false,
          message: "Template not found",
        });
        return;
      }

      res.json({
        success: true,
        message: "Template retrieved successfully",
        data: template,
      });
    } catch (error: any) {
      console.error("Get template error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve template",
        error: error.message,
      });
    }
  }
);

// @route   PUT /api/templates/:id
// @desc    Update template by ID (only if user owns it)
// @access  Private
router.put(
  "/:id",
  auth,
  validateTemplate,
  handleValidationErrors,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const template = await Template.findOneAndUpdate(
        {
          _id: req.params.id,
          organization: req.user!.organization,
          createdBy: req.user!.id, // Only allow creator to update
        },
        req.body,
        { new: true, runValidators: true }
      ).populate("createdBy", "firstName lastName email");

      if (!template) {
        res.status(404).json({
          success: false,
          message:
            "Template not found or you don't have permission to update it",
        });
        return;
      }

      res.json({
        success: true,
        message: "Template updated successfully",
        data: template,
      });
    } catch (error: any) {
      console.error("Update template error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update template",
        error: error.message,
      });
    }
  }
);

// @route   DELETE /api/templates/:id
// @desc    Delete template by ID (only if user owns it)
// @access  Private
router.delete(
  "/:id",
  auth,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const template = await Template.findOneAndDelete({
        _id: req.params.id,
        organization: req.user!.organization,
        createdBy: req.user!.id, // Only allow creator to delete
      });

      if (!template) {
        res.status(404).json({
          success: false,
          message:
            "Template not found or you don't have permission to delete it",
        });
        return;
      }

      res.json({
        success: true,
        message: "Template deleted successfully",
        data: { id: req.params.id },
      });
    } catch (error: any) {
      console.error("Delete template error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete template",
        error: error.message,
      });
    }
  }
);

export default router;
