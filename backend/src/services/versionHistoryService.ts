import { v4 as uuidv4 } from "uuid";
import { Operation } from "./operationalTransform";

export interface Version {
  id: string;
  projectId: string;
  version: string;
  name: string;
  description?: string;
  changes: Change[];
  author: {
    id: string;
    name: string;
    email: string;
  };
  parentVersion?: string;
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface Change {
  id: string;
  type:
    | "node_added"
    | "node_removed"
    | "node_modified"
    | "node_moved"
    | "property_changed";
  nodeId: string;
  previousValue?: any;
  newValue?: any;
  propertyPath?: string;
  timestamp: Date;
  operation?: Operation;
}

export interface VersionDiff {
  id: string;
  fromVersion: string;
  toVersion: string;
  changes: Change[];
  addedNodes: string[];
  removedNodes: string[];
  modifiedNodes: string[];
  createdAt: Date;
}

export interface Branch {
  id: string;
  name: string;
  projectId: string;
  baseVersion: string;
  currentVersion: string;
  isDefault: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface MergeRequest {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  sourceBranch: string;
  targetBranch: string;
  author: string;
  status: "open" | "merged" | "closed" | "draft";
  changes: Change[];
  conflicts?: string[];
  reviewers?: string[];
  createdAt: Date;
  updatedAt: Date;
  mergedAt?: Date;
  mergedBy?: string;
}

export class VersionHistoryService {
  private versions: Map<string, Version[]> = new Map();
  private branches: Map<string, Branch[]> = new Map();
  private mergeRequests: Map<string, MergeRequest[]> = new Map();

  /**
   * Create a new version
   */
  createVersion(
    projectId: string,
    changes: Change[],
    author: { id: string; name: string; email: string },
    options: {
      name?: string;
      description?: string;
      parentVersion?: string;
      tags?: string[];
    } = {}
  ): Version {
    const projectVersions = this.versions.get(projectId) || [];
    const versionNumber = this.generateVersionNumber(projectVersions);

    const version: Version = {
      id: uuidv4(),
      projectId,
      version: versionNumber,
      name: options.name || `Version ${versionNumber}`,
      description: options.description,
      changes,
      author,
      parentVersion: options.parentVersion,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: options.tags || [],
      metadata: {
        changeCount: changes.length,
        branchName: "main",
      },
    };

    projectVersions.push(version);
    this.versions.set(projectId, projectVersions);

    return version;
  }

  /**
   * Get version history for a project
   */
  getVersionHistory(
    projectId: string,
    options: {
      limit?: number;
      branch?: string;
      since?: Date;
      until?: Date;
    } = {}
  ): Version[] {
    const projectVersions = this.versions.get(projectId) || [];
    let filteredVersions = projectVersions;

    // Filter by branch
    if (options.branch) {
      filteredVersions = filteredVersions.filter(
        (v) => v.metadata?.branchName === options.branch
      );
    }

    // Filter by date range
    if (options.since) {
      filteredVersions = filteredVersions.filter(
        (v) => v.createdAt >= options.since!
      );
    }

    if (options.until) {
      filteredVersions = filteredVersions.filter(
        (v) => v.createdAt <= options.until!
      );
    }

    // Sort by creation date (newest first)
    filteredVersions.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );

    // Apply limit
    if (options.limit) {
      filteredVersions = filteredVersions.slice(0, options.limit);
    }

    return filteredVersions;
  }

  /**
   * Get a specific version
   */
  getVersion(projectId: string, versionId: string): Version | null {
    const projectVersions = this.versions.get(projectId) || [];
    return projectVersions.find((v) => v.id === versionId) || null;
  }

  /**
   * Compare two versions
   */
  compareVersions(
    projectId: string,
    fromVersionId: string,
    toVersionId: string
  ): VersionDiff {
    const fromVersion = this.getVersion(projectId, fromVersionId);
    const toVersion = this.getVersion(projectId, toVersionId);

    if (!fromVersion || !toVersion) {
      throw new Error("Version not found");
    }

    const changes = this.calculateChanges(fromVersion, toVersion);
    const addedNodes = changes
      .filter((c) => c.type === "node_added")
      .map((c) => c.nodeId);
    const removedNodes = changes
      .filter((c) => c.type === "node_removed")
      .map((c) => c.nodeId);
    const modifiedNodes = changes
      .filter((c) => c.type === "node_modified")
      .map((c) => c.nodeId);

    return {
      id: uuidv4(),
      fromVersion: fromVersionId,
      toVersion: toVersionId,
      changes,
      addedNodes,
      removedNodes,
      modifiedNodes,
      createdAt: new Date(),
    };
  }

  /**
   * Revert to a specific version
   */
  revertToVersion(
    projectId: string,
    versionId: string,
    author: {
      id: string;
      name: string;
      email: string;
    }
  ): Version {
    const targetVersion = this.getVersion(projectId, versionId);
    if (!targetVersion) {
      throw new Error("Version not found");
    }

    const currentVersion = this.getCurrentVersion(projectId);
    if (!currentVersion) {
      throw new Error("No current version found");
    }

    // Create reverse changes
    const revertChanges = this.createRevertChanges(
      currentVersion,
      targetVersion
    );

    // Create new version with revert changes
    const revertVersion = this.createVersion(projectId, revertChanges, author, {
      name: `Revert to ${targetVersion.name}`,
      description: `Reverted to version ${targetVersion.version} (${targetVersion.name})`,
      parentVersion: currentVersion.id,
      tags: ["revert"],
    });

    return revertVersion;
  }

  /**
   * Create a new branch
   */
  createBranch(
    projectId: string,
    name: string,
    baseVersion: string,
    createdBy: string
  ): Branch {
    const projectBranches = this.branches.get(projectId) || [];

    // Check if branch name already exists
    if (projectBranches.some((b) => b.name === name)) {
      throw new Error("Branch name already exists");
    }

    const branch: Branch = {
      id: uuidv4(),
      name,
      projectId,
      baseVersion,
      currentVersion: baseVersion,
      isDefault: false,
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        nodeCount: 0,
        lastActivity: new Date(),
      },
    };

    projectBranches.push(branch);
    this.branches.set(projectId, projectBranches);

    return branch;
  }

  /**
   * Get branches for a project
   */
  getBranches(projectId: string): Branch[] {
    return this.branches.get(projectId) || [];
  }

  /**
   * Create a merge request
   */
  createMergeRequest(
    projectId: string,
    title: string,
    sourceBranch: string,
    targetBranch: string,
    author: string,
    options: {
      description?: string;
      reviewers?: string[];
    } = {}
  ): MergeRequest {
    const projectMergeRequests = this.mergeRequests.get(projectId) || [];

    // Calculate changes between branches
    const changes = this.calculateBranchChanges(
      projectId,
      sourceBranch,
      targetBranch
    );

    const mergeRequest: MergeRequest = {
      id: uuidv4(),
      projectId,
      title,
      description: options.description,
      sourceBranch,
      targetBranch,
      author,
      status: "open",
      changes,
      conflicts: [],
      reviewers: options.reviewers || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    projectMergeRequests.push(mergeRequest);
    this.mergeRequests.set(projectId, projectMergeRequests);

    return mergeRequest;
  }

  /**
   * Get merge requests for a project
   */
  getMergeRequests(
    projectId: string,
    status?: MergeRequest["status"]
  ): MergeRequest[] {
    const projectMergeRequests = this.mergeRequests.get(projectId) || [];

    if (status) {
      return projectMergeRequests.filter((mr) => mr.status === status);
    }

    return projectMergeRequests;
  }

  /**
   * Create a change from an operation
   */
  createChangeFromOperation(operation: Operation): Change {
    return {
      id: uuidv4(),
      type: this.mapOperationToChangeType(operation.type),
      nodeId: operation.nodeId,
      previousValue: operation.previousContent,
      newValue: operation.content,
      timestamp: operation.timestamp,
      operation,
    };
  }

  /**
   * Get current version for a project
   */
  getCurrentVersion(projectId: string): Version | null {
    const projectVersions = this.versions.get(projectId) || [];
    return (
      projectVersions.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      )[0] || null
    );
  }

  /**
   * Get version statistics
   */
  getVersionStatistics(projectId: string): {
    totalVersions: number;
    totalChanges: number;
    averageChangesPerVersion: number;
    mostActiveAuthor: string;
    versionsByMonth: Record<string, number>;
  } {
    const projectVersions = this.versions.get(projectId) || [];
    const totalVersions = projectVersions.length;
    const totalChanges = projectVersions.reduce(
      (sum, v) => sum + v.changes.length,
      0
    );
    const averageChangesPerVersion =
      totalVersions > 0 ? totalChanges / totalVersions : 0;

    // Find most active author
    const authorCounts = new Map<string, number>();
    projectVersions.forEach((v) => {
      const count = authorCounts.get(v.author.id) || 0;
      authorCounts.set(v.author.id, count + 1);
    });

    const mostActiveAuthor =
      Array.from(authorCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ||
      "";

    // Versions by month
    const versionsByMonth: Record<string, number> = {};
    projectVersions.forEach((v) => {
      const monthKey = v.createdAt.toISOString().substring(0, 7); // YYYY-MM
      versionsByMonth[monthKey] = (versionsByMonth[monthKey] || 0) + 1;
    });

    return {
      totalVersions,
      totalChanges,
      averageChangesPerVersion,
      mostActiveAuthor,
      versionsByMonth,
    };
  }

  /**
   * Generate version number
   */
  private generateVersionNumber(existingVersions: Version[]): string {
    const versionNumbers = existingVersions
      .map((v) => v.version)
      .filter((v) => /^\d+\.\d+\.\d+$/.test(v))
      .map((v) => v.split(".").map(Number))
      .sort((a, b) => {
        for (let i = 0; i < 3; i++) {
          if (a[i] !== b[i]) return b[i] - a[i];
        }
        return 0;
      });

    if (versionNumbers.length === 0) {
      return "1.0.0";
    }

    const latest = versionNumbers[0];
    return `${latest[0]}.${latest[1]}.${latest[2] + 1}`;
  }

  /**
   * Calculate changes between versions
   */
  private calculateChanges(fromVersion: Version, toVersion: Version): Change[] {
    // This is a simplified implementation
    // In a real system, you'd compare the actual project states
    const changes: Change[] = [];

    toVersion.changes.forEach((change) => {
      const existingChange = fromVersion.changes.find(
        (c) => c.nodeId === change.nodeId
      );
      if (!existingChange) {
        changes.push(change);
      } else if (
        JSON.stringify(existingChange.newValue) !==
        JSON.stringify(change.newValue)
      ) {
        changes.push({
          ...change,
          previousValue: existingChange.newValue,
        });
      }
    });

    return changes;
  }

  /**
   * Create revert changes
   */
  private createRevertChanges(
    currentVersion: Version,
    targetVersion: Version
  ): Change[] {
    const changes: Change[] = [];

    // Create reverse changes for each change in current version
    currentVersion.changes.forEach((change) => {
      const revertChange: Change = {
        id: uuidv4(),
        type: change.type,
        nodeId: change.nodeId,
        previousValue: change.newValue,
        newValue: change.previousValue,
        timestamp: new Date(),
      };
      changes.push(revertChange);
    });

    return changes;
  }

  /**
   * Calculate changes between branches
   */
  private calculateBranchChanges(
    projectId: string,
    sourceBranch: string,
    targetBranch: string
  ): Change[] {
    // This is a simplified implementation
    // In a real system, you'd compare the actual branch states
    return [];
  }

  /**
   * Map operation type to change type
   */
  private mapOperationToChangeType(
    operationType: Operation["type"]
  ): Change["type"] {
    switch (operationType) {
      case "insert":
        return "node_added";
      case "delete":
        return "node_removed";
      case "update":
        return "node_modified";
      case "move":
        return "node_moved";
      default:
        return "node_modified";
    }
  }

  /**
   * Clean up old versions
   */
  cleanup(retentionDays: number = 30): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    for (const [projectId, versions] of this.versions.entries()) {
      const recentVersions = versions.filter((v) => v.createdAt > cutoffDate);
      this.versions.set(projectId, recentVersions);
    }
  }
}

export default VersionHistoryService;
