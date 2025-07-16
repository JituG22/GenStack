import { Router, Response } from "express";
import { auth } from "../middleware/auth";
import { Node } from "../models/Node-simple";
import { AuthRequest } from "../types";
import {
  validateNode,
  validatePagination,
  validateObjectId,
  handleValidationErrors,
} from "../middleware/validation";

const router = Router();

// @route   GET /api/nodes
// @desc    Get all nodes for user's organization with pagination and search
// @access  Private
router.get(
  "/",
  auth,
  validatePagination,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const type = req.query.type as string;
      const category = req.query.category as string;
      const isActive = req.query.isActive as string;
      const sortBy = (req.query.sortBy as string) || "createdAt";
      const sortOrder = (req.query.sortOrder as string) || "desc";
      const skip = (page - 1) * limit;

      // Build search query
      let searchQuery: any = {
        organization: req.user!.organization,
      };

      if (search) {
        searchQuery.$or = [
          { name: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { tags: { $in: [new RegExp(search, "i")] } },
        ];
      }

      if (type) {
        searchQuery.type = type;
      }

      if (category) {
        searchQuery.category = category;
      }

      if (isActive !== undefined) {
        searchQuery.isActive = isActive === "true";
      }

      // Build sort object
      const validSortFields = [
        "name",
        "createdAt",
        "updatedAt",
        "type",
        "category",
      ];
      const sortField = validSortFields.includes(sortBy) ? sortBy : "createdAt";
      const sort: any = {};
      sort[sortField] = sortOrder === "asc" ? 1 : -1;

      // Get total count for pagination
      const total = await Node.countDocuments(searchQuery);

      // Get nodes with pagination
      const nodes = await Node.find(searchQuery)
        .populate("createdBy", "firstName lastName email")
        .sort(sort)
        .skip(skip)
        .limit(limit);

      res.json({
        success: true,
        message: "Nodes retrieved successfully",
        data: nodes,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
        sort: {
          sortBy: sortField,
          sortOrder,
        },
      });
    } catch (error: any) {
      console.error("Get nodes error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve nodes",
        error: error.message,
      });
    }
  }
);

// @route   POST /api/nodes
// @desc    Create new node
// @access  Private
router.post(
  "/",
  auth,
  validateNode,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const nodeData = {
        ...req.body,
        organization: req.user!.organization,
        createdBy: req.user!.id,
      };

      const node = await Node.create(nodeData);
      await node.populate("createdBy", "firstName lastName email");
      await node.populate("createdBy", "firstName lastName email");

      res.status(201).json({
        success: true,
        message: "Node created successfully",
        data: node,
      });
    } catch (error: any) {
      console.error("Create node error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create node",
        error: error.message,
      });
    }
  }
);

// @route   GET /api/nodes/:id
// @desc    Get node by ID
// @access  Private
router.get(
  "/:id",
  auth,
  validateObjectId,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const node = await Node.findOne({
        _id: req.params.id,
        organization: req.user!.organization,
      }).populate("createdBy", "firstName lastName email");

      if (!node) {
        res.status(404).json({
          success: false,
          message: "Node not found",
        });
        return;
      }

      res.json({
        success: true,
        message: "Node retrieved successfully",
        data: node,
      });
    } catch (error: any) {
      console.error("Get node error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve node",
        error: error.message,
      });
    }
  }
);

// @route   PUT /api/nodes/:id
// @desc    Update node
// @access  Private
router.put(
  "/:id",
  auth,
  validateNode,
  handleValidationErrors,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const node = await Node.findOneAndUpdate(
        {
          _id: req.params.id,
          organization: req.user!.organization,
        },
        req.body,
        { new: true, runValidators: true }
      ).populate("createdBy", "firstName lastName email");

      if (!node) {
        res.status(404).json({
          success: false,
          message: "Node not found",
        });
        return;
      }

      res.json({
        success: true,
        message: "Node updated successfully",
        data: node,
      });
    } catch (error: any) {
      console.error("Update node error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update node",
        error: error.message,
      });
    }
  }
);

// @route   DELETE /api/nodes/:id
// @desc    Delete node
// @access  Private
router.delete(
  "/:id",
  auth,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const node = await Node.findOneAndDelete({
        _id: req.params.id,
        organization: req.user!.organization,
      });

      if (!node) {
        res.status(404).json({
          success: false,
          message: "Node not found",
        });
        return;
      }

      res.json({
        success: true,
        message: "Node deleted successfully",
      });
    } catch (error: any) {
      console.error("Delete node error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete node",
        error: error.message,
      });
    }
  }
);

export default router;
