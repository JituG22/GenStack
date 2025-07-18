import { v4 as uuidv4 } from "uuid";

export interface Annotation {
  id: string;
  projectId: string;
  nodeId: string;
  type: "comment" | "note" | "warning" | "error" | "suggestion";
  content: string;
  position: {
    x: number;
    y: number;
    anchor?:
      | "top-left"
      | "top-right"
      | "bottom-left"
      | "bottom-right"
      | "center";
  };
  author: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  mentions?: string[];
  attachments?: Attachment[];
  reactions?: Reaction[];
  status: "active" | "resolved" | "archived";
  parentId?: string;
  threadId?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
  metadata?: Record<string, any>;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: Date;
  uploadedBy: string;
}

export interface Reaction {
  id: string;
  type: "like" | "dislike" | "laugh" | "heart" | "thumbs_up" | "thumbs_down";
  userId: string;
  userName: string;
  createdAt: Date;
}

export interface AnnotationThread {
  id: string;
  projectId: string;
  nodeId: string;
  rootAnnotationId: string;
  participants: string[];
  annotations: Annotation[];
  status: "active" | "resolved" | "archived";
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export interface AnnotationFilter {
  projectId?: string;
  nodeId?: string;
  authorId?: string;
  type?: Annotation["type"];
  status?: Annotation["status"];
  dateRange?: { start: Date; end: Date };
  mentionedUser?: string;
  hasAttachments?: boolean;
  threadId?: string;
}

export interface AnnotationStats {
  totalAnnotations: number;
  activeAnnotations: number;
  resolvedAnnotations: number;
  annotationsByType: Record<string, number>;
  annotationsByAuthor: Record<string, number>;
  annotationsByNode: Record<string, number>;
  averageResolutionTime: number;
  topContributors: Array<{ userId: string; count: number }>;
}

export class AnnotationService {
  private annotations: Map<string, Annotation> = new Map();
  private threads: Map<string, AnnotationThread> = new Map();
  private projectAnnotations: Map<string, string[]> = new Map();
  private nodeAnnotations: Map<string, string[]> = new Map();
  private userAnnotations: Map<string, string[]> = new Map();

  /**
   * Create a new annotation
   */
  createAnnotation(
    projectId: string,
    nodeId: string,
    content: string,
    type: Annotation["type"],
    position: Annotation["position"],
    author: Annotation["author"],
    options: {
      mentions?: string[];
      attachments?: Attachment[];
      parentId?: string;
      metadata?: Record<string, any>;
    } = {}
  ): Annotation {
    const annotation: Annotation = {
      id: uuidv4(),
      projectId,
      nodeId,
      type,
      content,
      position,
      author,
      mentions: options.mentions || [],
      attachments: options.attachments || [],
      reactions: [],
      status: "active",
      parentId: options.parentId,
      threadId: options.parentId
        ? this.getAnnotation(options.parentId)?.threadId
        : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: options.metadata,
    };

    // If this is a reply, add to existing thread
    if (options.parentId) {
      const parentAnnotation = this.getAnnotation(options.parentId);
      if (parentAnnotation) {
        annotation.threadId = parentAnnotation.threadId || parentAnnotation.id;
        this.addAnnotationToThread(annotation);
      }
    } else {
      // Create new thread for root annotation
      annotation.threadId = annotation.id;
      this.createThread(annotation);
    }

    // Store annotation
    this.annotations.set(annotation.id, annotation);

    // Update indexes
    this.updateIndexes(annotation);

    return annotation;
  }

  /**
   * Get annotation by ID
   */
  getAnnotation(annotationId: string): Annotation | null {
    return this.annotations.get(annotationId) || null;
  }

  /**
   * Update annotation
   */
  updateAnnotation(
    annotationId: string,
    updates: Partial<
      Pick<
        Annotation,
        "content" | "type" | "position" | "mentions" | "status" | "metadata"
      >
    >
  ): Annotation | null {
    const annotation = this.annotations.get(annotationId);
    if (!annotation) return null;

    const updatedAnnotation = {
      ...annotation,
      ...updates,
      updatedAt: new Date(),
    };

    this.annotations.set(annotationId, updatedAnnotation);

    // Update thread if annotation is resolved
    if (updates.status === "resolved" && annotation.status !== "resolved") {
      updatedAnnotation.resolvedAt = new Date();
      this.updateThreadStatus(annotation.threadId!);
    }

    return updatedAnnotation;
  }

  /**
   * Delete annotation
   */
  deleteAnnotation(annotationId: string): boolean {
    const annotation = this.annotations.get(annotationId);
    if (!annotation) return false;

    // Remove from indexes
    this.removeFromIndexes(annotation);

    // Remove from thread
    if (annotation.threadId) {
      this.removeAnnotationFromThread(annotation);
    }

    // Delete annotation
    this.annotations.delete(annotationId);

    return true;
  }

  /**
   * Get annotations with filters
   */
  getAnnotations(filter: AnnotationFilter = {}): Annotation[] {
    let annotations = Array.from(this.annotations.values());

    // Apply filters
    if (filter.projectId) {
      const projectAnnotationIds =
        this.projectAnnotations.get(filter.projectId) || [];
      annotations = annotations.filter((a) =>
        projectAnnotationIds.includes(a.id)
      );
    }

    if (filter.nodeId) {
      const nodeAnnotationIds = this.nodeAnnotations.get(filter.nodeId) || [];
      annotations = annotations.filter((a) => nodeAnnotationIds.includes(a.id));
    }

    if (filter.authorId) {
      annotations = annotations.filter((a) => a.author.id === filter.authorId);
    }

    if (filter.type) {
      annotations = annotations.filter((a) => a.type === filter.type);
    }

    if (filter.status) {
      annotations = annotations.filter((a) => a.status === filter.status);
    }

    if (filter.dateRange) {
      annotations = annotations.filter(
        (a) =>
          a.createdAt >= filter.dateRange!.start &&
          a.createdAt <= filter.dateRange!.end
      );
    }

    if (filter.mentionedUser) {
      annotations = annotations.filter((a) =>
        a.mentions?.includes(filter.mentionedUser!)
      );
    }

    if (filter.hasAttachments !== undefined) {
      annotations = annotations.filter((a) =>
        filter.hasAttachments
          ? (a.attachments?.length || 0) > 0
          : (a.attachments?.length || 0) === 0
      );
    }

    if (filter.threadId) {
      annotations = annotations.filter((a) => a.threadId === filter.threadId);
    }

    // Sort by creation date (newest first)
    annotations.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return annotations;
  }

  /**
   * Get annotations for a specific node
   */
  getNodeAnnotations(nodeId: string): Annotation[] {
    return this.getAnnotations({ nodeId });
  }

  /**
   * Get annotations for a specific project
   */
  getProjectAnnotations(projectId: string): Annotation[] {
    return this.getAnnotations({ projectId });
  }

  /**
   * Add reaction to annotation
   */
  addReaction(
    annotationId: string,
    userId: string,
    userName: string,
    type: Reaction["type"]
  ): Reaction | null {
    const annotation = this.annotations.get(annotationId);
    if (!annotation) return null;

    // Remove existing reaction from this user
    annotation.reactions =
      annotation.reactions?.filter((r) => r.userId !== userId) || [];

    const reaction: Reaction = {
      id: uuidv4(),
      type,
      userId,
      userName,
      createdAt: new Date(),
    };

    annotation.reactions.push(reaction);
    annotation.updatedAt = new Date();

    this.annotations.set(annotationId, annotation);

    return reaction;
  }

  /**
   * Remove reaction from annotation
   */
  removeReaction(annotationId: string, userId: string): boolean {
    const annotation = this.annotations.get(annotationId);
    if (!annotation || !annotation.reactions) return false;

    const initialLength = annotation.reactions.length;
    annotation.reactions = annotation.reactions.filter(
      (r) => r.userId !== userId
    );

    if (annotation.reactions.length < initialLength) {
      annotation.updatedAt = new Date();
      this.annotations.set(annotationId, annotation);
      return true;
    }

    return false;
  }

  /**
   * Add attachment to annotation
   */
  addAttachment(
    annotationId: string,
    attachment: Omit<Attachment, "id" | "uploadedAt">
  ): Attachment | null {
    const annotation = this.annotations.get(annotationId);
    if (!annotation) return null;

    const fullAttachment: Attachment = {
      id: uuidv4(),
      ...attachment,
      uploadedAt: new Date(),
    };

    annotation.attachments = annotation.attachments || [];
    annotation.attachments.push(fullAttachment);
    annotation.updatedAt = new Date();

    this.annotations.set(annotationId, annotation);

    return fullAttachment;
  }

  /**
   * Remove attachment from annotation
   */
  removeAttachment(annotationId: string, attachmentId: string): boolean {
    const annotation = this.annotations.get(annotationId);
    if (!annotation || !annotation.attachments) return false;

    const initialLength = annotation.attachments.length;
    annotation.attachments = annotation.attachments.filter(
      (a) => a.id !== attachmentId
    );

    if (annotation.attachments.length < initialLength) {
      annotation.updatedAt = new Date();
      this.annotations.set(annotationId, annotation);
      return true;
    }

    return false;
  }

  /**
   * Get annotation thread
   */
  getAnnotationThread(threadId: string): AnnotationThread | null {
    return this.threads.get(threadId) || null;
  }

  /**
   * Get all threads for a project
   */
  getProjectThreads(projectId: string): AnnotationThread[] {
    return Array.from(this.threads.values()).filter(
      (t) => t.projectId === projectId
    );
  }

  /**
   * Get all threads for a node
   */
  getNodeThreads(nodeId: string): AnnotationThread[] {
    return Array.from(this.threads.values()).filter((t) => t.nodeId === nodeId);
  }

  /**
   * Resolve annotation thread
   */
  resolveThread(threadId: string, resolvedBy: string): boolean {
    const thread = this.threads.get(threadId);
    if (!thread) return false;

    thread.status = "resolved";
    thread.resolvedAt = new Date();
    thread.resolvedBy = resolvedBy;
    thread.updatedAt = new Date();

    // Mark all annotations in thread as resolved
    thread.annotations.forEach((annotation) => {
      annotation.status = "resolved";
      annotation.resolvedAt = new Date();
      annotation.resolvedBy = resolvedBy;
      annotation.updatedAt = new Date();
      this.annotations.set(annotation.id, annotation);
    });

    this.threads.set(threadId, thread);

    return true;
  }

  /**
   * Get annotation statistics
   */
  getAnnotationStats(projectId?: string): AnnotationStats {
    const annotations = projectId
      ? this.getProjectAnnotations(projectId)
      : Array.from(this.annotations.values());

    const stats: AnnotationStats = {
      totalAnnotations: annotations.length,
      activeAnnotations: annotations.filter((a) => a.status === "active")
        .length,
      resolvedAnnotations: annotations.filter((a) => a.status === "resolved")
        .length,
      annotationsByType: {},
      annotationsByAuthor: {},
      annotationsByNode: {},
      averageResolutionTime: 0,
      topContributors: [],
    };

    // Calculate statistics
    const resolutionTimes: number[] = [];
    const authorCounts: Map<string, number> = new Map();

    annotations.forEach((annotation) => {
      // Count by type
      stats.annotationsByType[annotation.type] =
        (stats.annotationsByType[annotation.type] || 0) + 1;

      // Count by author
      const authorKey = `${annotation.author.id}:${annotation.author.name}`;
      stats.annotationsByAuthor[authorKey] =
        (stats.annotationsByAuthor[authorKey] || 0) + 1;
      authorCounts.set(
        annotation.author.id,
        (authorCounts.get(annotation.author.id) || 0) + 1
      );

      // Count by node
      stats.annotationsByNode[annotation.nodeId] =
        (stats.annotationsByNode[annotation.nodeId] || 0) + 1;

      // Calculate resolution time
      if (annotation.status === "resolved" && annotation.resolvedAt) {
        const resolutionTime =
          annotation.resolvedAt.getTime() - annotation.createdAt.getTime();
        resolutionTimes.push(resolutionTime);
      }
    });

    // Calculate average resolution time
    if (resolutionTimes.length > 0) {
      stats.averageResolutionTime =
        resolutionTimes.reduce((sum, time) => sum + time, 0) /
        resolutionTimes.length;
    }

    // Get top contributors
    stats.topContributors = Array.from(authorCounts.entries())
      .map(([userId, count]) => ({ userId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return stats;
  }

  /**
   * Search annotations
   */
  searchAnnotations(
    query: string,
    projectId?: string,
    options: {
      includeContent?: boolean;
      includeAuthor?: boolean;
      includeMentions?: boolean;
    } = {}
  ): Annotation[] {
    const {
      includeContent = true,
      includeAuthor = true,
      includeMentions = true,
    } = options;
    const searchTerm = query.toLowerCase();

    let annotations = projectId
      ? this.getProjectAnnotations(projectId)
      : Array.from(this.annotations.values());

    return annotations.filter((annotation) => {
      if (
        includeContent &&
        annotation.content.toLowerCase().includes(searchTerm)
      ) {
        return true;
      }

      if (
        includeAuthor &&
        (annotation.author.name.toLowerCase().includes(searchTerm) ||
          annotation.author.email.toLowerCase().includes(searchTerm))
      ) {
        return true;
      }

      if (
        includeMentions &&
        annotation.mentions?.some((mention) =>
          mention.toLowerCase().includes(searchTerm)
        )
      ) {
        return true;
      }

      return false;
    });
  }

  /**
   * Create annotation thread
   */
  private createThread(rootAnnotation: Annotation): AnnotationThread {
    const thread: AnnotationThread = {
      id: rootAnnotation.id,
      projectId: rootAnnotation.projectId,
      nodeId: rootAnnotation.nodeId,
      rootAnnotationId: rootAnnotation.id,
      participants: [rootAnnotation.author.id],
      annotations: [rootAnnotation],
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.threads.set(thread.id, thread);
    return thread;
  }

  /**
   * Add annotation to thread
   */
  private addAnnotationToThread(annotation: Annotation): void {
    const thread = this.threads.get(annotation.threadId!);
    if (!thread) return;

    thread.annotations.push(annotation);
    thread.updatedAt = new Date();

    // Add author to participants if not already present
    if (!thread.participants.includes(annotation.author.id)) {
      thread.participants.push(annotation.author.id);
    }

    this.threads.set(thread.id, thread);
  }

  /**
   * Remove annotation from thread
   */
  private removeAnnotationFromThread(annotation: Annotation): void {
    const thread = this.threads.get(annotation.threadId!);
    if (!thread) return;

    thread.annotations = thread.annotations.filter(
      (a) => a.id !== annotation.id
    );
    thread.updatedAt = new Date();

    // If this was the root annotation, delete the thread
    if (annotation.id === thread.rootAnnotationId) {
      this.threads.delete(thread.id);
    } else {
      this.threads.set(thread.id, thread);
    }
  }

  /**
   * Update thread status
   */
  private updateThreadStatus(threadId: string): void {
    const thread = this.threads.get(threadId);
    if (!thread) return;

    const activeAnnotations = thread.annotations.filter(
      (a) => a.status === "active"
    );

    if (activeAnnotations.length === 0) {
      thread.status = "resolved";
      thread.resolvedAt = new Date();
    }

    thread.updatedAt = new Date();
    this.threads.set(threadId, thread);
  }

  /**
   * Update indexes
   */
  private updateIndexes(annotation: Annotation): void {
    // Update project index
    const projectAnnotations =
      this.projectAnnotations.get(annotation.projectId) || [];
    projectAnnotations.push(annotation.id);
    this.projectAnnotations.set(annotation.projectId, projectAnnotations);

    // Update node index
    const nodeAnnotations = this.nodeAnnotations.get(annotation.nodeId) || [];
    nodeAnnotations.push(annotation.id);
    this.nodeAnnotations.set(annotation.nodeId, nodeAnnotations);

    // Update user index
    const userAnnotations =
      this.userAnnotations.get(annotation.author.id) || [];
    userAnnotations.push(annotation.id);
    this.userAnnotations.set(annotation.author.id, userAnnotations);
  }

  /**
   * Remove from indexes
   */
  private removeFromIndexes(annotation: Annotation): void {
    // Remove from project index
    const projectAnnotations =
      this.projectAnnotations.get(annotation.projectId) || [];
    this.projectAnnotations.set(
      annotation.projectId,
      projectAnnotations.filter((id) => id !== annotation.id)
    );

    // Remove from node index
    const nodeAnnotations = this.nodeAnnotations.get(annotation.nodeId) || [];
    this.nodeAnnotations.set(
      annotation.nodeId,
      nodeAnnotations.filter((id) => id !== annotation.id)
    );

    // Remove from user index
    const userAnnotations =
      this.userAnnotations.get(annotation.author.id) || [];
    this.userAnnotations.set(
      annotation.author.id,
      userAnnotations.filter((id) => id !== annotation.id)
    );
  }

  /**
   * Clean up old annotations
   */
  cleanup(retentionDays: number = 90): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    // Remove old resolved annotations
    const annotationsToRemove: string[] = [];

    for (const [id, annotation] of this.annotations.entries()) {
      if (
        annotation.status === "resolved" &&
        annotation.resolvedAt &&
        annotation.resolvedAt < cutoffDate
      ) {
        annotationsToRemove.push(id);
      }
    }

    annotationsToRemove.forEach((id) => {
      const annotation = this.annotations.get(id);
      if (annotation) {
        this.deleteAnnotation(id);
      }
    });
  }
}

export default AnnotationService;
