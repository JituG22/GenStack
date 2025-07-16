import { Router, Response } from "express";
import { auth } from "../middleware/auth";
import { Project } from "../models/Project-simple";
import { AuthRequest } from "../types";
import {
  validateProject,
  validatePagination,
  handleValidationErrors,
} from "../middleware/validation";
import { FilterService, AdvancedFilter } from "../services/filterService";

const router = Router();

// @route   GET /api/projects
// @desc    Get all projects for user's organization with pagination and search
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
      const status = req.query.status as string;
      const sortBy = (req.query.sortBy as string) || "createdAt";
      const sortOrder = (req.query.sortOrder as string) || "desc";

      const skip = (page - 1) * limit;

      // Build search query
      const searchQuery: any = {
        organization: req.user!.organization,
      };

      if (search) {
        searchQuery.$or = [
          { name: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { tags: { $in: [new RegExp(search, "i")] } },
        ];
      }

      if (status) {
        searchQuery.status = status;
      }

      // Build sort object
      const validSortFields = [
        "name",
        "createdAt",
        "updatedAt",
        "status",
        "metadata.lastModified",
      ];
      const sortField = validSortFields.includes(sortBy) ? sortBy : "createdAt";
      const sort: any = {};
      sort[sortField] = sortOrder === "asc" ? 1 : -1;

      const total = await Project.countDocuments(searchQuery);
      const projects = await Project.find(searchQuery)
        .populate("createdBy", "firstName lastName email")
        .populate("collaborators", "firstName lastName email")
        .sort(sort)
        .skip(skip)
        .limit(limit);

      const pages = Math.ceil(total / limit);

      res.json({
        success: true,
        message: "Projects retrieved successfully",
        data: projects,
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
      console.error("Get projects error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve projects",
        error: error.message,
      });
    }
  }
);

// @route   POST /api/projects/filter
// @desc    Get projects with advanced filtering
// @access  Private
router.post(
  "/filter",
  auth,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const filters: AdvancedFilter = req.body;

      // Validate filters
      const validation = FilterService.validateFilters(filters);
      if (!validation.valid) {
        res.status(400).json({
          success: false,
          message: "Invalid filter parameters",
          errors: validation.errors,
        });
        return;
      }

      // Add organization filter to ensure user can only see their org's projects
      if (!filters.operators) {
        filters.operators = [];
      }
      filters.operators.push({
        field: "organization",
        operator: "eq",
        value: req.user!.organization,
      });

      // Build query
      const query = FilterService.buildQuery(filters);
      const sort = FilterService.buildSort(filters);

      // Setup pagination
      const page = filters.pagination?.page || 1;
      const limit = Math.min(filters.pagination?.limit || 10, 100);
      const skip = (page - 1) * limit;

      // Execute query
      const total = await Project.countDocuments(query);
      const projects = await Project.find(query)
        .populate("createdBy", "firstName lastName email")
        .populate("collaborators", "firstName lastName email")
        .sort(sort)
        .skip(skip)
        .limit(limit);

      const pages = Math.ceil(total / limit);

      res.json({
        success: true,
        message: "Projects filtered successfully",
        data: projects,
        pagination: {
          page,
          limit,
          total,
          pages,
          hasNext: page < pages,
          hasPrev: page > 1,
        },
        filters: {
          applied: filters,
          resultsCount: projects.length,
        },
      });
    } catch (error: any) {
      console.error("Filter projects error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to filter projects",
        error: error.message,
      });
    }
  }
);

// @route   GET /api/projects/suggestions/:field
// @desc    Get filter suggestions for a specific field
// @access  Private
router.get(
  "/suggestions/:field",
  auth,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { field } = req.params;
      const query = req.query.query as string;

      // Validate field name to prevent injection
      const allowedFields = [
        "status",
        "tags",
        "createdBy",
        "collaborators",
        "metadata.category",
        "metadata.priority",
      ];

      if (!allowedFields.includes(field)) {
        res.status(400).json({
          success: false,
          message: "Invalid field for suggestions",
        });
        return;
      }

      const suggestions = await FilterService.getFilterSuggestions(
        Project,
        field,
        query
      );

      res.json({
        success: true,
        message: "Suggestions retrieved successfully",
        data: suggestions,
        field,
      });
    } catch (error: any) {
      console.error("Get suggestions error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get suggestions",
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
  validateProject,
  handleValidationErrors,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const projectData = {
        ...req.body,
        organization: req.user!.organization,
        createdBy: req.user!.id,
      };

      const project = await Project.create(projectData);
      await project.populate("createdBy", "firstName lastName email");

      // Send real-time notification
      const wsService = (global as any).webSocketService;
      if (wsService) {
        wsService.notifyProjectCreated(
          req.user!.organization,
          project,
          req.user
        );
      }

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

// @route   PUT /api/projects/:id
// @desc    Update project by ID
// @access  Private
router.put(
  "/:id",
  auth,
  validateProject,
  handleValidationErrors,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const project = await Project.findOneAndUpdate(
        {
          _id: req.params.id,
          organization: req.user!.organization,
        },
        {
          ...req.body,
          "metadata.lastModified": new Date(),
        },
        { new: true, runValidators: true }
      )
        .populate("createdBy", "firstName lastName email")
        .populate("collaborators", "firstName lastName email");

      if (!project) {
        res.status(404).json({
          success: false,
          message: "Project not found",
        });
        return;
      }

      res.json({
        success: true,
        message: "Project updated successfully",
        data: project,
      });
    } catch (error: any) {
      console.error("Update project error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update project",
        error: error.message,
      });
    }
  }
);

// @route   DELETE /api/projects/bulk
// @desc    Bulk delete projects
// @access  Private
router.delete(
  "/bulk",
  auth,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({
          success: false,
          message: "Please provide an array of project IDs to delete",
        });
        return;
      }

      const result = await Project.deleteMany({
        _id: { $in: ids },
        organization: req.user!.organization,
      });

      // Send real-time notification for bulk delete
      const wsService = (global as any).webSocketService;
      if (wsService) {
        wsService.notifyBulkProjectsDeleted(
          req.user!.organization,
          ids,
          req.user
        );
      }

      res.json({
        success: true,
        message: `${result.deletedCount} projects deleted successfully`,
        data: {
          deletedCount: result.deletedCount,
          requestedIds: ids.length,
        },
      });
    } catch (error: any) {
      console.error("Bulk delete projects error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete projects",
        error: error.message,
      });
    }
  }
);

// @route   DELETE /api/projects/:id
// @desc    Delete project by ID
// @access  Private
router.delete(
  "/:id",
  auth,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const project = await Project.findOneAndDelete({
        _id: req.params.id,
        organization: req.user!.organization,
      });

      if (!project) {
        res.status(404).json({
          success: false,
          message: "Project not found",
        });
        return;
      }

      // Send real-time notification for single delete
      const wsService = (global as any).webSocketService;
      if (wsService) {
        wsService.notifyProjectDeleted(
          req.user!.organization,
          req.params.id,
          req.user
        );
      }

      res.json({
        success: true,
        message: "Project deleted successfully",
        data: { id: req.params.id },
      });
    } catch (error: any) {
      console.error("Delete project error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete project",
        error: error.message,
      });
    }
  }
);

export default router;
