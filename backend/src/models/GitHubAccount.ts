import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IGitHubAccount extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;

  // Account Information
  nickname: string;
  username: string;
  email?: string;
  avatarUrl?: string;

  // Authentication
  token: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;

  // GitHub Account Details
  githubId: number;
  githubLogin: string;
  githubName?: string;
  githubType: "User" | "Organization";

  // Permissions & Scopes
  scopes: string[];
  permissions: {
    createRepo: boolean;
    deleteRepo: boolean;
    readRepo: boolean;
    writeRepo: boolean;
    adminRepo: boolean;
  };

  // Status & Configuration
  isActive: boolean;
  isDefault: boolean;
  lastUsedAt?: Date;
  lastValidatedAt?: Date;
  validationStatus: "valid" | "invalid" | "pending" | "expired";
  validationError?: string;

  // Statistics
  stats: {
    repositoriesCreated: number;
    lastRepositoryCreated?: Date;
    totalApiCalls: number;
    lastApiCall?: Date;
  };

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

const GitHubAccountSchema = new Schema<IGitHubAccount>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    // Account Information
    nickname: {
      type: String,
      required: [true, "Account nickname is required"],
      trim: true,
      maxlength: [50, "Nickname cannot exceed 50 characters"],
    },
    username: {
      type: String,
      required: [true, "GitHub username is required"],
      trim: true,
      maxlength: [39, "GitHub username cannot exceed 39 characters"],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    avatarUrl: {
      type: String,
      trim: true,
    },

    // Authentication (encrypted)
    token: {
      type: String,
      required: [true, "GitHub token is required"],
      select: false, // Don't include in queries by default
    },
    refreshToken: {
      type: String,
      select: false,
    },
    tokenExpiresAt: {
      type: Date,
    },

    // GitHub Account Details
    githubId: {
      type: Number,
      required: true,
      unique: true,
    },
    githubLogin: {
      type: String,
      required: true,
      trim: true,
    },
    githubName: {
      type: String,
      trim: true,
    },
    githubType: {
      type: String,
      enum: ["User", "Organization"],
      default: "User",
    },

    // Permissions & Scopes
    scopes: {
      type: [String],
      default: [],
    },
    permissions: {
      createRepo: { type: Boolean, default: false },
      deleteRepo: { type: Boolean, default: false },
      readRepo: { type: Boolean, default: false },
      writeRepo: { type: Boolean, default: false },
      adminRepo: { type: Boolean, default: false },
    },

    // Status & Configuration
    isActive: {
      type: Boolean,
      default: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
    lastValidatedAt: {
      type: Date,
    },
    validationStatus: {
      type: String,
      enum: ["valid", "invalid", "pending", "expired"],
      default: "pending",
    },
    validationError: {
      type: String,
    },

    // Statistics
    stats: {
      repositoriesCreated: { type: Number, default: 0 },
      lastRepositoryCreated: { type: Date },
      totalApiCalls: { type: Number, default: 0 },
      lastApiCall: { type: Date },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc: any, ret: any) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.token; // Never expose tokens in JSON
        delete ret.refreshToken;
        return ret;
      },
    },
  }
);

// Indexes for performance
GitHubAccountSchema.index({ userId: 1, isActive: 1 });
GitHubAccountSchema.index({ organizationId: 1, isActive: 1 });
GitHubAccountSchema.index({ githubId: 1 }, { unique: true });
GitHubAccountSchema.index({ userId: 1, isDefault: 1 });
GitHubAccountSchema.index({ validationStatus: 1 });

// Ensure only one default account per user
GitHubAccountSchema.index(
  { userId: 1, isDefault: 1 },
  {
    unique: true,
    partialFilterExpression: { isDefault: true },
  }
);

// Pre-save middleware to handle default account logic
GitHubAccountSchema.pre<IGitHubAccount>("save", async function (next) {
  // If this is being set as default, unset all other defaults for this user
  if (this.isDefault && this.isModified("isDefault")) {
    await (this.constructor as any).updateMany(
      {
        userId: this.userId,
        _id: { $ne: this._id },
      },
      { $set: { isDefault: false } }
    );
  }

  // If this is the first account for the user, make it default
  if (this.isNew) {
    const existingAccounts = await (this.constructor as any).countDocuments({
      userId: this.userId,
    });

    if (existingAccounts === 0) {
      this.isDefault = true;
    }
  }

  next();
});

// Instance methods
GitHubAccountSchema.methods.updateStats = function (action: string) {
  const now = new Date();

  switch (action) {
    case "api_call":
      this.stats.totalApiCalls += 1;
      this.stats.lastApiCall = now;
      break;
    case "repo_created":
      this.stats.repositoriesCreated += 1;
      this.stats.lastRepositoryCreated = now;
      break;
  }

  this.lastUsedAt = now;
};

GitHubAccountSchema.methods.validateToken = async function () {
  // This will be implemented in the service layer
  // to avoid circular dependencies
  this.lastValidatedAt = new Date();
};

// Static methods
GitHubAccountSchema.statics.getDefaultForUser = function (userId: string) {
  return this.findOne({ userId, isDefault: true, isActive: true });
};

GitHubAccountSchema.statics.setDefault = async function (
  accountId: string,
  userId: string
) {
  try {
    // Unset all defaults for the user
    await this.updateMany({ userId }, { $set: { isDefault: false } });

    // Set the new default
    const updatedAccount = await this.findByIdAndUpdate(
      accountId,
      { $set: { isDefault: true, lastUsedAt: new Date() } },
      { new: true }
    );

    return updatedAccount;
  } catch (error) {
    throw error;
  }
};

export const GitHubAccount = mongoose.model<IGitHubAccount>(
  "GitHubAccount",
  GitHubAccountSchema
);
