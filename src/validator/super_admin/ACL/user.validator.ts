import { body } from "express-validator";

export const createUserValidator = [
  body("name")
    .exists()
    .withMessage("User name is required")
    .notEmpty()
    .withMessage("User name cannot be empty")
    .isString()
    .withMessage("User name must be a string"),

  body("email")
    .exists()
    .withMessage("Email is required")
    .notEmpty()
    .withMessage("Email cannot be empty")
    .isEmail()
    .withMessage("Email must be a valid email address"),

  body("password")
    .exists()
    .withMessage("Password is required")
    .notEmpty()
    .withMessage("Password cannot be empty")
    .isString()
    .withMessage("Password must be a string"),

  body("roles")
    .exists()
    .withMessage("Roles are required")
    .isArray({ min: 1 })
    .withMessage("Roles must be a non-empty array"),
  body("designation")
    .exists()
    .withMessage("Designation is required")
    .notEmpty()
    .withMessage("Designation cannot be empty")
    .isString()
    .withMessage("Designation must be a string"),

  body("departmentID")
    .optional()

    .notEmpty()
    .withMessage("Department ID cannot be empty")
    .isNumeric()
    .withMessage("Department ID must be a number"),

  body("UnitId")
    .optional()
    .notEmpty()
    .withMessage("Unit ID cannot be empty")
    .isNumeric()
    .withMessage("Unit ID must be a number"),

  body("phone")
    .optional()
    .notEmpty()
    .withMessage("Phone number cannot be empty")
    .isNumeric()
    .withMessage("Phone number must be a number")
    .isLength({ min: 10, max: 15 })
    .withMessage("Phone number must be between 10 and 15 digits"),
];


export const updateUserValidator = [
  body("name")
    .optional()
    .notEmpty()
    .withMessage("User name cannot be empty")
    .isString()
    .withMessage("User name must be a string"),

  body("email")
    .optional()
    .notEmpty()
    .withMessage("Email cannot be empty")
    .isEmail()
    .withMessage("Email must be a valid email address"),

  body("password")
    .optional()
    .notEmpty()
    .withMessage("Password cannot be empty")
    .isString()
    .withMessage("Password must be a string"),

  body("roles")
    .optional()
    .isArray({ min: 1 })
    .withMessage("Roles must be a non-empty array"),
];