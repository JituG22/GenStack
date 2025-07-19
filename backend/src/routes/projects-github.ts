import { Router, Request, Response } from "express";
import { auth } from "../middleware/auth";
import { Project } from "../models/Project-simple";
import { GitHubService } from "../services/githubService";

const router = Router();
const githubService = new GitHubService();

/**
 * Health check for GitHub integration
 */
router.get("/health", async (req: Request, res: Response): Promise<void> => {
  try {
    const isEnabled = process.env.GITHUB_ENABLED === "true";
    const hasToken = !!process.env.GITHUB_TOKEN;
    const hasUsername = !!process.env.GITHUB_USERNAME;

    res.status(200).json({
      success: true,
      message: "GitHub integration routes are accessible",
      config: {
        enabled: isEnabled,
        hasToken,
        hasUsername,
        ready: isEnabled && hasToken && hasUsername,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Health check failed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * Create a new project with GitHub integration
 */
router.post("/", auth, async (req: any, res: Response): Promise<void> => {
  try {
    const {
      name,
      description,
      isPublic,
      tags,
      github,
      githubConfig,
      enableGitHub,
    } = req.body;

    if (!name) {
      res.status(400).json({
        success: false,
        error: "Name is required",
      });
      return;
    }

    const projectData: any = {
      name,
      description,
      organization: req.user.organization,
      createdBy: req.user.id,
      isPublic: isPublic || false,
      tags: tags || [],
      github: {
        enabled: false,
      },
    };

    // Create GitHub repository if requested
    if (github?.enabled || enableGitHub) {
      try {
        console.log("Creating GitHub repository...");

        const repoData = {
          name:
            githubConfig?.repositoryName ||
            name.toLowerCase().replace(/\s+/g, "-"),
          description: description || `GenStack project: ${name}`,
          private: !isPublic,
          auto_init: githubConfig?.createReadme !== false,
        };

        const githubResponse = await githubService.createRepository(repoData);

        if (githubResponse.success && githubResponse.data) {
          console.log(
            `GitHub repository created successfully: ${
              (githubResponse.data as any).html_url
            }`
          );

          // Update GitHub configuration
          projectData.github.enabled = true;
          projectData.github.repoId = (githubResponse.data as any).id;
          projectData.github.repoName = (githubResponse.data as any).name;
          projectData.github.repoUrl = (githubResponse.data as any).html_url;
          projectData.github.lastSyncAt = new Date();
          projectData.github.syncStatus = "synced";
          projectData.github.syncErrors = [];
        } else {
          throw new Error(
            githubResponse.error?.message ||
              "Failed to create GitHub repository"
          );
        }
      } catch (githubError: any) {
        console.error("GitHub repository creation failed:", githubError);

        // Continue with project creation but mark GitHub as failed
        projectData.github.enabled = false;
        projectData.github.syncStatus = "error";
        projectData.github.syncErrors = [
          `GitHub repository creation failed: ${githubError.message}`,
        ];
      }
    }

    // Create project in MongoDB
    const project = new Project(projectData);
    const savedProject = await project.save();

    const populatedProject = await Project.findById(savedProject.id)
      .populate("createdBy", "firstName lastName email")
      .populate("collaborators", "firstName lastName email");

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: populatedProject,
    });
  } catch (error: any) {
    console.error("Create project error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to create project",
    });
  }
});

/**
 * Update project with GitHub integration
 */
router.put("/:id", auth, async (req: any, res: Response): Promise<void> => {
  try {
    res.status(501).json({
      success: false,
      error: "Update with GitHub integration not yet implemented",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to update project",
    });
  }
});

/**
 * Delete project and its GitHub repository
 */
router.delete("/:id", auth, async (req: any, res: Response): Promise<void> => {
  try {
    res.status(501).json({
      success: false,
      error: "Delete with GitHub integration not yet implemented",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || "Failed to delete project",
    });
  }
});

/**
 * Sync project with GitHub repository
 */
router.post(
  "/:id/sync",
  auth,
  async (req: any, res: Response): Promise<void> => {
    try {
      res.status(501).json({
        success: false,
        error: "GitHub sync not yet implemented",
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || "Failed to sync project",
      });
    }
  }
);

/**
 * Get GitHub integration status for a project
 */
router.get(
  "/:id/github-status",
  auth,
  async (req: any, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const project = await Project.findById(id).select("github name");

      if (!project) {
        res.status(404).json({
          success: false,
          error: "Project not found",
        });
        return;
      }

      const status = {
        projectId: id,
        projectName: project.name,
        github: project.github || { enabled: false },
        connected: project.github?.enabled && project.github.repoName,
        lastSync: project.github?.lastSyncAt,
        syncStatus: project.github?.syncStatus || "never_synced",
        errors: project.github?.syncErrors || [],
      };

      res.json({
        success: true,
        data: status,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || "Failed to get GitHub status",
      });
    }
  }
);

export default router;
