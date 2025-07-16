import { Schema, model } from "mongoose";

// Simple Template schema
const templateSchema = new Schema(
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
    category: {
      type: String,
      required: true,
      enum: ["workflow", "component", "integration", "custom"],
      default: "custom",
    },
    configuration: {
      type: Schema.Types.Mixed,
      default: {},
    },
    nodes: [
      {
        type: Schema.Types.ObjectId,
        ref: "Node",
      },
    ],
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
    isPublic: {
      type: Boolean,
      default: false,
    },
    isOfficial: {
      type: Boolean,
      default: false,
    },
    version: {
      type: String,
      default: "1.0.0",
    },
    tags: [String],
    downloads: {
      type: Number,
      default: 0,
    },
    rating: {
      average: {
        type: Number,
        default: 0,
      },
      count: {
        type: Number,
        default: 0,
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

export const Template = model("Template", templateSchema);
