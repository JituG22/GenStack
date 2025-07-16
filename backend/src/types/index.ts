import { Request } from "express";

// User types
export interface IUser {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: UserRole;
  organization: string;
  projects: string[];
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  isActive: boolean;
}

export enum UserRole {
  ADMIN = "admin",
  ORG_MANAGER = "org_manager",
  DEVELOPER = "developer",
  VIEWER = "viewer",
}

// Organization types
export interface IOrganization {
  _id: string;
  name: string;
  description?: string;
  owner: string;
  members: string[];
  projects: string[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

// Project types
export interface IProject {
  _id: string;
  name: string;
  description?: string;
  organization: string;
  members: ProjectMember[];
  nodes: string[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface ProjectMember {
  userId: string;
  role: ProjectRole;
  joinedAt: Date;
}

export enum ProjectRole {
  ADMIN = "admin",
  EDITOR = "editor",
  VIEWER = "viewer",
}

// Node types
export interface INode {
  _id: string;
  name: string;
  type: NodeType;
  template: string;
  properties: Record<string, any>;
  validations: ValidationRule[];
  metadata: NodeMetadata;
  projectId: string;
  position?: NodePosition;
  connections?: NodeConnection[];
  isTemplate: boolean;
  parentTemplate?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum NodeType {
  REACT = "react",
  ANGULAR = "angular",
  NODEJS_API = "nodejs-api",
  PYTHON_API = "python-api",
  MONGODB = "mongodb",
  POSTGRESQL = "postgresql",
  FORM_INPUT = "form-input",
  GITHUB_ACTION = "github-action",
  DOCKER_BUILD = "docker-build",
  CUSTOM = "custom",
}

export interface ValidationRule {
  field: string;
  rule: string;
  value?: any;
  message: string;
}

export interface NodeMetadata {
  category: string;
  description?: string;
  version: string;
  author: string;
  tags: string[];
  icon?: string;
}

export interface NodePosition {
  x: number;
  y: number;
}

export interface NodeConnection {
  sourceNodeId: string;
  targetNodeId: string;
  sourceHandle: string;
  targetHandle: string;
}

// Template types
export interface ITemplate {
  _id: string;
  name: string;
  type: NodeType;
  template: string;
  schema: PropertySchema;
  category: string;
  tags: string[];
  isPublic: boolean;
  organization: string;
  usageCount: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PropertySchema {
  properties: PropertyDefinition[];
}

export interface PropertyDefinition {
  name: string;
  type: PropertyType;
  required: boolean;
  default?: any;
  options?: string[];
  validation?: string;
  description?: string;
}

export enum PropertyType {
  STRING = "string",
  NUMBER = "number",
  BOOLEAN = "boolean",
  SELECT = "select",
  TEXTAREA = "textarea",
  JSON = "json",
  ARRAY = "array",
  FILE = "file",
}

// Request types
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    organization: string;
  };
}

// Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

export interface PaginationResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Authentication types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organization?: string;
}

export interface AuthResponse {
  user: Omit<IUser, "password">;
  token: string;
}

// Query types
export interface QueryOptions {
  page?: number;
  limit?: number;
  sort?: string;
  filter?: Record<string, any>;
  search?: string;
}

// Error types
export interface AppError extends Error {
  statusCode: number;
  isOperational: boolean;
}
