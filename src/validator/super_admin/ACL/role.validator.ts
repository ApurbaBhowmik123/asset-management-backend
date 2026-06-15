import { body } from "express-validator";


export const createRoleValidator = [
  body("name")
    .exists()
    .withMessage("Role name is required")
    .notEmpty()
    .withMessage("Role name cannot be empty")
    .isString()
    .withMessage("Role name must be a string"),

  body("description")
    .exists()
    .withMessage("Role description is required")
    .notEmpty()
    .withMessage("Role description cannot be empty")
    .isString()
    .withMessage("Role description must be a string"),

  body("permissions")
    .exists()
    .withMessage("Permissions are required")
    .isArray({ min: 1 })
    .withMessage("Permissions must be a non-empty array")

];


export const updateRoleValidator = [
  body("name")
    .optional()
    .notEmpty()
    .withMessage("Role name cannot be empty")
    .isString()
    .withMessage("Role name must be a string"),

  body("description")
    .optional()
    .notEmpty()
    .withMessage("Role description cannot be empty")
    .isString()
    .withMessage("Role description must be a string"),

  body("permissions")
    .optional()
    .isArray({ min: 1 })
    .withMessage("Permissions must be a non-empty array")

];
