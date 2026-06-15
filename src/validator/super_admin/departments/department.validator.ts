import { body } from "express-validator";

export const validateCreateDepartment = [
  body("*.name")
    .trim()
    .notEmpty()
    .withMessage("Department Name is required"),

  body("*.description")
    .optional()
    .isString()
    .withMessage("Description must be a string"),

  body("*.status")
    .optional()
    .isBoolean()
    .withMessage("Status must be a boolean"),
];


export const validateUpdateDepartment = [
  body("name")
    .optional()
    .trim()
    .notEmpty().withMessage("Department Name cannot be empty"),

  body("description")
    .optional()
    .isString().withMessage("Description must be a string"),

  body("status")
    .optional()
    .isBoolean().withMessage("Status must be a boolean"),
];
