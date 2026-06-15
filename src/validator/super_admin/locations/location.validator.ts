import { body } from "express-validator";

export const validateCreateLocation = [
  body("name").trim().notEmpty().withMessage("Location Name is required"),
  body("address").optional(),
  body("description").optional(),
];

export const validateUpdateLocation = [
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Location Name cannot be empty"),

  body("address").optional(),
  body("description").optional(),
];
