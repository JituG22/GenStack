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
    const isEnabled = process.env.GITHUB_ENABLED === 'true';
    const hasToken = !!process.env.GITHUB_TOKEN;
    const hasUsername = !!process.env.GITHUB_USERNAME;
    
    res.status(200).json({
      success: true,
      message: "GitHub integration routes are accessible",
      config: {
        enabled: isEnabled,
        hasToken,
        hasUsername,
        ready: isEnabled && hasToken && hasUsername
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
    const { name, description, organization, isPublic, tags, github, githubConfig, enableGitHub } = req.body;

    if (!name || !organization) {
      res.status(400).json({
        success: false,
        error: "Name and organization are required",
      });
      return;
    }

    const projectData: any = {
      name,
      description,
      organization,
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
          name: githubConfig?.repositoryName || name.toLowerCase().replace(/\s+/g, '-'),
          description: description || `GenStack project: ${name}`,
          private: !isPublic,
          auto_init: githubConfig?.createReadme !== false,
        };

        const githubResponse = await githubService.createRepository(repoData);

        if (githubResponse.success && githubResponse.data) {
          console.log(`GitHub repository created successfully: ${(githubResponse.data as any).html_url}`);

          // Update GitHub configuration
          projectData.github.enabled = true;
          projectData.github.repoId = (githubResponse.data as any).id;
          projectData.github.repoName = (githubResponse.data as any).name;
          projectData.github.repoUrl = (githubResponse.data as any).html_url;
          projectData.github.lastSyncAt = new Date();
          projectData.github.syncStatus = "synced";
          projectData.github.syncErrors = [];
        } else {
          throw new Error(githubResponse.error?.message || "Failed to create GitHub repository");
        }
      } catch (githubError: any) {
        console.error("GitHub repository creation failed:", githubError);
        
        // Continue with project creation but mark GitHub as failed
        projectData.github.enabled = false;
        projectData.github.syncStatus = "error";
        projectData.github.syncErrors = [`GitHub repository creation failed: ${githubError.message}`];
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
 * Update a project with GitHub synchronization
 */
router.put("/:id", auth, async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedProject = await projectGitHubService.updateProjectWithGitHub(
      id,
      updateData,
      req.user.id
    );

    res.json({
      success: true,
      data: updatedProject,
    });
  } catch (error: any) {
    console.error("Update project with GitHub error:", error);
    
    if (error.message === "Project not found") {
      res.status(404).json({
        success: false,
        error: "Project not found",
      });
    } else if (error.message === "Unauthorized to update this project") {
      res.status(403).json({
        success: false,
        error: "Unauthorized to update this project",
      });
    } else {
      res.status(500).json({
        success: false,
        error: error.message || "Failed to update project",
      });
    }
  }
});

/**
 * Delete a project with GitHub repository cleanup
 */
router.delete("/:id", auth, async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await projectGitHubService.deleteProjectWithGitHub(
      id,
      req.user.id
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("Delete project with GitHub error:", error);
    
    if (error.message === "Project not found") {
      res.status(404).json({
        success: false,
        error: "Project not found",
      });
    } else if (error.message === "Unauthorized to delete this project") {
      res.status(403).json({
        success: false,
        error: "Unauthorized to delete this project",
      });
    } else {
      res.status(500).json({
        success: false,
        error: error.message || "Failed to delete project",
      });
    }
  }
});

/**
 * Manually sync a project with its GitHub repository
 */
router.post("/:id/sync", auth, async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const syncedProject = await projectGitHubService.syncProjectWithGitHub(
      id,
      req.user.id
    );

    res.json({
      success: true,
      data: syncedProject,
    });
  } catch (error: any) {
    console.error("Sync project with GitHub error:", error);
    
    if (error.message === "Project not found") {
      res.status(404).json({
        success: false,
        error: "Project not found",
      });
    } else if (error.message === "Unauthorized to sync this project") {
      res.status(403).json({
        success: false,
        error: "Unauthorized to sync this project",
      });
    } else if (error.message === "GitHub integration is not enabled for this project") {
      res.status(400).json({
        success: false,
        error: "GitHub integration is not enabled for this project",
      });
    } else {
      res.status(500).json({
        success: false,
        error: error.message || "Failed to sync project",
      });
    }
  }
});

/**
 * Get GitHub repository status for a project
 */
router.get("/:id/github-status", auth, async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const githubStatus = await projectGitHubService.getGitHubStatus(
      id,
      req.user.id
    );

    res.json({
      success: true,
      data: githubStatus,
    });
  } catch (error: any) {
    console.error("Get GitHub status error:", error);
    
    if (error.message === "Project not found") {
      res.status(404).json({
        success: false,
        error: "Project not found",
      });
    } else if (error.message === "Unauthorized to access this project") {
      res.status(403).json({
        success: false,
        error: "Unauthorized to access this project",
      });
    } else {
      res.status(500).json({
        success: false,
        error: error.message || "Failed to get GitHub status",
      });
    }
  }
});

/**
 * Get all projects with GitHub integration info
 */
router.get("/", auth, async (req: any, res: Response): Promise<void> => {
  try {
    const { organization, github, page = 1, limit = 10 } = req.query;
    
    // Build filter object
    const filter: any = {};
    
    if (organization) {
      filter.organization = organization;
    }
    
    if (github !== undefined) {
      filter["github.enabled"] = github === "true";
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const projects = await Project.find(filter)
      .populate("createdBy", "firstName lastName email")
      .populate("collaborators", "firstName lastName email")
      .populate("organization", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Project.countDocuments(filter);

    res.json({
      success: true,
      data: {
        projects,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error: any) {
    console.error("Get projects error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get projects",
    });
  }
});

export default router;
