import { Project } from "../models/Project-simple";
import { GitHubService } from "./githubService";

export interface ProjectGitHubSync {
  projectId: string;
  userId: string;
  organizationId: string;
}

export class ProjectGitHubService {
  private githubService: GitHubService;

  constructor() {
    this.githubService = new GitHubService();
  }

  /**
   * Create a new project with GitHub synchronization
   */
  async createProjectWithGitHub(data: any) {
    let githubRepoData: any = null;

    try {
      let projectData: any = { ...data };

      // If GitHub integration is enabled, create repository first
      if (data.github?.enabled) {
        console.log(`Creating GitHub repository for project: ${data.name}`);

        const repoRequest = {
          name: this.sanitizeRepoName(data.name),
          description: data.description || `GenStack project: ${data.name}`,
          private: data.githubConfig?.private !== false, // Default to private
          has_issues: true,
          has_projects: true,
          has_wiki: false,
          auto_init: data.githubConfig?.autoInit !== false, // Default to true
          gitignore_template: data.githubConfig?.gitignoreTemplate || "Node",
          license_template: data.githubConfig?.licenseTemplate || "mit",
        };

        try {
          const githubResponse = await this.githubService.createRepository(
            repoRequest
          );

          if (!githubResponse.success || !githubResponse.data) {
            throw new Error(
              githubResponse.error?.message ||
                "Failed to create GitHub repository"
            );
          }

          githubRepoData = githubResponse.data;
          console.log(
            `GitHub repository created successfully: ${
              (githubRepoData as any).html_url
            }`
          );

          // Update project data with GitHub information
          projectData.github = {
            enabled: true,
            repoId: (githubRepoData as any).id,
            repoName: (githubRepoData as any).name,
            repoUrl: (githubRepoData as any).html_url,
            lastSyncAt: new Date(),
            syncStatus: "synced",
            syncErrors: [],
          };
        } catch (githubError: any) {
          console.error("GitHub repository creation failed:", githubError);

          // Throw error with user-friendly message
          const errorMessage = this.getGitHubErrorMessage(githubError);
          throw new Error(`GitHub repository creation failed: ${errorMessage}`);
        }
      }

      // Create project in MongoDB
      const project = new Project(projectData);
      await project.save();

      console.log(`Project created successfully: ${project.id}`);

      return await Project.findById(project.id)
        .populate("createdBy", "firstName lastName email")
        .populate("collaborators", "firstName lastName email");
    } catch (error) {
      // If we created a GitHub repo but project creation failed, clean up
      if (githubRepoData && data.github?.enabled) {
        try {
          console.log(
            `Cleaning up GitHub repository: ${(githubRepoData as any).name}`
          );
          await this.githubService.deleteRepository(
            (githubRepoData as any).name
          );
        } catch (cleanupError) {
          console.error("Failed to cleanup GitHub repository:", cleanupError);
        }
      }

      throw error;
    }
  }

  /**
   * Update a project with GitHub synchronization
   */
  async updateProjectWithGitHub(projectId: string, data: any, userId: string) {
    try {
      const existingProject = await Project.findById(projectId);
      if (!existingProject) {
        throw new Error("Project not found");
      }

      // Check if user has permission to update
      if (existingProject.createdBy.toString() !== userId) {
        throw new Error("Unauthorized to update this project");
      }

      let updateData: any = { ...data };

      // Handle GitHub synchronization
      if (existingProject.github?.enabled && existingProject.github.repoName) {
        // Check if we need to update GitHub repository
        if (
          data.name ||
          data.description ||
          data.githubConfig?.private !== undefined
        ) {
          const repoUpdate: any = {};

          if (data.name) {
            repoUpdate.name = this.sanitizeRepoName(data.name);
          }

          if (data.description !== undefined) {
            repoUpdate.description =
              data.description ||
              `GenStack project: ${data.name || existingProject.name}`;
          }

          if (data.githubConfig?.private !== undefined) {
            repoUpdate.private = data.githubConfig.private;
          }

          try {
            console.log(
              `Updating GitHub repository: ${existingProject.github.repoName}`
            );
            const updatedRepoResponse =
              await this.githubService.updateRepository(
                existingProject.github.repoName,
                repoUpdate
              );

            if (updatedRepoResponse.success && updatedRepoResponse.data) {
              // Update GitHub information in project data
              updateData.github = {
                ...existingProject.github,
                repoName: (updatedRepoResponse.data as any).name,
                repoUrl: (updatedRepoResponse.data as any).html_url,
                lastSyncAt: new Date(),
                syncStatus: "synced",
                syncErrors: [],
              };
            }
          } catch (githubError: any) {
            console.error("GitHub repository update failed:", githubError);

            // Update sync status but don't fail the entire operation
            updateData.github = {
              ...existingProject.github,
              syncStatus: "error",
              syncErrors: [this.getGitHubErrorMessage(githubError)],
            };
          }
        }
      }

      // Enable GitHub integration if requested
      if (data.github?.enabled && !existingProject.github?.enabled) {
        try {
          const repoRequest = {
            name: this.sanitizeRepoName(data.name || existingProject.name),
            description:
              data.description ||
              existingProject.description ||
              `GenStack project: ${existingProject.name}`,
            private: data.githubConfig?.private !== false,
            has_issues: true,
            has_projects: true,
            has_wiki: false,
            auto_init: true,
            gitignore_template: "Node",
            license_template: "mit",
          };

          const githubResponse = await this.githubService.createRepository(
            repoRequest
          );

          if (!githubResponse.success || !githubResponse.data) {
            throw new Error(
              githubResponse.error?.message ||
                "Failed to create GitHub repository"
            );
          }

          updateData.github = {
            enabled: true,
            repoId: (githubResponse.data as any).id,
            repoName: (githubResponse.data as any).name,
            repoUrl: (githubResponse.data as any).html_url,
            lastSyncAt: new Date(),
            syncStatus: "synced",
            syncErrors: [],
          };
        } catch (githubError: any) {
          console.error("GitHub repository creation failed:", githubError);
          throw new Error(
            `GitHub repository creation failed: ${this.getGitHubErrorMessage(
              githubError
            )}`
          );
        }
      }

      // Disable GitHub integration if requested
      if (data.github?.enabled === false && existingProject.github?.enabled) {
        updateData.github = {
          ...existingProject.github,
          enabled: false,
          syncStatus: "manual",
        };
      }

      // Update project in MongoDB
      const updatedProject = await Project.findByIdAndUpdate(
        projectId,
        { $set: updateData },
        { new: true }
      )
        .populate("createdBy", "firstName lastName email")
        .populate("collaborators", "firstName lastName email");

      console.log(`Project updated successfully: ${projectId}`);
      return updatedProject;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete a project with GitHub synchronization
   */
  async deleteProjectWithGitHub(projectId: string, userId: string) {
    try {
      const project = await Project.findById(projectId);
      if (!project) {
        throw new Error("Project not found");
      }

      // Check if user has permission to delete
      if (project.createdBy.toString() !== userId) {
        throw new Error("Unauthorized to delete this project");
      }

      // Delete GitHub repository if exists
      if (project.github?.enabled && project.github.repoName) {
        try {
          console.log(`Deleting GitHub repository: ${project.github.repoName}`);
          await this.githubService.deleteRepository(project.github.repoName);
          console.log(
            `GitHub repository deleted successfully: ${project.github.repoName}`
          );
        } catch (githubError: any) {
          console.error("GitHub repository deletion failed:", githubError);
          // Log error but don't fail the operation
          // The project will still be deleted from MongoDB
        }
      }

      // Delete project from MongoDB
      await Project.findByIdAndDelete(projectId);

      console.log(`Project deleted successfully: ${projectId}`);
      return { message: "Project deleted successfully", deletedId: projectId };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Sync project with GitHub (manual sync)
   */
  async syncProjectWithGitHub(projectId: string, userId: string) {
    try {
      const project = await Project.findById(projectId);
      if (!project) {
        throw new Error("Project not found");
      }

      // Check if user has permission
      if (project.createdBy.toString() !== userId) {
        throw new Error("Unauthorized to sync this project");
      }

      if (!project.github?.enabled || !project.github.repoName) {
        throw new Error("GitHub integration is not enabled for this project");
      }

      // Get latest repository information from GitHub
      const githubResponse = await this.githubService.getRepository(
        project.github.repoName
      );

      if (!githubResponse.success || !githubResponse.data) {
        throw new Error(
          githubResponse.error?.message ||
            "Failed to fetch repository from GitHub"
        );
      }

      // Update project with latest GitHub data
      const updateData = {
        github: {
          ...project.github,
          repoUrl: (githubResponse.data as any).html_url,
          lastSyncAt: new Date(),
          syncStatus: "synced",
          syncErrors: [],
        },
      };

      const updatedProject = await Project.findByIdAndUpdate(
        projectId,
        { $set: updateData },
        { new: true }
      )
        .populate("createdBy", "firstName lastName email")
        .populate("collaborators", "firstName lastName email");

      console.log(`Project synced with GitHub successfully: ${projectId}`);
      return updatedProject;
    } catch (error: any) {
      // Update sync status to error
      await Project.findByIdAndUpdate(projectId, {
        $set: {
          "github.syncStatus": "error",
          "github.syncErrors": [this.getGitHubErrorMessage(error)],
        },
      });

      throw error;
    }
  }

  /**
   * Get GitHub repository status for a project
   */
  async getGitHubStatus(projectId: string, userId: string) {
    const project = await Project.findById(projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Check if user has permission
    if (project.createdBy.toString() !== userId) {
      throw new Error("Unauthorized to access this project");
    }

    if (!project.github?.enabled || !project.github.repoName) {
      return {
        enabled: false,
        message: "GitHub integration is not enabled for this project",
      };
    }

    try {
      const githubResponse = await this.githubService.getRepository(
        project.github.repoName
      );

      if (!githubResponse.success || !githubResponse.data) {
        throw new Error(
          githubResponse.error?.message ||
            "Failed to fetch repository from GitHub"
        );
      }

      const githubRepo = githubResponse.data;

      return {
        enabled: true,
        repository: {
          name: (githubRepo as any).name,
          url: (githubRepo as any).html_url,
          private: (githubRepo as any).private,
          createdAt: (githubRepo as any).created_at,
          updatedAt: (githubRepo as any).updated_at,
          stars: (githubRepo as any).stargazers_count,
          watchers: (githubRepo as any).watchers_count,
          language: (githubRepo as any).language,
          size: (githubRepo as any).size,
        },
        syncStatus: project.github.syncStatus,
        lastSyncAt: project.github.lastSyncAt,
        syncErrors: project.github.syncErrors,
      };
    } catch (error: any) {
      return {
        enabled: true,
        error: this.getGitHubErrorMessage(error),
        syncStatus: "error",
        lastSyncAt: project.github.lastSyncAt,
        syncErrors: project.github.syncErrors,
      };
    }
  }

  /**
   * Sanitize project name for GitHub repository
   */
  private sanitizeRepoName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\-_.]/g, "-")
      .replace(/--+/g, "-")
      .replace(/^[-_.]+|[-_.]+$/g, "")
      .substring(0, 100); // GitHub repo name limit
  }

  /**
   * Extract user-friendly error message from GitHub API error
   */
  private getGitHubErrorMessage(error: any): string {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.message) {
      return error.message;
    }
    return "Unknown GitHub API error occurred";
  }
}

export const projectGitHubService = new ProjectGitHubService();
export default ProjectGitHubService;
