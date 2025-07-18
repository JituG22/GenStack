import { v4 as uuidv4 } from "uuid";

export interface Operation {
  id: string;
  type: "insert" | "delete" | "update" | "move";
  nodeId: string;
  position?: number;
  content?: any;
  previousContent?: any;
  userId: string;
  timestamp: Date;
  dependencies?: string[];
  metadata?: Record<string, any>;
}

export interface TransformResult {
  transformedOperation: Operation;
  conflicts?: ConflictInfo[];
  requiresManualResolution?: boolean;
}

export interface ConflictInfo {
  id: string;
  type: "concurrent_edit" | "move_conflict" | "delete_conflict";
  operation1: Operation;
  operation2: Operation;
  resolution?: "auto" | "manual";
  metadata?: Record<string, any>;
}

export class OperationalTransform {
  private operationHistory: Map<string, Operation[]> = new Map();
  private conflictResolutions: Map<string, ConflictInfo> = new Map();

  /**
   * Transform an operation against another operation
   */
  transform(operation1: Operation, operation2: Operation): TransformResult {
    // If operations are on different nodes, no transformation needed
    if (operation1.nodeId !== operation2.nodeId) {
      return {
        transformedOperation: operation1,
        conflicts: [],
        requiresManualResolution: false,
      };
    }

    // Handle concurrent operations on the same node
    return this.handleConcurrentOperations(operation1, operation2);
  }

  /**
   * Transform an operation against a list of operations
   */
  transformAgainstOperations(
    operation: Operation,
    operations: Operation[]
  ): TransformResult {
    let currentOperation = operation;
    const allConflicts: ConflictInfo[] = [];
    let requiresManualResolution = false;

    for (const otherOperation of operations) {
      if (otherOperation.timestamp < operation.timestamp) {
        const result = this.transform(currentOperation, otherOperation);
        currentOperation = result.transformedOperation;

        if (result.conflicts) {
          allConflicts.push(...result.conflicts);
        }

        if (result.requiresManualResolution) {
          requiresManualResolution = true;
        }
      }
    }

    return {
      transformedOperation: currentOperation,
      conflicts: allConflicts,
      requiresManualResolution,
    };
  }

  /**
   * Handle concurrent operations on the same node
   */
  private handleConcurrentOperations(
    op1: Operation,
    op2: Operation
  ): TransformResult {
    const timeDiff = Math.abs(
      op1.timestamp.getTime() - op2.timestamp.getTime()
    );
    const isConcurrent = timeDiff < 1000; // Operations within 1 second are considered concurrent

    if (!isConcurrent) {
      return {
        transformedOperation: op1,
        conflicts: [],
        requiresManualResolution: false,
      };
    }

    // Handle different operation type combinations
    if (op1.type === "update" && op2.type === "update") {
      return this.handleConcurrentUpdates(op1, op2);
    }

    if (op1.type === "delete" && op2.type === "update") {
      return this.handleDeleteUpdateConflict(op1, op2);
    }

    if (op1.type === "update" && op2.type === "delete") {
      return this.handleDeleteUpdateConflict(op2, op1);
    }

    if (op1.type === "move" && op2.type === "move") {
      return this.handleConcurrentMoves(op1, op2);
    }

    // Default: no transformation needed
    return {
      transformedOperation: op1,
      conflicts: [],
      requiresManualResolution: false,
    };
  }

  /**
   * Handle concurrent updates to the same node
   */
  private handleConcurrentUpdates(
    op1: Operation,
    op2: Operation
  ): TransformResult {
    // Merge strategy: combine non-conflicting properties
    const mergedContent = this.mergeContent(
      op1.content,
      op2.content,
      op1.previousContent
    );

    const conflict: ConflictInfo = {
      id: uuidv4(),
      type: "concurrent_edit",
      operation1: op1,
      operation2: op2,
      resolution: "auto",
      metadata: { mergeStrategy: "property_merge" },
    };

    const transformedOperation: Operation = {
      ...op1,
      content: mergedContent,
      metadata: {
        ...op1.metadata,
        mergedWith: op2.id,
        conflictId: conflict.id,
      },
    };

    return {
      transformedOperation,
      conflicts: [conflict],
      requiresManualResolution: false,
    };
  }

  /**
   * Handle delete-update conflicts
   */
  private handleDeleteUpdateConflict(
    deleteOp: Operation,
    updateOp: Operation
  ): TransformResult {
    const conflict: ConflictInfo = {
      id: uuidv4(),
      type: "delete_conflict",
      operation1: deleteOp,
      operation2: updateOp,
      resolution: "manual",
      metadata: {
        reason: "Node was deleted while being updated",
        deleteUser: deleteOp.userId,
        updateUser: updateOp.userId,
      },
    };

    // Default: preserve the update operation (last-writer-wins for updates vs deletes)
    const transformedOperation: Operation = {
      ...updateOp,
      metadata: {
        ...updateOp.metadata,
        conflictId: conflict.id,
        conflictType: "delete_conflict",
      },
    };

    return {
      transformedOperation,
      conflicts: [conflict],
      requiresManualResolution: true,
    };
  }

  /**
   * Handle concurrent move operations
   */
  private handleConcurrentMoves(
    op1: Operation,
    op2: Operation
  ): TransformResult {
    const conflict: ConflictInfo = {
      id: uuidv4(),
      type: "move_conflict",
      operation1: op1,
      operation2: op2,
      resolution: "manual",
      metadata: {
        reason: "Node moved to different positions simultaneously",
        position1: op1.content?.position,
        position2: op2.content?.position,
      },
    };

    // Use timestamp-based resolution for moves
    const winningOperation = op1.timestamp > op2.timestamp ? op1 : op2;

    const transformedOperation: Operation = {
      ...winningOperation,
      metadata: {
        ...winningOperation.metadata,
        conflictId: conflict.id,
        conflictType: "move_conflict",
      },
    };

    return {
      transformedOperation,
      conflicts: [conflict],
      requiresManualResolution: false,
    };
  }

  /**
   * Merge content from two operations
   */
  private mergeContent(content1: any, content2: any, baseContent: any): any {
    if (!content1 || !content2) {
      return content1 || content2;
    }

    if (typeof content1 !== "object" || typeof content2 !== "object") {
      // For non-objects, use last-writer-wins
      return content2; // op2 wins in case of conflict
    }

    const merged = { ...baseContent };

    // Merge properties from both operations
    for (const key in content1) {
      if (content1.hasOwnProperty(key)) {
        merged[key] = content1[key];
      }
    }

    for (const key in content2) {
      if (content2.hasOwnProperty(key)) {
        // If both operations modify the same property, use the later one
        if (content1.hasOwnProperty(key) && content1[key] !== content2[key]) {
          merged[key] = content2[key]; // Later operation wins
        } else {
          merged[key] = content2[key];
        }
      }
    }

    return merged;
  }

  /**
   * Apply an operation to a document state
   */
  applyOperation(operation: Operation, currentState: any): any {
    const newState = { ...currentState };

    switch (operation.type) {
      case "insert":
        if (!newState.nodes) {
          newState.nodes = [];
        }
        newState.nodes.push(operation.content);
        break;

      case "update":
        if (newState.nodes) {
          const nodeIndex = newState.nodes.findIndex(
            (node: any) => node.id === operation.nodeId
          );
          if (nodeIndex !== -1) {
            newState.nodes[nodeIndex] = {
              ...newState.nodes[nodeIndex],
              ...operation.content,
            };
          }
        }
        break;

      case "delete":
        if (newState.nodes) {
          newState.nodes = newState.nodes.filter(
            (node: any) => node.id !== operation.nodeId
          );
        }
        break;

      case "move":
        if (newState.nodes && operation.content?.position) {
          const nodeIndex = newState.nodes.findIndex(
            (node: any) => node.id === operation.nodeId
          );
          if (nodeIndex !== -1) {
            newState.nodes[nodeIndex] = {
              ...newState.nodes[nodeIndex],
              position: operation.content.position,
            };
          }
        }
        break;
    }

    return newState;
  }

  /**
   * Add operation to history
   */
  addToHistory(projectId: string, operation: Operation): void {
    if (!this.operationHistory.has(projectId)) {
      this.operationHistory.set(projectId, []);
    }

    const history = this.operationHistory.get(projectId)!;
    history.push(operation);

    // Keep only last 1000 operations for performance
    if (history.length > 1000) {
      history.splice(0, history.length - 1000);
    }
  }

  /**
   * Get operation history for a project
   */
  getHistory(projectId: string): Operation[] {
    return this.operationHistory.get(projectId) || [];
  }

  /**
   * Get conflicts for a project
   */
  getConflicts(projectId: string): ConflictInfo[] {
    return Array.from(this.conflictResolutions.values()).filter(
      (conflict) =>
        conflict.operation1.metadata?.projectId === projectId ||
        conflict.operation2.metadata?.projectId === projectId
    );
  }

  /**
   * Resolve a conflict manually
   */
  resolveConflict(
    conflictId: string,
    resolution: "accept_operation1" | "accept_operation2" | "merge"
  ): void {
    const conflict = this.conflictResolutions.get(conflictId);
    if (conflict) {
      conflict.resolution = "manual";
      conflict.metadata = {
        ...conflict.metadata,
        manualResolution: resolution,
        resolvedAt: new Date(),
      };
    }
  }

  /**
   * Generate a unique operation ID
   */
  generateOperationId(): string {
    return uuidv4();
  }

  /**
   * Validate operation
   */
  validateOperation(operation: Operation): boolean {
    return !!(
      operation.id &&
      operation.type &&
      operation.nodeId &&
      operation.userId &&
      operation.timestamp
    );
  }

  /**
   * Clean up old operations and conflicts
   */
  cleanup(): void {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Clean up old operations
    for (const [projectId, operations] of this.operationHistory.entries()) {
      const recentOperations = operations.filter(
        (op) => op.timestamp > oneDayAgo
      );
      this.operationHistory.set(projectId, recentOperations);
    }

    // Clean up old conflicts
    for (const [conflictId, conflict] of this.conflictResolutions.entries()) {
      if (
        conflict.operation1.timestamp < oneDayAgo &&
        conflict.operation2.timestamp < oneDayAgo
      ) {
        this.conflictResolutions.delete(conflictId);
      }
    }
  }
}

export default OperationalTransform;
