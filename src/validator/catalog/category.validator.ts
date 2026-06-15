import { body } from "express-validator";

export const createCategoryValidator = [
  body("name").notEmpty().withMessage("Name is required"),
  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string"),
];


export const updateCategoryValidator = [
  body("name").optional().notEmpty().withMessage("Name cannot be empty"),
  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string"),
];