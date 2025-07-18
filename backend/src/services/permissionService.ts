import { v4 as uuidv4 } from "uuid";

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  actions: string[];
  metadata?: Record<string, any>;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isSystemRole: boolean;
  isDefault: boolean;
  metadata?: Record<string, any>;
}

export interface UserPermission {
  id: string;
  userId: string;
  projectId: string;
  roleId: string;
  customPermissions?: string[];
  restrictedPermissions?: string[];
  grantedBy: string;
  grantedAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  metadata?: Record<string, any>;
}

export interface PermissionCheck {
  userId: string;
  projectId: string;
  permission: string;
  resource?: string;
  context?: Record<string, any>;
}

export interface PermissionResult {
  granted: boolean;
  reason?: string;
  source?: "role" | "custom" | "system";
  metadata?: Record<string, any>;
}

export class PermissionService {
  private permissions: Map<string, Permission> = new Map();
  private roles: Map<string, Role> = new Map();
  private userPermissions: Map<string, UserPermission[]> = new Map();
  private permissionCache: Map<string, PermissionResult> = new Map();

  constructor() {
    this.initializeSystemPermissions();
    this.initializeSystemRoles();
  }

  /**
   * Initialize system permissions
   */
  private initializeSystemPermissions(): void {
    const systemPermissions: Permission[] = [
      // Project permissions
      {
        id: "project.view",
        name: "View Project",
        description: "View project and its contents",
        resource: "project",
        actions: ["read"],
      },
      {
        id: "project.edit",
        name: "Edit Project",
        description: "Edit project settings and metadata",
        resource: "project",
        actions: ["update"],
      },
      {
        id: "project.delete",
        name: "Delete Project",
        description: "Delete project and all its contents",
        resource: "project",
        actions: ["delete"],
      },
      {
        id: "project.manage",
        name: "Manage Project",
        description:
          "Full project management including settings and permissions",
        resource: "project",
        actions: ["create", "read", "update", "delete", "manage"],
      },

      // Node permissions
      {
        id: "node.view",
        name: "View Nodes",
        description: "View nodes in the project",
        resource: "node",
        actions: ["read"],
      },
      {
        id: "node.create",
        name: "Create Nodes",
        description: "Create new nodes in the project",
        resource: "node",
        actions: ["create"],
      },
      {
        id: "node.edit",
        name: "Edit Nodes",
        description: "Edit existing nodes",
        resource: "node",
        actions: ["update"],
      },
      {
        id: "node.delete",
        name: "Delete Nodes",
        description: "Delete nodes from the project",
        resource: "node",
        actions: ["delete"],
      },
      {
        id: "node.move",
        name: "Move Nodes",
        description: "Move nodes within the project",
        resource: "node",
        actions: ["move"],
      },

      // Collaboration permissions
      {
        id: "collaboration.join",
        name: "Join Collaboration",
        description: "Join collaborative editing sessions",
        resource: "collaboration",
        actions: ["join"],
      },
      {
        id: "collaboration.comment",
        name: "Add Comments",
        description: "Add comments and annotations",
        resource: "collaboration",
        actions: ["comment"],
      },
      {
        id: "collaboration.share",
        name: "Share Project",
        description: "Share project with other users",
        resource: "collaboration",
        actions: ["share"],
      },

      // Version control permissions
      {
        id: "version.view",
        name: "View Versions",
        description: "View version history",
        resource: "version",
        actions: ["read"],
      },
      {
        id: "version.create",
        name: "Create Versions",
        description: "Create new versions",
        resource: "version",
        actions: ["create"],
      },
      {
        id: "version.revert",
        name: "Revert Versions",
        description: "Revert to previous versions",
        resource: "version",
        actions: ["revert"],
      },
      {
        id: "version.branch",
        name: "Create Branches",
        description: "Create and manage branches",
        resource: "version",
        actions: ["branch"],
      },
      {
        id: "version.merge",
        name: "Merge Versions",
        description: "Merge branches and versions",
        resource: "version",
        actions: ["merge"],
      },

      // Admin permissions
      {
        id: "admin.users",
        name: "Manage Users",
        description: "Manage user permissions and roles",
        resource: "admin",
        actions: ["manage_users"],
      },
      {
        id: "admin.system",
        name: "System Administration",
        description: "Full system administration",
        resource: "admin",
        actions: ["system_admin"],
      },
    ];

    systemPermissions.forEach((permission) => {
      this.permissions.set(permission.id, permission);
    });
  }

  /**
   * Initialize system roles
   */
  private initializeSystemRoles(): void {
    const systemRoles: Role[] = [
      {
        id: "owner",
        name: "Owner",
        description: "Project owner with full permissions",
        permissions: [
          "project.view",
          "project.edit",
          "project.delete",
          "project.manage",
          "node.view",
          "node.create",
          "node.edit",
          "node.delete",
          "node.move",
          "collaboration.join",
          "collaboration.comment",
          "collaboration.share",
          "version.view",
          "version.create",
          "version.revert",
          "version.branch",
          "version.merge",
          "admin.users",
        ],
        isSystemRole: true,
        isDefault: false,
      },
      {
        id: "editor",
        name: "Editor",
        description: "Can edit project content",
        permissions: [
          "project.view",
          "project.edit",
          "node.view",
          "node.create",
          "node.edit",
          "node.delete",
          "node.move",
          "collaboration.join",
          "collaboration.comment",
          "version.view",
          "version.create",
        ],
        isSystemRole: true,
        isDefault: true,
      },
      {
        id: "contributor",
        name: "Contributor",
        description: "Can contribute to project",
        permissions: [
          "project.view",
          "node.view",
          "node.create",
          "node.edit",
          "collaboration.join",
          "collaboration.comment",
          "version.view",
        ],
        isSystemRole: true,
        isDefault: false,
      },
      {
        id: "viewer",
        name: "Viewer",
        description: "Read-only access to project",
        permissions: [
          "project.view",
          "node.view",
          "collaboration.join",
          "version.view",
        ],
        isSystemRole: true,
        isDefault: false,
      },
      {
        id: "commenter",
        name: "Commenter",
        description: "Can view and comment on project",
        permissions: [
          "project.view",
          "node.view",
          "collaboration.join",
          "collaboration.comment",
          "version.view",
        ],
        isSystemRole: true,
        isDefault: false,
      },
    ];

    systemRoles.forEach((role) => {
      this.roles.set(role.id, role);
    });
  }

  /**
   * Check if user has permission
   */
  async checkPermission(check: PermissionCheck): Promise<PermissionResult> {
    const cacheKey = `${check.userId}:${check.projectId}:${check.permission}`;

    // Check cache first
    if (this.permissionCache.has(cacheKey)) {
      return this.permissionCache.get(cacheKey)!;
    }

    const result = await this.performPermissionCheck(check);

    // Cache result for 5 minutes
    this.permissionCache.set(cacheKey, result);
    setTimeout(() => {
      this.permissionCache.delete(cacheKey);
    }, 5 * 60 * 1000);

    return result;
  }

  /**
   * Perform actual permission check
   */
  private async performPermissionCheck(
    check: PermissionCheck
  ): Promise<PermissionResult> {
    // Get user permissions for the project
    const userPermissions = this.getUserPermissions(
      check.userId,
      check.projectId
    );

    if (!userPermissions) {
      return {
        granted: false,
        reason: "No permissions found for user in this project",
      };
    }

    // Check if user permission is active
    if (!userPermissions.isActive) {
      return {
        granted: false,
        reason: "User permissions are inactive",
      };
    }

    // Check if permissions have expired
    if (userPermissions.expiresAt && userPermissions.expiresAt < new Date()) {
      return {
        granted: false,
        reason: "User permissions have expired",
      };
    }

    // Check if permission is explicitly restricted
    if (userPermissions.restrictedPermissions?.includes(check.permission)) {
      return {
        granted: false,
        reason: "Permission is explicitly restricted for this user",
        source: "custom",
      };
    }

    // Check if permission is granted via custom permissions
    if (userPermissions.customPermissions?.includes(check.permission)) {
      return {
        granted: true,
        reason: "Permission granted via custom permissions",
        source: "custom",
      };
    }

    // Check if permission is granted via role
    const role = this.roles.get(userPermissions.roleId);
    if (role && role.permissions.includes(check.permission)) {
      return {
        granted: true,
        reason: `Permission granted via role: ${role.name}`,
        source: "role",
      };
    }

    // Check for wildcard permissions
    const wildcardPermission = check.permission.split(".")[0] + ".*";
    if (role && role.permissions.includes(wildcardPermission)) {
      return {
        granted: true,
        reason: `Permission granted via wildcard role permission: ${wildcardPermission}`,
        source: "role",
      };
    }

    return {
      granted: false,
      reason: "Permission not found in user role or custom permissions",
    };
  }

  /**
   * Grant permission to user
   */
  grantPermission(
    userId: string,
    projectId: string,
    roleId: string,
    grantedBy: string,
    options: {
      customPermissions?: string[];
      expiresAt?: Date;
      metadata?: Record<string, any>;
    } = {}
  ): UserPermission {
    const userPermission: UserPermission = {
      id: uuidv4(),
      userId,
      projectId,
      roleId,
      customPermissions: options.customPermissions,
      restrictedPermissions: [],
      grantedBy,
      grantedAt: new Date(),
      expiresAt: options.expiresAt,
      isActive: true,
      metadata: options.metadata,
    };

    // Store user permission
    const projectPermissions = this.userPermissions.get(projectId) || [];

    // Remove existing permission for this user
    const filteredPermissions = projectPermissions.filter(
      (p) => p.userId !== userId
    );
    filteredPermissions.push(userPermission);

    this.userPermissions.set(projectId, filteredPermissions);

    // Clear cache for this user
    this.clearUserPermissionCache(userId, projectId);

    return userPermission;
  }

  /**
   * Revoke permission from user
   */
  revokePermission(userId: string, projectId: string): boolean {
    const projectPermissions = this.userPermissions.get(projectId) || [];
    const filteredPermissions = projectPermissions.filter(
      (p) => p.userId !== userId
    );

    if (filteredPermissions.length < projectPermissions.length) {
      this.userPermissions.set(projectId, filteredPermissions);
      this.clearUserPermissionCache(userId, projectId);
      return true;
    }

    return false;
  }

  /**
   * Get user permissions for a project
   */
  getUserPermissions(userId: string, projectId: string): UserPermission | null {
    const projectPermissions = this.userPermissions.get(projectId) || [];
    return projectPermissions.find((p) => p.userId === userId) || null;
  }

  /**
   * Get all permissions for a project
   */
  getProjectPermissions(projectId: string): UserPermission[] {
    return this.userPermissions.get(projectId) || [];
  }

  /**
   * Get effective permissions for a user
   */
  getUserEffectivePermissions(userId: string, projectId: string): string[] {
    const userPermission = this.getUserPermissions(userId, projectId);
    if (!userPermission) return [];

    const role = this.roles.get(userPermission.roleId);
    const rolePermissions = role ? role.permissions : [];
    const customPermissions = userPermission.customPermissions || [];
    const restrictedPermissions = userPermission.restrictedPermissions || [];

    // Combine role and custom permissions, then remove restricted ones
    const allPermissions = [
      ...new Set([...rolePermissions, ...customPermissions]),
    ];
    return allPermissions.filter((p) => !restrictedPermissions.includes(p));
  }

  /**
   * Create custom role
   */
  createRole(
    name: string,
    description: string,
    permissions: string[],
    options: {
      isDefault?: boolean;
      metadata?: Record<string, any>;
    } = {}
  ): Role {
    const role: Role = {
      id: uuidv4(),
      name,
      description,
      permissions,
      isSystemRole: false,
      isDefault: options.isDefault || false,
      metadata: options.metadata,
    };

    this.roles.set(role.id, role);
    return role;
  }

  /**
   * Update role
   */
  updateRole(roleId: string, updates: Partial<Role>): Role | null {
    const role = this.roles.get(roleId);
    if (!role) return null;

    const updatedRole = { ...role, ...updates };
    this.roles.set(roleId, updatedRole);

    // Clear cache for users with this role
    this.clearRolePermissionCache(roleId);

    return updatedRole;
  }

  /**
   * Delete role
   */
  deleteRole(roleId: string): boolean {
    const role = this.roles.get(roleId);
    if (!role) return false;

    // Cannot delete system roles
    if (role.isSystemRole) return false;

    this.roles.delete(roleId);
    this.clearRolePermissionCache(roleId);
    return true;
  }

  /**
   * Get all roles
   */
  getRoles(): Role[] {
    return Array.from(this.roles.values());
  }

  /**
   * Get role by ID
   */
  getRole(roleId: string): Role | null {
    return this.roles.get(roleId) || null;
  }

  /**
   * Get all permissions
   */
  getPermissions(): Permission[] {
    return Array.from(this.permissions.values());
  }

  /**
   * Get permission by ID
   */
  getPermission(permissionId: string): Permission | null {
    return this.permissions.get(permissionId) || null;
  }

  /**
   * Get permissions by resource
   */
  getPermissionsByResource(resource: string): Permission[] {
    return Array.from(this.permissions.values()).filter(
      (p) => p.resource === resource
    );
  }

  /**
   * Validate permission exists
   */
  validatePermission(permissionId: string): boolean {
    return this.permissions.has(permissionId);
  }

  /**
   * Validate role exists
   */
  validateRole(roleId: string): boolean {
    return this.roles.has(roleId);
  }

  /**
   * Clear user permission cache
   */
  private clearUserPermissionCache(userId: string, projectId: string): void {
    const keys = Array.from(this.permissionCache.keys());
    keys.forEach((key) => {
      if (key.startsWith(`${userId}:${projectId}:`)) {
        this.permissionCache.delete(key);
      }
    });
  }

  /**
   * Clear role permission cache
   */
  private clearRolePermissionCache(roleId: string): void {
    // Find all users with this role and clear their cache
    for (const [projectId, permissions] of this.userPermissions.entries()) {
      permissions.forEach((permission) => {
        if (permission.roleId === roleId) {
          this.clearUserPermissionCache(permission.userId, projectId);
        }
      });
    }
  }

  /**
   * Get permission statistics
   */
  getPermissionStatistics(): {
    totalRoles: number;
    totalPermissions: number;
    totalUserPermissions: number;
    roleDistribution: Record<string, number>;
    permissionUsage: Record<string, number>;
  } {
    const totalRoles = this.roles.size;
    const totalPermissions = this.permissions.size;
    let totalUserPermissions = 0;

    const roleDistribution: Record<string, number> = {};
    const permissionUsage: Record<string, number> = {};

    for (const [, permissions] of this.userPermissions.entries()) {
      totalUserPermissions += permissions.length;

      permissions.forEach((permission) => {
        const role = this.roles.get(permission.roleId);
        if (role) {
          roleDistribution[role.name] = (roleDistribution[role.name] || 0) + 1;

          role.permissions.forEach((perm) => {
            permissionUsage[perm] = (permissionUsage[perm] || 0) + 1;
          });
        }
      });
    }

    return {
      totalRoles,
      totalPermissions,
      totalUserPermissions,
      roleDistribution,
      permissionUsage,
    };
  }

  /**
   * Clean up expired permissions
   */
  cleanup(): void {
    const now = new Date();

    for (const [projectId, permissions] of this.userPermissions.entries()) {
      const activePermissions = permissions.filter(
        (p) => !p.expiresAt || p.expiresAt > now
      );

      if (activePermissions.length !== permissions.length) {
        this.userPermissions.set(projectId, activePermissions);
      }
    }

    // Clear expired cache entries
    this.permissionCache.clear();
  }
}

export default PermissionService;
