import mongoose, { Schema, Document } from "mongoose";

// Analytics Event Interface
export interface IAnalyticsEvent {
  eventType: string;
  eventCategory: string;
  eventAction: string;
  eventLabel?: string;
  userId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  sessionId: string;
  timestamp: Date;
  metadata: Record<string, any>;
  userAgent?: string;
  ip?: string;
  page?: string;
  referrer?: string;
}

// Performance Metrics Interface
export interface IPerformanceMetric {
  metricType: "query" | "request" | "system" | "cache";
  metricName: string;
  value: number;
  unit: string;
  timestamp: Date;
  userId?: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  metadata: Record<string, any>;
  tags: string[];
}

// Filter Analytics Interface
export interface IFilterAnalytics {
  filterId: string;
  filterType: "operator" | "dateRange" | "search" | "saved";
  filterConfig: Record<string, any>;
  executionTime: number;
  resultCount: number;
  userId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  timestamp: Date;
  successful: boolean;
  errorMessage?: string;
  queryComplexity: number;
}

// User Behavior Interface
export interface IUserBehavior {
  userId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  sessionId: string;
  pageViews: Array<{
    page: string;
    timestamp: Date;
    duration: number;
  }>;
  interactions: Array<{
    type: string;
    target: string;
    timestamp: Date;
    metadata: Record<string, any>;
  }>;
  searchQueries: Array<{
    query: string;
    timestamp: Date;
    results: number;
    executionTime: number;
  }>;
  filtersUsed: Array<{
    filterType: string;
    timestamp: Date;
    config: Record<string, any>;
  }>;
  sessionStart: Date;
  sessionEnd?: Date;
  totalDuration?: number;
}

// Analytics Event Document
export interface IAnalyticsEventDocument extends IAnalyticsEvent, Document {}

// Performance Metric Document
export interface IPerformanceMetricDocument
  extends IPerformanceMetric,
    Document {}

// Filter Analytics Document
export interface IFilterAnalyticsDocument extends IFilterAnalytics, Document {}

// User Behavior Document
export interface IUserBehaviorDocument extends IUserBehavior, Document {}

// Analytics Event Schema
const AnalyticsEventSchema = new Schema<IAnalyticsEventDocument>(
  {
    eventType: {
      type: String,
      required: [true, "Event type is required"],
      enum: [
        "user_action",
        "system_event",
        "performance_metric",
        "error_event",
        "filter_usage",
        "search_query",
        "page_view",
        "feature_usage",
      ],
    },
    eventCategory: {
      type: String,
      required: [true, "Event category is required"],
      enum: [
        "authentication",
        "navigation",
        "filtering",
        "search",
        "project_management",
        "node_management",
        "template_usage",
        "system_performance",
        "user_interaction",
      ],
    },
    eventAction: {
      type: String,
      required: [true, "Event action is required"],
      maxlength: [100, "Event action must be less than 100 characters"],
    },
    eventLabel: {
      type: String,
      maxlength: [200, "Event label must be less than 200 characters"],
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization ID is required"],
    },
    sessionId: {
      type: String,
      required: [true, "Session ID is required"],
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    userAgent: String,
    ip: String,
    page: String,
    referrer: String,
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Performance Metric Schema
const PerformanceMetricSchema = new Schema<IPerformanceMetricDocument>(
  {
    metricType: {
      type: String,
      required: [true, "Metric type is required"],
      enum: ["query", "request", "system", "cache"],
      index: true,
    },
    metricName: {
      type: String,
      required: [true, "Metric name is required"],
      maxlength: [100, "Metric name must be less than 100 characters"],
      index: true,
    },
    value: {
      type: Number,
      required: [true, "Metric value is required"],
    },
    unit: {
      type: String,
      required: [true, "Metric unit is required"],
      enum: [
        "ms",
        "seconds",
        "bytes",
        "mb",
        "gb",
        "count",
        "percentage",
        "rate",
      ],
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization ID is required"],
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    tags: [
      {
        type: String,
        maxlength: [50, "Tag must be less than 50 characters"],
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Filter Analytics Schema
const FilterAnalyticsSchema = new Schema<IFilterAnalyticsDocument>(
  {
    filterId: {
      type: String,
      required: [true, "Filter ID is required"],
      index: true,
    },
    filterType: {
      type: String,
      required: [true, "Filter type is required"],
      enum: ["operator", "dateRange", "search", "saved"],
      index: true,
    },
    filterConfig: {
      type: Schema.Types.Mixed,
      required: [true, "Filter configuration is required"],
    },
    executionTime: {
      type: Number,
      required: [true, "Execution time is required"],
      min: [0, "Execution time must be positive"],
    },
    resultCount: {
      type: Number,
      required: [true, "Result count is required"],
      min: [0, "Result count must be non-negative"],
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization ID is required"],
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    successful: {
      type: Boolean,
      required: [true, "Success status is required"],
      default: true,
    },
    errorMessage: String,
    queryComplexity: {
      type: Number,
      required: [true, "Query complexity is required"],
      min: [1, "Query complexity must be at least 1"],
      max: [10, "Query complexity must be at most 10"],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// User Behavior Schema
const UserBehaviorSchema = new Schema<IUserBehaviorDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "Organization ID is required"],
      index: true,
    },
    sessionId: {
      type: String,
      required: [true, "Session ID is required"],
    },
    pageViews: [
      {
        page: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          required: true,
        },
        duration: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    interactions: [
      {
        type: {
          type: String,
          required: true,
        },
        target: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          required: true,
        },
        metadata: {
          type: Schema.Types.Mixed,
          default: {},
        },
      },
    ],
    searchQueries: [
      {
        query: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          required: true,
        },
        results: {
          type: Number,
          required: true,
          min: 0,
        },
        executionTime: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    filtersUsed: [
      {
        filterType: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          required: true,
        },
        config: {
          type: Schema.Types.Mixed,
          required: true,
        },
      },
    ],
    sessionStart: {
      type: Date,
      required: [true, "Session start is required"],
      default: Date.now,
    },
    sessionEnd: Date,
    totalDuration: Number,
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes for performance
AnalyticsEventSchema.index({ organizationId: 1, timestamp: -1 });
AnalyticsEventSchema.index({ userId: 1, timestamp: -1 });
AnalyticsEventSchema.index({ eventType: 1, eventCategory: 1 });
AnalyticsEventSchema.index({ sessionId: 1, timestamp: 1 });

PerformanceMetricSchema.index({ organizationId: 1, timestamp: -1 });
PerformanceMetricSchema.index({ metricType: 1, metricName: 1 });
PerformanceMetricSchema.index({ timestamp: -1, value: -1 });

FilterAnalyticsSchema.index({ organizationId: 1, timestamp: -1 });
FilterAnalyticsSchema.index({ userId: 1, filterType: 1 });
FilterAnalyticsSchema.index({ successful: 1, executionTime: -1 });

UserBehaviorSchema.index({ organizationId: 1, sessionStart: -1 });
UserBehaviorSchema.index({ userId: 1, sessionStart: -1 });
UserBehaviorSchema.index({ sessionId: 1 });

// Models
export const AnalyticsEvent = mongoose.model<IAnalyticsEventDocument>(
  "AnalyticsEvent",
  AnalyticsEventSchema
);
export const PerformanceMetric = mongoose.model<IPerformanceMetricDocument>(
  "PerformanceMetric",
  PerformanceMetricSchema
);
export const FilterAnalytics = mongoose.model<IFilterAnalyticsDocument>(
  "FilterAnalytics",
  FilterAnalyticsSchema
);
export const UserBehavior = mongoose.model<IUserBehaviorDocument>(
  "UserBehavior",
  UserBehaviorSchema
);
