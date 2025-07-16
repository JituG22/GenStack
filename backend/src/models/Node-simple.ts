import { Schema, model } from "mongoose";

// Simple Node schema that works
const nodeSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["input", "output", "transformation", "api", "database", "custom"],
      default: "custom",
    },
    category: {
      type: String,
      required: true,
      enum: ["data", "api", "transformation", "utility", "custom"],
      default: "custom",
    },
    configuration: {
      type: Schema.Types.Mixed,
      default: {},
    },
    organization: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    version: {
      type: String,
      default: "1.0.0",
    },
    tags: [String],
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (_doc: any, ret: any) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const Node = model("Node", nodeSchema);
