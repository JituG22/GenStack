import express, { Response } from "express";
import { auth } from "../middleware/auth";
import { Project } from "../models/Project-simple";
import { GitHubAccount } from "../models/GitHubAccount";
import { gitHubAccountService } from "../services/gitHubAccountService";
import { AuthRequest } from "../types";

const router = express.Router();

interface EnhancedProjectRequest {
  name: string;
  description?: string;
  isPublic?: boolean;
  tags?: string[];
  github?: {
    enabled: boolean;
    accountId: string;
    repositoryName: string;
    isPrivate?: boolean;
    autoSync?: boolean;
    createReadme?: boolean;
    gitignoreTemplate?: string;
    license?: string;
  };
}

/**
 * @route   GET /api/enhanced-projects/github/health
 * @desc    Check GitHub integration health with account status
 * @access  Private
 */
router.get(
  "/github/health",
  auth,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      // Get user's GitHub accounts
      const accounts = await gitHubAccountService.getAccountsByUser(
        req.user!.id
      );
      const activeAccounts = accounts.filter(
        (acc) => acc.isActive && acc.validationStatus === "valid"
      );

      const healthStatus = {
        success: true,
        config: {
          ready: activeAccounts.length > 0,
          accountsConfigured: accounts.length,
          activeAccounts: activeAccounts.length,
          hasDefaultAccount: activeAccounts.some((acc) => acc.isDefault),
        },
        accounts: activeAccounts.map((acc) => ({
          id: acc.id,
          nickname: acc.nickname,
          username: acc.username,
          isDefault: acc.isDefault,
          permissions: acc.permissions,
          lastUsedAt: acc.lastUsedAt,
        })),
      };

      res.json(healthStatus);
    } catch (error: any) {
      console.error("GitHub health check error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to check GitHub health",
      });
    }
  }
);

/**
 * @route   POST /api/enhanced-projects
 * @desc    Create a new project with enhanced GitHub integration
 * @access  Private
 */
router.post(
  "/",
  auth,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const projectRequest: EnhancedProjectRequest = req.body;
      const { name, description, isPublic, tags, github } = projectRequest;

      if (!name) {
        res.status(400).json({
          success: false,
          error: "Project name is required",
        });
        return;
      }

      // Validate GitHub account if GitHub integration is enabled
      let selectedAccount: any = null;
      if (github?.enabled && github.accountId) {
        selectedAccount = await GitHubAccount.findOne({
          _id: github.accountId,
          userId: req.user!.id,
          isActive: true,
          validationStatus: "valid",
        });

        if (!selectedAccount) {
          res.status(400).json({
            success: false,
            error: "Invalid or inactive GitHub account selected",
          });
          return;
        }

        // Check permissions
        if (!selectedAccount.permissions.createRepo) {
          res.status(400).json({
            success: false,
            error:
              "Selected GitHub account doesn't have permission to create repositories",
          });
          return;
        }

        // Check private repo permissions if needed
        if (github.isPrivate && !selectedAccount.permissions.createRepo) {
          res.status(400).json({
            success: false,
            error:
              "Selected GitHub account doesn't have permission to create private repositories",
          });
          return;
        }
      }

      // Prepare project data
      const projectData: any = {
        name,
        description,
        organization: req.user!.organization,
        createdBy: req.user!.id,
        isPublic: isPublic || false,
        tags: tags || [],
        github: {
          enabled: false,
        },
      };

      // Create GitHub repository if enabled
      if (github?.enabled && selectedAccount) {
        try {
          console.log(
            `Creating GitHub repository using account: ${selectedAccount.username}`
          );

          const repoData = {
            name:
              github.repositoryName || name.toLowerCase().replace(/\\s+/g, "-"),
            description: description || `GenStack project: ${name}`,
            private: github.isPrivate || false,
            auto_init: github.createReadme || false,
            gitignore_template: github.gitignoreTemplate,
            license_template: github.license,
          };

          // Create repository using selected account
          const repository = await gitHubAccountService.createRepository(
            selectedAccount.id,
            repoData
          );

          // Update project with GitHub information
          projectData.github = {
            enabled: true,
            accountId: selectedAccount.id,
            accountUsername: selectedAccount.username,
            repoName: repository.name,
            repoUrl: repository.html_url,
            repoId: repository.id,
            syncStatus: "synced",
            autoSync: github.autoSync || false,
            createdAt: new Date(),
            lastSyncAt: new Date(),
          };

          // Update account usage statistics
          await gitHubAccountService.updateAccountStats(selectedAccount.id, {
            repositoriesCreated: selectedAccount.stats.repositoriesCreated + 1,
            lastRepositoryCreated: new Date().toISOString(),
            lastUsedAt: new Date().toISOString(),
          });

          console.log(`✅ GitHub repository created: ${repository.html_url}`);
        } catch (githubError: any) {
          console.error("GitHub repository creation failed:", githubError);

          // Continue with project creation but mark GitHub as failed
          projectData.github = {
            enabled: false,
            accountId: selectedAccount.id,
            syncStatus: "error",
            syncErrors: [
              `GitHub repository creation failed: ${githubError.message}`,
            ],
            lastSyncAt: new Date(),
          };
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
      console.error("Enhanced project creation error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to create project",
      });
    }
  }
);

/**
 * @route   PUT /api/enhanced-projects/:id/github
 * @desc    Update project GitHub integration
 * @access  Private
 */
router.put(
  "/:id/github",
  auth,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { accountId, repositoryName, autoSync, isPrivate } = req.body;

      // Find the project
      const project = await Project.findOne({
        _id: req.params.id,
        organization: req.user!.organization,
      });

      if (!project) {
        res.status(404).json({
          success: false,
          error: "Project not found",
        });
        return;
      }

      // Validate GitHub account
      const selectedAccount = await GitHubAccount.findOne({
        _id: accountId,
        userId: req.user!.id,
        isActive: true,
        validationStatus: "valid",
      });

      if (!selectedAccount) {
        res.status(400).json({
          success: false,
          error: "Invalid or inactive GitHub account selected",
        });
        return;
      }

      // Update GitHub integration
      if (project.github?.enabled && project.github.repoId) {
        // Update existing repository settings
        try {
          await gitHubAccountService.updateRepository(
            selectedAccount.id,
            project.github.repoId,
            {
              name: repositoryName,
              private: isPrivate,
            }
          );

          project.github.accountId = accountId;
          project.github.accountUsername = selectedAccount.username;
          project.github.repoName = repositoryName;
          project.github.autoSync = autoSync;
          project.github.syncStatus = "synced";
          project.github.lastSyncAt = new Date();
        } catch (error: any) {
          project.github.syncStatus = "error";
          project.github.syncErrors = [error.message];
        }
      } else {
        // Create new repository
        try {
          const repoData = {
            name:
              repositoryName ||
              project.name.toLowerCase().replace(/\\s+/g, "-"),
            description:
              project.description || `GenStack project: ${project.name}`,
            private: isPrivate || false,
            auto_init: true,
          };

          const repository = await gitHubAccountService.createRepository(
            selectedAccount.id,
            repoData
          );

          project.github = {
            enabled: true,
            accountId: selectedAccount.id,
            accountUsername: selectedAccount.username,
            repoName: repository.name,
            repoUrl: repository.html_url,
            repoId: repository.id,
            syncStatus: "synced",
            autoSync: autoSync || false,
            createdAt: new Date(),
            lastSyncAt: new Date(),
          };
        } catch (error: any) {
          res.status(500).json({
            success: false,
            error: `Failed to create GitHub repository: ${error.message}`,
          });
          return;
        }
      }

      await project.save();

      res.json({
        success: true,
        message: "GitHub integration updated successfully",
        data: project,
      });
    } catch (error: any) {
      console.error("Update GitHub integration error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to update GitHub integration",
      });
    }
  }
);

/**
 * @route   DELETE /api/enhanced-projects/:id
 * @desc    Delete project with enhanced GitHub cleanup
 * @access  Private
 */
router.delete(
  "/:id",
  auth,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const project = await Project.findOne({
        _id: req.params.id,
        organization: req.user!.organization,
      });

      if (!project) {
        res.status(404).json({
          success: false,
          error: "Project not found",
        });
        return;
      }

      // Handle GitHub repository cleanup
      if (
        project.github?.enabled &&
        project.github.accountId &&
        project.github.repoName
      ) {
        try {
          const account = await GitHubAccount.findById(
            project.github.accountId
          );
          if (account && account.permissions.deleteRepo) {
            await gitHubAccountService.deleteRepository(
              account.id,
              project.github.repoName
            );
            console.log(
              `✅ GitHub repository deleted: ${project.github.repoName}`
            );
          } else {
            console.warn(
              `⚠️ Cannot delete GitHub repository: insufficient permissions or account not found`
            );
          }
        } catch (githubError: any) {
          console.error("GitHub repository deletion failed:", githubError);
          // Continue with project deletion even if GitHub cleanup fails
        }
      }

      // Delete project
      await Project.findByIdAndDelete(req.params.id);

      res.json({
        success: true,
        message: "Project deleted successfully",
        data: { id: req.params.id },
      });
    } catch (error: any) {
      console.error("Enhanced project deletion error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to delete project",
      });
    }
  }
);

export default router;
