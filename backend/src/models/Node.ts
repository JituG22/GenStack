import mongoose, { Schema, Document } from "mongoose";
import {
  INode,
  NodeType,
  ValidationRule,
  NodeMetadata,
  NodePosition,
  NodeConnection,
} from "../types";

interface INodeDocument extends INode, Document {}

const ValidationRuleSchema = new Schema<ValidationRule>(
  {
    field: {
      type: String,
      required: true,
    },
    rule: {
      type: String,
      required: true,
    },
    value: Schema.Types.Mixed,
    message: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const NodeMetadataSchema = new Schema<NodeMetadata>(
  {
    category: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    version: {
      type: String,
      required: true,
      default: "1.0.0",
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    icon: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const NodePositionSchema = new Schema<NodePosition>(
  {
    x: {
      type: Number,
      required: true,
      default: 0,
    },
    y: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { _id: false }
);

const NodeConnectionSchema = new Schema<NodeConnection>(
  {
    sourceNodeId: {
      type: Schema.Types.ObjectId,
      ref: "Node",
      required: true,
    },
    targetNodeId: {
      type: Schema.Types.ObjectId,
      ref: "Node",
      required: true,
    },
    sourceHandle: {
      type: String,
      required: true,
    },
    targetHandle: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const NodeSchema = new Schema<INodeDocument>(
  {
    name: {
      type: String,
      required: [true, "Node name is required"],
      trim: true,
      maxlength: [100, "Node name cannot exceed 100 characters"],
    },
    type: {
      type: String,
      enum: Object.values(NodeType),
      required: [true, "Node type is required"],
    },
    template: {
      type: String,
      required: [true, "Node template is required"],
    },
    properties: {
      type: Schema.Types.Mixed,
      default: {},
    },
    validations: [ValidationRuleSchema],
    metadata: {
      type: NodeMetadataSchema,
      required: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Project ID is required"],
    },
    position: NodePositionSchema,
    connections: [NodeConnectionSchema],
    isTemplate: {
      type: Boolean,
      default: false,
    },
    parentTemplate: {
      type: Schema.Types.ObjectId,
      ref: "Node",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator is required"],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
NodeSchema.index({ projectId: 1 });
NodeSchema.index({ type: 1 });
NodeSchema.index({ createdBy: 1 });
NodeSchema.index({ isTemplate: 1 });
NodeSchema.index({ "metadata.category": 1 });
NodeSchema.index({ "metadata.tags": 1 });

export const Node = mongoose.model<INodeDocument>("Node", NodeSchema);
