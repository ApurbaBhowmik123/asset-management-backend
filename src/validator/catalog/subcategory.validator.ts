import { body, param } from "express-validator";

export const createSubcategoryValidator = [
  body("categoryId")
    .isInt({ gt: 0 })
    .withMessage("categoryId must be a positive integer"),

  body("name")
    .isString()
    .notEmpty()
    .withMessage("Subcategory name is required"),

  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string"),
  body("maintainanceFrequency")
    .optional()
    .isInt({ min: 1, max: 36 })
    .withMessage("maintainanceFrequency must be a positive integer"),

  body("specFieldIds")
    .optional()
    .isArray()
    .withMessage("specFieldIds must be an array"),
];

export const updateSubcategoryValidator = [
  param("subcategoryId")
    .isInt({ gt: 0 })
    .withMessage("Valid subcategoryId is required in the URL"),

  body("categoryId")
    .optional()
    .isInt({ gt: 0 })
    .withMessage("categoryId must be a positive integer"),

  body("name")
    .optional()
    .isString()
    .notEmpty()
    .withMessage("name must be a non-empty string"),

  body("description")
    .optional()
    .isString()
    .withMessage("description must be a string"),

  body("status").optional().isBoolean().withMessage("status must be a boolean"),

  body("maintainanceFrequency")
    .optional()
    .isInt({ min: 3, max: 36 })
    .withMessage("maintainanceFrequency must be a positive integer"),
  body("specFieldIds")
    .optional()
    .isArray()
    .withMessage("specFieldIds must be an array"),
];
