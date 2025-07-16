import { Request, Response, NextFunction } from "express";
import { body, query, param, validationResult } from "express-validator";

// Validation error handler
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    });
    return;
  }
  next();
};

// Auth validation rules
export const validateRegister = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  body("firstName")
    .trim()
    .isLength({ min: 1 })
    .withMessage("First name is required"),
  body("lastName")
    .trim()
    .isLength({ min: 1 })
    .withMessage("Last name is required"),
  handleValidationErrors,
];

export const validateLogin = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("password").isLength({ min: 1 }).withMessage("Password is required"),
  handleValidationErrors,
];

// Node validation rules
export const validateNode = [
  body("name")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Node name must be between 1 and 100 characters"),
  body("type")
    .isIn(["input", "output", "transformation", "api", "database", "custom"])
    .withMessage("Invalid node type"),
  body("category")
    .isIn(["data", "api", "transformation", "utility", "custom"])
    .withMessage("Invalid node category"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),
  handleValidationErrors,
];

// Project validation rules
export const validateProject = [
  body("name")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Project name must be between 1 and 100 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Description cannot exceed 1000 characters"),
  body("status")
    .optional()
    .isIn(["draft", "active", "completed", "archived"])
    .withMessage("Invalid project status"),
  handleValidationErrors,
];

// Template validation rules
export const validateTemplate = [
  body("name")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Template name must be between 1 and 100 characters"),
  body("category")
    .isIn(["workflow", "component", "integration", "custom"])
    .withMessage("Invalid template category"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),
  handleValidationErrors,
];

// Pagination validation
export const validatePagination = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("search")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Search term cannot exceed 100 characters"),
  handleValidationErrors,
];

// ID validation
export const validateObjectId = [
  param("id").isMongoId().withMessage("Invalid ID format"),
  handleValidationErrors,
];
