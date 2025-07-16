import { Schema, model, Document, Types } from "mongoose";

// Base organization interface
export interface IOrganization {
  name: string;
  description?: string;
  owner: Types.ObjectId;
  members: Types.ObjectId[];
  projects: Types.ObjectId[];
  settings: {
    allowPublicProjects: boolean;
    maxProjects: number;
    maxMembers: number;
  };
  subscription: {
    plan: "free" | "pro" | "enterprise";
    status: "active" | "cancelled" | "past_due";
    expiresAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Organization document interface (for Mongoose)
export interface IOrganizationDocument extends IOrganization, Document {}

// Organization schema
const organizationSchema = new Schema<IOrganizationDocument>(
  {
    name: {
      type: String,
      required: [true, "Organization name is required"],
      trim: true,
      maxlength: [100, "Organization name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Organization owner is required"],
    },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    projects: [
      {
        type: Schema.Types.ObjectId,
        ref: "Project",
      },
    ],
    settings: {
      allowPublicProjects: {
        type: Boolean,
        default: false,
      },
      maxProjects: {
        type: Number,
        default: 10,
      },
      maxMembers: {
        type: Number,
        default: 5,
      },
    },
    subscription: {
      plan: {
        type: String,
        enum: ["free", "pro", "enterprise"],
        default: "free",
      },
      status: {
        type: String,
        enum: ["active", "cancelled", "past_due"],
        default: "active",
      },
      expiresAt: {
        type: Date,
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (_doc, ret) {
        ret.id = ret._id;
        delete (ret as any)._id;
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

// Indexes
organizationSchema.index({ owner: 1 });
organizationSchema.index({ members: 1 });
organizationSchema.index({ createdAt: -1 });

export const Organization = model<IOrganizationDocument>(
  "Organization",
  organizationSchema
);
