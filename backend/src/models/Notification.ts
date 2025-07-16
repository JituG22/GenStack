import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type:
    | "system"
    | "social"
    | "project"
    | "collaboration"
    | "achievement"
    | "reminder";
  title: string;
  message: string;
  data?: any; // Additional data specific to notification type
  priority: "low" | "medium" | "high" | "urgent";
  category: string;

  // Status and actions
  isRead: boolean;
  isArchived: boolean;
  actionUrl?: string;
  actionText?: string;

  // Scheduling and delivery
  scheduledFor?: Date;
  deliveredAt?: Date;
  expiresAt?: Date;

  // Source information
  sourceType?: "user" | "system" | "project" | "team";
  sourceId?: mongoose.Types.ObjectId;

  // Metadata
  tags: string[];
  channels: Array<"app" | "email" | "push">;

  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "system",
        "social",
        "project",
        "collaboration",
        "achievement",
        "reminder",
      ],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    data: {
      type: Schema.Types.Mixed,
      default: {},
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
      index: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },

    // Status
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    actionUrl: {
      type: String,
    },
    actionText: {
      type: String,
      maxlength: 50,
    },

    // Scheduling
    scheduledFor: {
      type: Date,
      index: true,
    },
    deliveredAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
      index: true,
    },

    // Source
    sourceType: {
      type: String,
      enum: ["user", "system", "project", "team"],
    },
    sourceId: {
      type: Schema.Types.ObjectId,
    },

    // Metadata
    tags: [
      {
        type: String,
        index: true,
      },
    ],
    channels: [
      {
        type: String,
        enum: ["app", "email", "push"],
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        const { __v, ...rest } = ret;
        return rest;
      },
    },
  }
);

// Compound indexes for efficient queries
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, type: 1, isArchived: 1 });
NotificationSchema.index({ scheduledFor: 1, deliveredAt: 1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Pre-save middleware to set default expiration
NotificationSchema.pre("save", function (next) {
  if (!this.expiresAt) {
    // Default expiration: 30 days for low priority, 90 days for others
    const days = this.priority === "low" ? 30 : 90;
    this.expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }

  if (!this.scheduledFor) {
    this.scheduledFor = new Date();
  }

  next();
});

// Instance methods
NotificationSchema.methods.markAsRead = function () {
  this.isRead = true;
  this.deliveredAt = new Date();
  return this.save();
};

NotificationSchema.methods.archive = function () {
  this.isArchived = true;
  return this.save();
};

// Static methods
NotificationSchema.statics.findUnreadByUser = function (userId: string) {
  return this.find({
    userId,
    isRead: false,
    isArchived: false,
    $or: [
      { scheduledFor: { $lte: new Date() } },
      { scheduledFor: { $exists: false } },
    ],
  }).sort({ priority: -1, createdAt: -1 });
};

NotificationSchema.statics.markAllAsRead = function (userId: string) {
  return this.updateMany(
    { userId, isRead: false },
    { isRead: true, deliveredAt: new Date() }
  );
};

NotificationSchema.statics.deleteExpired = function () {
  return this.deleteMany({
    expiresAt: { $lt: new Date() },
  });
};

export const Notification = mongoose.model<INotification>(
  "Notification",
  NotificationSchema
);
