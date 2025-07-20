import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcryptjs";
import { UserRole } from "../types";

// Enhanced User interface with additional fields for advanced features
export interface IUserDocumentNew extends Document {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: UserRole;
  organization: mongoose.Types.ObjectId;
  projects: mongoose.Types.ObjectId[];

  // Enhanced profile fields
  avatar?: string;
  bio?: string;
  timezone?: string;
  preferences: {
    theme: "light" | "dark" | "auto";
    language: string;
    notifications: {
      email: boolean;
      realTime: boolean;
      collaborativEditing: boolean;
      projectUpdates: boolean;
    };
    dashboard: {
      layout: "grid" | "list";
      defaultView: "projects" | "analytics" | "templates";
      showTutorials: boolean;
    };
  };

  // Collaboration features
  collaborationSettings: {
    allowRealTimeEditing: boolean;
    showCursor: boolean;
    sharePresence: boolean;
    defaultProjectVisibility: "private" | "team" | "organization";
  };

  // Activity tracking
  lastLogin?: Date;
  lastActivity?: Date;
  loginHistory: Array<{
    ip: string;
    userAgent: string;
    timestamp: Date;
    location?: string;
  }>;

  // Feature usage analytics
  featureUsage: {
    templatesCreated: number;
    projectsCreated: number;
    collaborativeSessions: number;
    lastTemplateUsed?: Date;
    favoriteFeatures: string[];
  };

  // Social features
  following: mongoose.Types.ObjectId[];
  followers: mongoose.Types.ObjectId[];
  teams: mongoose.Types.ObjectId[];

  // Security and permissions
  isActive: boolean;
  isVerified: boolean;
  twoFactorEnabled: boolean;
  apiKeys: Array<{
    name: string;
    key: string;
    permissions: string[];
    createdAt: Date;
    lastUsed?: Date;
    expiresAt?: Date;
  }>;

  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  getFullName(): string;
  getDisplayName(): string;
  updateLastActivity(): Promise<void>;
  addLoginRecord(
    ip: string,
    userAgent: string,
    location?: string
  ): Promise<void>;
}

// Static methods interface
export interface IUserModelNew extends Model<IUserDocumentNew> {
  findByEmail(email: string): Promise<IUserDocumentNew | null>;
  findActiveUsers(): Promise<IUserDocumentNew[]>;
  findRecentlyActive(hours?: number): Promise<IUserDocumentNew[]>;
}

const UserSchemaNew = new Schema<IUserDocumentNew>(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      maxlength: [50, "First name cannot exceed 50 characters"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.DEVELOPER,
    },
    organization: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization is required"],
    },
    projects: [
      {
        type: Schema.Types.ObjectId,
        ref: "Project",
      },
    ],

    // Enhanced profile fields
    avatar: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      maxlength: [500, "Bio cannot exceed 500 characters"],
    },
    timezone: {
      type: String,
      default: "UTC",
    },
    preferences: {
      theme: {
        type: String,
        enum: ["light", "dark", "auto"],
        default: "light",
      },
      language: {
        type: String,
        default: "en",
      },
      notifications: {
        email: {
          type: Boolean,
          default: true,
        },
        realTime: {
          type: Boolean,
          default: true,
        },
        collaborativEditing: {
          type: Boolean,
          default: true,
        },
        projectUpdates: {
          type: Boolean,
          default: true,
        },
      },
      dashboard: {
        layout: {
          type: String,
          enum: ["grid", "list"],
          default: "grid",
        },
        defaultView: {
          type: String,
          enum: ["projects", "analytics", "templates"],
          default: "projects",
        },
        showTutorials: {
          type: Boolean,
          default: true,
        },
      },
    },

    // Collaboration features
    collaborationSettings: {
      allowRealTimeEditing: {
        type: Boolean,
        default: true,
      },
      showCursor: {
        type: Boolean,
        default: true,
      },
      sharePresence: {
        type: Boolean,
        default: true,
      },
      defaultProjectVisibility: {
        type: String,
        enum: ["private", "team", "organization"],
        default: "team",
      },
    },

    // Activity tracking
    lastLogin: {
      type: Date,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    loginHistory: [
      {
        ip: {
          type: String,
          required: true,
        },
        userAgent: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        location: {
          type: String,
        },
      },
    ],

    // Feature usage analytics
    featureUsage: {
      templatesCreated: {
        type: Number,
        default: 0,
      },
      projectsCreated: {
        type: Number,
        default: 0,
      },
      collaborativeSessions: {
        type: Number,
        default: 0,
      },
      lastTemplateUsed: {
        type: Date,
      },
      favoriteFeatures: [
        {
          type: String,
        },
      ],
    },

    // Social features
    following: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    followers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    teams: [
      {
        type: Schema.Types.ObjectId,
        ref: "Team",
      },
    ],

    // Security and permissions
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    apiKeys: [
      {
        name: {
          type: String,
          required: true,
        },
        key: {
          type: String,
          required: true,
        },
        permissions: [
          {
            type: String,
          },
        ],
        createdAt: {
          type: Date,
          default: Date.now,
        },
        lastUsed: {
          type: Date,
        },
        expiresAt: {
          type: Date,
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        const { password, __v, ...rest } = ret;
        return rest;
      },
    },
  }
);

// Indexes for performance
UserSchemaNew.index({ email: 1 });
UserSchemaNew.index({ organization: 1 });
UserSchemaNew.index({ "apiKeys.key": 1 });
UserSchemaNew.index({ lastActivity: -1 });

// Pre-save middleware to hash password
UserSchemaNew.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Instance methods
UserSchemaNew.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error("Password comparison failed");
  }
};

UserSchemaNew.methods.getFullName = function (): string {
  return `${this.firstName} ${this.lastName}`.trim();
};

UserSchemaNew.methods.getDisplayName = function (): string {
  return this.getFullName() || this.email;
};

UserSchemaNew.methods.updateLastActivity = async function (): Promise<void> {
  this.lastActivity = new Date();
  await this.save();
};

UserSchemaNew.methods.addLoginRecord = async function (
  ip: string,
  userAgent: string,
  location?: string
): Promise<void> {
  this.loginHistory.push({
    ip,
    userAgent,
    timestamp: new Date(),
    location,
  });

  // Keep only last 10 login records
  if (this.loginHistory.length > 10) {
    this.loginHistory = this.loginHistory.slice(-10);
  }

  this.lastLogin = new Date();
  await this.save();
};

// Static methods
UserSchemaNew.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

UserSchemaNew.statics.findActiveUsers = function () {
  return this.find({ isActive: true });
};

UserSchemaNew.statics.findRecentlyActive = function (hours: number = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  return this.find({
    lastActivity: { $gte: since },
    isActive: true,
  });
};

export const UserNew = mongoose.model<IUserDocumentNew, IUserModelNew>(
  "UserNew",
  UserSchemaNew
);
