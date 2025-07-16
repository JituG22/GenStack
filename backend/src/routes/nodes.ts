import { Router, Response } from "express";
import { auth } from "../middleware/auth";
import { Node } from "../models/Node-simple";
import { AuthRequest } from "../types";

const router = Router();

// @route   GET /api/nodes
// @desc    Get all nodes for user's organization
// @access  Private
router.get(
  "/",
  auth,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const nodes = await Node.find({
        organization: req.user!.organization,
      })
        .populate("createdBy", "firstName lastName email")
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        message: "Nodes retrieved successfully",
        data: nodes,
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
