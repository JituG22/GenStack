import { Schema, model } from "mongoose";

// Simple Project schema
const projectSchema = new Schema(
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
    status: {
      type: String,
      enum: ["draft", "active", "completed", "archived"],
      default: "draft",
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
    collaborators: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    nodes: [
      {
        type: Schema.Types.ObjectId,
        ref: "Node",
      },
    ],
    isPublic: {
      type: Boolean,
      default: false,
    },
    tags: [String],
    metadata: {
      version: {
        type: String,
        default: "1.0.0",
      },
      lastModified: {
        type: Date,
        default: Date.now,
      },
    },
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

export const Project = model("Project", projectSchema);
