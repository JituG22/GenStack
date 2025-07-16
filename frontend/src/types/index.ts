// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  organization: string;
}

export enum UserRole {
  ADMIN = "admin",
  ORG_MANAGER = "org_manager",
  DEVELOPER = "developer",
  VIEWER = "viewer",
}

// Node types
export interface Node {
  id: string;
  name: string;
  type: NodeType;
  template: string;
  properties: Record<string, any>;
  validations: ValidationRule[];
  metadata: NodeMetadata;
  projectId: string;
  position?: { x: number; y: number };
  isTemplate: boolean;
  parentTemplate?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
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

// Project types
export interface Project {
  id: string;
  name: string;
  description?: string;
  organization: string;
  members: ProjectMember[];
  nodeCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  userId: string;
  role: ProjectRole;
  joinedAt: string;
}

export enum ProjectRole {
  ADMIN = "admin",
  EDITOR = "editor",
  VIEWER = "viewer",
}

// Template types
export interface Template {
  id: string;
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
  createdAt: string;
  updatedAt: string;
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

// API Response types
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
  user: User;
  token: string;
}

// React Flow types
export interface FlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    node: Node;
    onEdit: (nodeId: string) => void;
    onDelete: (nodeId: string) => void;
    onClone: (nodeId: string) => void;
  };
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}
