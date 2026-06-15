import { body,param } from "express-validator";

export const validateCreateBrand = [
  body("*.name")
    .notEmpty()
    .withMessage("Brand name is required"),

  body("*.status")
    .optional()
];


export const validateUpdateBrand = [
  param("id")
    .notEmpty()
    .withMessage("Brand ID param is required"),

  body("name")
    .optional()
    .isString()
    .withMessage("Brand name must be a string"),

 
  body("status")
    .optional(),
];
