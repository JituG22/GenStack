import { Router, Request, Response } from "express";
import { auth } from "../middleware/auth";
import { handleValidationErrors } from "../middleware/validation";
import { gitHubActionsService } from "../services/gitHubActionsService";
import { sendSuccess, sendError } from "../utils/response";
import { body, param, query } from "express-validator";

const router = Router();

// Get workflow templates
router.get("/templates", auth, async (req: Request, res: Response) => {
  try {
    const templates = gitHubActionsService.getWorkflowTemplates();
    return sendSuccess(
      res,
      { templates },
      "Workflow templates retrieved successfully"
    );
  } catch (error: any) {
    console.error("Error getting workflow templates:", error);
    return sendError(
      res,
      error.message || "Failed to get workflow templates",
      500
    );
  }
});

// Create workflow from template
router.post(
  "/workflows",
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
    body("templateName")
      .isString()
      .notEmpty()
      .withMessage("Template name is required"),
    body("branch").optional().isString(),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { accountId, repoName, templateName, branch = "main" } = req.body;

      const templates = gitHubActionsService.getWorkflowTemplates();
      const template = templates.find((t) => t.name === templateName);

      if (!template) {
        return sendError(res, "Workflow template not found", 404);
      }

      const result = await gitHubActionsService.createWorkflow(
        accountId,
        repoName,
        template,
        branch
      );

      if (result.success) {
        return sendSuccess(res, result, "Workflow created successfully", 201);
      } else {
        return sendError(res, result.message, 400);
      }
    } catch (error: any) {
      console.error("Error creating workflow:", error);
      return sendError(res, error.message || "Failed to create workflow", 500);
    }
  }
);

// Get workflows for repository
router.get(
  "/workflows/:repoName",
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

      const workflows = await gitHubActionsService.getWorkflows(
        accountId as string,
        repoName
      );

      return sendSuccess(
        res,
        { workflows },
        "Workflows retrieved successfully"
      );
    } catch (error: any) {
      console.error("Error getting workflows:", error);
      return sendError(res, error.message || "Failed to get workflows", 500);
    }
  }
);

// Get workflow runs
router.get(
  "/runs/:repoName",
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
    query("workflowId").optional().isString(),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { repoName } = req.params;
      const { accountId, workflowId } = req.query;

      const runs = await gitHubActionsService.getWorkflowRuns(
        accountId as string,
        repoName,
        workflowId as string
      );

      return sendSuccess(res, { runs }, "Workflow runs retrieved successfully");
    } catch (error: any) {
      console.error("Error getting workflow runs:", error);
      return sendError(
        res,
        error.message || "Failed to get workflow runs",
        500
      );
    }
  }
);

// Trigger workflow
router.post(
  "/trigger",
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
    body("workflowId")
      .isString()
      .notEmpty()
      .withMessage("Workflow ID is required"),
    body("ref").optional().isString(),
    body("inputs").optional().isObject(),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const {
        accountId,
        repoName,
        workflowId,
        ref = "main",
        inputs = {},
      } = req.body;

      const result = await gitHubActionsService.triggerWorkflow(
        accountId,
        repoName,
        workflowId,
        ref,
        inputs
      );

      if (result.success) {
        return sendSuccess(res, result, "Workflow triggered successfully");
      } else {
        return sendError(res, result.message, 400);
      }
    } catch (error: any) {
      console.error("Error triggering workflow:", error);
      return sendError(res, error.message || "Failed to trigger workflow", 500);
    }
  }
);

// Cancel workflow run
router.post(
  "/cancel/:runId",
  auth,
  [
    param("runId").isNumeric().withMessage("Run ID must be a number"),
    body("accountId")
      .isString()
      .notEmpty()
      .withMessage("Account ID is required"),
    body("repoName")
      .isString()
      .notEmpty()
      .withMessage("Repository name is required"),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { runId } = req.params;
      const { accountId, repoName } = req.body;

      const result = await gitHubActionsService.cancelWorkflowRun(
        accountId,
        repoName,
        parseInt(runId)
      );

      if (result.success) {
        return sendSuccess(res, result, "Workflow run cancelled successfully");
      } else {
        return sendError(res, result.message, 400);
      }
    } catch (error: any) {
      console.error("Error cancelling workflow run:", error);
      return sendError(
        res,
        error.message || "Failed to cancel workflow run",
        500
      );
    }
  }
);

// Get workflow run logs
router.get(
  "/logs/:repoName/:runId",
  auth,
  [
    param("repoName")
      .isString()
      .notEmpty()
      .withMessage("Repository name is required"),
    param("runId").isNumeric().withMessage("Run ID must be a number"),
    query("accountId")
      .isString()
      .notEmpty()
      .withMessage("Account ID is required"),
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { repoName, runId } = req.params;
      const { accountId } = req.query;

      const logs = await gitHubActionsService.getWorkflowRunLogs(
        accountId as string,
        repoName,
        parseInt(runId)
      );

      return sendSuccess(
        res,
        { logs },
        "Workflow run logs retrieved successfully"
      );
    } catch (error: any) {
      console.error("Error getting workflow run logs:", error);
      return sendError(
        res,
        error.message || "Failed to get workflow run logs",
        500
      );
    }
  }
);

export default router;
