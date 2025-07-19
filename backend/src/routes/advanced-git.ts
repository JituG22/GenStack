import { Router, Request, Response } from "express";
import { body, param, query, validationResult } from "express-validator";
import { auth } from "../middleware/auth";
import { advancedGitService } from "../services/advancedGitService";
import { sendSuccess, sendError } from "../utils/response";

const router = Router();

// Middleware for validation errors
const handleValidationErrors = (
  req: Request,
  res: Response,
  next: Function
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, "Validation failed", 400);
  }
  return next();
};

// Initialize repository
router.post(
  "/init",
  auth,
  [
    body("projectId").notEmpty().withMessage("Project ID is required"),
    body("accountId").notEmpty().withMessage("Account ID is required"),
    body("gitConfig").isObject().withMessage("Git config is required"),
    body("gitConfig.user.name")
      .notEmpty()
      .withMessage("Git user name is required"),
    body("gitConfig.user.email")
      .isEmail()
      .withMessage("Valid Git user email is required"),
    body("gitConfig.remote.origin")
      .isURL()
      .withMessage("Valid remote origin URL is required"),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { projectId, accountId, gitConfig } = req.body;

      const result = await advancedGitService.initializeRepository(
        projectId,
        accountId,
        gitConfig
      );

      if (result.success) {
        return sendSuccess(
          res,
          result,
          "Repository initialized successfully",
          201
        );
      } else {
        return sendError(res, result.message, 400);
      }
    } catch (error: any) {
      console.error("Error initializing repository:", error);
      return sendError(
        res,
        error.message || "Failed to initialize repository",
        500
      );
    }
  }
);

// Get commit history
router.get(
  "/commits/:repoName",
  auth,
  [
    param("repoName").notEmpty().withMessage("Repository name is required"),
    query("accountId").notEmpty().withMessage("Account ID is required"),
    query("branch").optional().isString(),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("since").optional().isISO8601(),
    query("until").optional().isISO8601(),
    query("author").optional().isString(),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { repoName } = req.params;
      const { accountId, branch, limit, since, until, author } = req.query;

      const commits = await advancedGitService.getCommitHistory(
        accountId as string,
        repoName,
        {
          branch: branch as string,
          limit: limit ? parseInt(limit as string) : undefined,
          since: since as string,
          until: until as string,
          author: author as string,
        }
      );

      return sendSuccess(
        res,
        { commits },
        "Commit history retrieved successfully"
      );
    } catch (error: any) {
      console.error("Error getting commit history:", error);
      return sendError(
        res,
        error.message || "Failed to get commit history",
        500
      );
    }
  }
);

// Get branch details
router.get(
  "/branches/:repoName/details",
  auth,
  [
    param("repoName").notEmpty().withMessage("Repository name is required"),
    query("accountId").notEmpty().withMessage("Account ID is required"),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { repoName } = req.params;
      const { accountId } = req.query;

      const branches = await advancedGitService.getBranchDetails(
        accountId as string,
        repoName
      );

      return sendSuccess(
        res,
        { branches },
        "Branch details retrieved successfully"
      );
    } catch (error: any) {
      console.error("Error getting branch details:", error);
      return sendError(
        res,
        error.message || "Failed to get branch details",
        500
      );
    }
  }
);

// Create protected branch
router.post(
  "/branches/protected",
  auth,
  [
    body("accountId").notEmpty().withMessage("Account ID is required"),
    body("repoName").notEmpty().withMessage("Repository name is required"),
    body("branchName").notEmpty().withMessage("Branch name is required"),
    body("sourceRef").optional().isString(),
    body("protectionRules").optional().isObject(),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { accountId, repoName, branchName, sourceRef, protectionRules } =
        req.body;

      const result = await advancedGitService.createProtectedBranch(
        accountId,
        repoName,
        branchName,
        sourceRef,
        protectionRules
      );

      if (result.success) {
        return sendSuccess(
          res,
          result,
          "Protected branch created successfully",
          201
        );
      } else {
        return sendError(res, result.message, 400);
      }
    } catch (error: any) {
      console.error("Error creating protected branch:", error);
      return sendError(
        res,
        error.message || "Failed to create protected branch",
        500
      );
    }
  }
);

// Preview pull request
router.get(
  "/pull-request/preview/:repoName",
  auth,
  [
    param("repoName").notEmpty().withMessage("Repository name is required"),
    query("accountId").notEmpty().withMessage("Account ID is required"),
    query("headBranch").notEmpty().withMessage("Head branch is required"),
    query("baseBranch").optional().isString(),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { repoName } = req.params;
      const { accountId, headBranch, baseBranch } = req.query;

      const preview = await advancedGitService.previewPullRequest(
        accountId as string,
        repoName,
        headBranch as string,
        baseBranch as string
      );

      return sendSuccess(
        res,
        { preview },
        "Pull request preview generated successfully"
      );
    } catch (error: any) {
      console.error("Error previewing pull request:", error);
      return sendError(
        res,
        error.message || "Failed to preview pull request",
        500
      );
    }
  }
);

// Perform advanced merge
router.post(
  "/merge/advanced",
  auth,
  [
    body("accountId").notEmpty().withMessage("Account ID is required"),
    body("repoName").notEmpty().withMessage("Repository name is required"),
    body("pullNumber")
      .isInt({ min: 1 })
      .withMessage("Valid pull request number is required"),
    body("mergeMethod")
      .isIn(["merge", "squash", "rebase"])
      .withMessage("Valid merge method is required"),
    body("mergeMessage").optional().isString(),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { accountId, repoName, pullNumber, mergeMethod, mergeMessage } =
        req.body;

      const result = await advancedGitService.performAdvancedMerge(
        accountId,
        repoName,
        pullNumber,
        mergeMethod,
        mergeMessage
      );

      if (result.success) {
        return sendSuccess(res, result, "Pull request merged successfully");
      } else {
        return sendError(res, result.message, 400);
      }
    } catch (error: any) {
      console.error("Error performing merge:", error);
      return sendError(
        res,
        error.message || "Failed to merge pull request",
        500
      );
    }
  }
);

// Create release
router.post(
  "/releases",
  auth,
  [
    body("accountId").notEmpty().withMessage("Account ID is required"),
    body("repoName").notEmpty().withMessage("Repository name is required"),
    body("tagName").notEmpty().withMessage("Tag name is required"),
    body("releaseName").notEmpty().withMessage("Release name is required"),
    body("description").optional().isString(),
    body("isDraft").optional().isBoolean(),
    body("isPrerelease").optional().isBoolean(),
    body("generateChangelog").optional().isBoolean(),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const {
        accountId,
        repoName,
        tagName,
        releaseName,
        description,
        isDraft,
        isPrerelease,
        generateChangelog,
      } = req.body;

      const result = await advancedGitService.createRelease(
        accountId,
        repoName,
        tagName,
        releaseName,
        description || "",
        isDraft || false,
        isPrerelease || false,
        generateChangelog !== false
      );

      if (result.success) {
        return sendSuccess(res, result, "Release created successfully", 201);
      } else {
        return sendError(res, result.message, 400);
      }
    } catch (error: any) {
      console.error("Error creating release:", error);
      return sendError(res, error.message || "Failed to create release", 500);
    }
  }
);

export default router;
