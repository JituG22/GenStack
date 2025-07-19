import { Router, Request, Response } from "express";
import { auth } from "../middleware/auth";
import { handleValidationErrors } from "../middleware/validation";
import { gitHubSyncService, FileChange } from "../services/gitHubSyncService";
import { sendSuccess, sendError } from "../utils/response";
import { body, param, query } from "express-validator";

const router = Router();

// Sync files to GitHub
router.post(
  "/sync",
  auth,
  [
    body("projectId")
      .isString()
      .notEmpty()
      .withMessage("Project ID is required"),
    body("accountId")
      .isString()
      .notEmpty()
      .withMessage("Account ID is required"),
    body("files").isArray().withMessage("Files array is required"),
    body("commitMessage")
      .isString()
      .notEmpty()
      .withMessage("Commit message is required"),
    body("branch").optional().isString(),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const {
        projectId,
        accountId,
        files,
        commitMessage,
        branch = "main",
      } = req.body;

      const result = await gitHubSyncService.syncFilesToGitHub(
        projectId,
        accountId,
        files as FileChange[],
        commitMessage,
        branch
      );

      if (result.success) {
        sendSuccess(res, result, "Files synced successfully");
      } else {
        sendError(res, `Sync failed: ${result.errors.join(", ")}`, 400);
      }
    } catch (error: any) {
      console.error("Repository sync error:", error);
      sendError(res, error.message || "Failed to sync files", 500);
    }
  }
);

// Pull files from GitHub
router.post(
  "/pull",
  auth,
  [
    body("projectId")
      .isString()
      .notEmpty()
      .withMessage("Project ID is required"),
    body("accountId")
      .isString()
      .notEmpty()
      .withMessage("Account ID is required"),
    body("branch").optional().isString(),
    body("paths").optional().isArray(),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { projectId, accountId, branch = "main", paths } = req.body;

      const result = await gitHubSyncService.pullFilesFromGitHub(
        projectId,
        accountId,
        branch,
        paths
      );

      if (result.success) {
        sendSuccess(res, result, "Files pulled successfully");
      } else {
        sendError(res, `Pull failed: ${result.errors.join(", ")}`, 400);
      }
    } catch (error: any) {
      console.error("Repository pull error:", error);
      sendError(res, error.message || "Failed to pull files", 500);
    }
  }
);

// Get repository branches
router.get(
  "/branches/:repoName",
  auth,
  [
    param("repoName")
      .isString()
      .notEmpty()
      .withMessage("Repository name is required"),
    query("accountId")
      .isString()
      .notEmpty()
      .withMessage("Account ID is required"),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { repoName } = req.params;
      const { accountId } = req.query;

      const branches = await gitHubSyncService.getBranches(
        accountId as string,
        repoName
      );

      sendSuccess(res, { branches }, "Branches retrieved successfully");
    } catch (error: any) {
      console.error("Get branches error:", error);
      sendError(res, error.message || "Failed to get branches", 500);
    }
  }
);

// Create new branch
router.post(
  "/branches",
  auth,
  [
    body("accountId")
      .isString()
      .notEmpty()
      .withMessage("Account ID is required"),
    body("repoName")
      .isString()
      .notEmpty()
      .withMessage("Repository name is required"),
    body("branchName")
      .isString()
      .notEmpty()
      .withMessage("Branch name is required"),
    body("fromBranch").optional().isString(),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { accountId, repoName, branchName, fromBranch = "main" } = req.body;

      const branch = await gitHubSyncService.createBranch(
        accountId,
        repoName,
        branchName,
        fromBranch
      );

      sendSuccess(res, { branch }, "Branch created successfully", 201);
    } catch (error: any) {
      console.error("Create branch error:", error);
      sendError(res, error.message || "Failed to create branch", 500);
    }
  }
);

// Get file diff
router.post(
  "/diff",
  auth,
  [
    body("accountId")
      .isString()
      .notEmpty()
      .withMessage("Account ID is required"),
    body("repoName")
      .isString()
      .notEmpty()
      .withMessage("Repository name is required"),
    body("filePath").isString().notEmpty().withMessage("File path is required"),
    body("baseBranch")
      .isString()
      .notEmpty()
      .withMessage("Base branch is required"),
    body("headBranch")
      .isString()
      .notEmpty()
      .withMessage("Head branch is required"),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { accountId, repoName, filePath, baseBranch, headBranch } =
        req.body;

      const diff = await gitHubSyncService.getFileDiff(
        accountId,
        repoName,
        filePath,
        baseBranch,
        headBranch
      );

      sendSuccess(
        res,
        { diff, filePath, baseBranch, headBranch },
        "Diff retrieved successfully"
      );
    } catch (error: any) {
      console.error("Get diff error:", error);
      sendError(res, error.message || "Failed to get diff", 500);
    }
  }
);

export default router;
