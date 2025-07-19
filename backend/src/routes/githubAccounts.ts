import { Router, Response } from "express";
import { body, param, validationResult } from "express-validator";
import { auth } from "../middleware/auth";
import { gitHubAccountService } from "../services/gitHubAccountService";
import { sendSuccess, sendError } from "../utils/response";

const router = Router();

// Helper function to handle validation errors
const handleValidationErrors = (req: any, res: Response): boolean => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    sendError(
      res,
      "Validation failed",
      400,
      "VALIDATION_ERROR",
      errors.array()
    );
    return true;
  }
  return false;
};

/**
 * @swagger
 * /api/github-accounts:
 *   get:
 *     summary: Get all GitHub accounts for the authenticated user
 *     tags: [GitHub Accounts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of GitHub accounts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/GitHubAccount'
 */
router.get("/", auth, async (req: any, res: Response): Promise<void> => {
  try {
    const accounts = await gitHubAccountService.getUserGitHubAccounts(
      req.user.id
    );
    sendSuccess(res, accounts, "GitHub accounts retrieved successfully");
  } catch (error: any) {
    console.error("Get GitHub accounts error:", error);
    sendError(res, error.message || "Failed to retrieve GitHub accounts", 500);
  }
});

/**
 * @swagger
 * /api/github-accounts/default:
 *   get:
 *     summary: Get the default GitHub account for the authenticated user
 *     tags: [GitHub Accounts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Default GitHub account
 *       404:
 *         description: No default GitHub account found
 */
router.get("/default", auth, async (req: any, res: Response): Promise<void> => {
  try {
    const account = await gitHubAccountService.getDefaultGitHubAccount(
      req.user.id
    );

    if (!account) {
      sendError(res, "No default GitHub account found", 404);
      return;
    }

    sendSuccess(res, account, "Default GitHub account retrieved successfully");
  } catch (error: any) {
    console.error("Get default GitHub account error:", error);
    sendError(
      res,
      error.message || "Failed to retrieve default GitHub account",
      500
    );
  }
});

/**
 * @swagger
 * /api/github-accounts/statistics:
 *   get:
 *     summary: Get usage statistics for user's GitHub accounts
 *     tags: [GitHub Accounts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: GitHub account statistics
 */
router.get(
  "/statistics",
  auth,
  async (req: any, res: Response): Promise<void> => {
    try {
      const stats = await gitHubAccountService.getAccountStatistics(
        req.user.id
      );
      sendSuccess(
        res,
        stats,
        "GitHub account statistics retrieved successfully"
      );
    } catch (error: any) {
      console.error("Get GitHub statistics error:", error);
      sendError(
        res,
        error.message || "Failed to retrieve GitHub statistics",
        500
      );
    }
  }
);

/**
 * @swagger
 * /api/github-accounts/validate-token:
 *   post:
 *     summary: Validate a GitHub token
 *     tags: [GitHub Accounts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 description: GitHub personal access token
 *             required:
 *               - token
 *     responses:
 *       200:
 *         description: Token validation result
 */
router.post(
  "/validate-token",
  [
    auth,
    body("token")
      .notEmpty()
      .withMessage("GitHub token is required")
      .isLength({ min: 20 })
      .withMessage("Invalid token format"),
  ],
  async (req: any, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        sendError(
          res,
          "Validation failed",
          400,
          "VALIDATION_ERROR",
          errors.array()
        );
        return;
      }

      const { token } = req.body;
      const validation = await gitHubAccountService.validateGitHubToken(token);

      sendSuccess(res, validation, "Token validation completed");
    } catch (error: any) {
      console.error("Validate GitHub token error:", error);
      sendError(res, error.message || "Failed to validate GitHub token", 500);
    }
  }
);

/**
 * @swagger
 * /api/github-accounts:
 *   post:
 *     summary: Create a new GitHub account
 *     tags: [GitHub Accounts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nickname:
 *                 type: string
 *                 description: Friendly name for the account
 *               token:
 *                 type: string
 *                 description: GitHub personal access token
 *               setAsDefault:
 *                 type: boolean
 *                 description: Set this account as default
 *             required:
 *               - nickname
 *               - token
 */
router.post(
  "/",
  [
    auth,
    body("nickname")
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage("Nickname must be between 1 and 50 characters"),
    body("token")
      .notEmpty()
      .withMessage("GitHub token is required")
      .isLength({ min: 20 })
      .withMessage("Invalid token format"),
    body("setAsDefault")
      .optional()
      .isBoolean()
      .withMessage("setAsDefault must be a boolean"),
  ],
  async (req: any, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        sendError(
          res,
          "Validation failed",
          400,
          "VALIDATION_ERROR",
          errors.array()
        );
        return;
      }

      const { nickname, token, setAsDefault } = req.body;

      const account = await gitHubAccountService.createGitHubAccount(
        req.user.id,
        req.user.organization,
        { nickname, token, setAsDefault }
      );

      sendSuccess(res, account, "GitHub account created successfully", 201);
    } catch (error: any) {
      console.error("Create GitHub account error:", error);

      if (error.message.includes("already exists")) {
        sendError(res, error.message, 409);
      } else if (error.message.includes("Invalid")) {
        sendError(res, error.message, 400);
      } else {
        sendError(res, error.message || "Failed to create GitHub account", 500);
      }
    }
  }
);

/**
 * @swagger
 * /api/github-accounts/{id}:
 *   get:
 *     summary: Get a specific GitHub account
 *     tags: [GitHub Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: GitHub account ID
 *     responses:
 *       200:
 *         description: GitHub account details
 *       404:
 *         description: GitHub account not found
 */
router.get(
  "/:id",
  [auth, param("id").isMongoId().withMessage("Invalid account ID")],
  async (req: any, res: Response): Promise<void> => {
    try {
      if (handleValidationErrors(req, res)) return;

      const { id } = req.params;
      const account = await gitHubAccountService.getGitHubAccount(
        id,
        req.user.id
      );

      if (!account) {
        sendError(res, "GitHub account not found", 404);
        return;
      }

      sendSuccess(res, account, "GitHub account retrieved successfully");
    } catch (error: any) {
      console.error("Get GitHub account error:", error);
      sendError(res, error.message || "Failed to retrieve GitHub account", 500);
    }
  }
);

/**
 * @swagger
 * /api/github-accounts/{id}:
 *   put:
 *     summary: Update a GitHub account
 *     tags: [GitHub Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: GitHub account ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nickname:
 *                 type: string
 *                 description: Friendly name for the account
 *               isActive:
 *                 type: boolean
 *                 description: Account active status
 *               setAsDefault:
 *                 type: boolean
 *                 description: Set this account as default
 */
router.put(
  "/:id",
  [
    auth,
    param("id").isMongoId().withMessage("Invalid account ID"),
    body("nickname")
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage("Nickname must be between 1 and 50 characters"),
    body("isActive")
      .optional()
      .isBoolean()
      .withMessage("isActive must be a boolean"),
    body("setAsDefault")
      .optional()
      .isBoolean()
      .withMessage("setAsDefault must be a boolean"),
  ],
  async (req: any, res: Response): Promise<void> => {
    try {
      if (handleValidationErrors(req, res)) return;

      const { id } = req.params;
      const updateData = req.body;

      const account = await gitHubAccountService.updateGitHubAccount(
        id,
        req.user.id,
        updateData
      );

      sendSuccess(res, account, "GitHub account updated successfully");
    } catch (error: any) {
      console.error("Update GitHub account error:", error);

      if (error.message.includes("not found")) {
        sendError(res, error.message, 404);
      } else {
        sendError(res, error.message || "Failed to update GitHub account", 500);
      }
    }
  }
);

/**
 * @swagger
 * /api/github-accounts/{id}/set-default:
 *   post:
 *     summary: Set a GitHub account as default
 *     tags: [GitHub Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: GitHub account ID
 *     responses:
 *       200:
 *         description: Account set as default successfully
 *       404:
 *         description: GitHub account not found
 */
router.post(
  "/:id/set-default",
  [auth, param("id").isMongoId().withMessage("Invalid account ID")],
  async (req: any, res: Response): Promise<void> => {
    try {
      if (handleValidationErrors(req, res)) return;

      const { id } = req.params;
      const account = await gitHubAccountService.setDefaultAccount(
        id,
        req.user.id
      );

      sendSuccess(res, account, "Default GitHub account updated successfully");
    } catch (error: any) {
      console.error("Set default GitHub account error:", error);

      if (error.message.includes("not found")) {
        sendError(res, error.message, 404);
      } else {
        sendError(
          res,
          error.message || "Failed to set default GitHub account",
          500
        );
      }
    }
  }
);

/**
 * @swagger
 * /api/github-accounts/{id}:
 *   delete:
 *     summary: Delete a GitHub account
 *     tags: [GitHub Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: GitHub account ID
 *     responses:
 *       200:
 *         description: GitHub account deleted successfully
 *       404:
 *         description: GitHub account not found
 *       400:
 *         description: Cannot delete the last account
 */
router.delete(
  "/:id",
  [auth, param("id").isMongoId().withMessage("Invalid account ID")],
  async (req: any, res: Response): Promise<void> => {
    try {
      if (handleValidationErrors(req, res)) return;

      const { id } = req.params;
      await gitHubAccountService.deleteGitHubAccount(id, req.user.id);

      sendSuccess(res, { id }, "GitHub account deleted successfully");
    } catch (error: any) {
      console.error("Delete GitHub account error:", error);

      if (error.message.includes("not found")) {
        sendError(res, error.message, 404);
      } else if (error.message.includes("Cannot delete")) {
        sendError(res, error.message, 400);
      } else {
        sendError(res, error.message || "Failed to delete GitHub account", 500);
      }
    }
  }
);

/**
 * @swagger
 * /api/github-accounts/validate-all:
 *   post:
 *     summary: Validate all GitHub accounts for the authenticated user
 *     tags: [GitHub Accounts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All accounts validated successfully
 */
router.post(
  "/validate-all",
  auth,
  async (req: any, res: Response): Promise<void> => {
    try {
      await gitHubAccountService.validateAllUserAccounts(req.user.id);
      sendSuccess(res, {}, "All GitHub accounts validated successfully");
    } catch (error: any) {
      console.error("Validate all GitHub accounts error:", error);
      sendError(
        res,
        error.message || "Failed to validate GitHub accounts",
        500
      );
    }
  }
);

export default router;
