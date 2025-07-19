import { Router, Request, Response } from "express";
import { param, query, validationResult } from "express-validator";
import { auth } from "../middleware/auth";
import { repositoryAnalyticsService } from "../services/repositoryAnalyticsService";
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

// Get repository metrics
router.get(
  "/metrics/:repoName",
  auth,
  [
    param("repoName").notEmpty().withMessage("Repository name is required"),
    query("accountId").notEmpty().withMessage("Account ID is required"),
    query("timeRange").optional().isIn(["7d", "30d", "90d", "1y"]),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { repoName } = req.params;
      const { accountId, timeRange } = req.query;

      const metrics = await repositoryAnalyticsService.getRepositoryMetrics(
        accountId as string,
        repoName,
        (timeRange as "7d" | "30d" | "90d" | "1y") || "30d"
      );

      return sendSuccess(
        res,
        { metrics },
        "Repository metrics retrieved successfully"
      );
    } catch (error: any) {
      console.error("Error getting repository metrics:", error);
      return sendError(
        res,
        error.message || "Failed to get repository metrics",
        500
      );
    }
  }
);

// Get code quality report
router.get(
  "/quality/:repoName",
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

      const report = await repositoryAnalyticsService.generateCodeQualityReport(
        accountId as string,
        repoName
      );

      return sendSuccess(
        res,
        { report },
        "Code quality report generated successfully"
      );
    } catch (error: any) {
      console.error("Error generating code quality report:", error);
      return sendError(
        res,
        error.message || "Failed to generate code quality report",
        500
      );
    }
  }
);

// Get security analysis
router.get(
  "/security/:repoName",
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

      const analysis = await repositoryAnalyticsService.performSecurityAnalysis(
        accountId as string,
        repoName
      );

      return sendSuccess(
        res,
        { analysis },
        "Security analysis completed successfully"
      );
    } catch (error: any) {
      console.error("Error performing security analysis:", error);
      return sendError(
        res,
        error.message || "Failed to perform security analysis",
        500
      );
    }
  }
);

export default router;
