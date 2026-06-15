import { body, param } from "express-validator";
export const createSpecFieldValidator = [
  body("name")
    .exists()
    .withMessage("Name is required")
    .isString()
    .withMessage("Name must be a string"),
  body("fieldType")
    .exists()
    .withMessage("Field type is required")
    .isString()
    .withMessage("Field type must be a string"),
  body("unit")
    .optional()
    .isString()
    .withMessage("Unit must be a string if provided"),
  body("isRequired")
    .optional()
    .isBoolean()
    .withMessage("IsRequired must be a boolean if provided"),
  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string if provided"),
  body("status")
    .optional()
    .isBoolean()
    .withMessage("Status must be a boolean if provided"),
  body("options")
    .optional()
    .isArray({ min: 1 })
    .withMessage("Options must be an array with at least one item"),
];


export const updateSpecFieldValidator = [
  param("id")
    .exists()
    .withMessage("ID is required")
    .isInt()
    .withMessage("ID must be an integer"),
  body("name")
    .optional()
    .isString()
    .withMessage("Name must be a string if provided"),
  body("fieldType")
    .optional()
    .isString()
    .withMessage("Field type must be a string if provided"),
  body("unit")
    .optional()
    .isString()
    .withMessage("Unit must be a string if provided"),
  body("isRequired")
    .optional()
    .isBoolean()
    .withMessage("IsRequired must be a boolean if provided"),
  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string if provided"),
  body("status")
    .optional()
    .isBoolean()
    .withMessage("Status must be a boolean if provided"),
  body("options")
    .optional()
    .isArray({ min: 1 })
    .withMessage("Options must be an array with at least one item"),
];