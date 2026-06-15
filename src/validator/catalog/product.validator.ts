import { body, param } from "express-validator";

export const createProductValidator = [
  body("brandId")
    .isInt({ gt: 0 })
    .withMessage("brandId must be a positive integer"),

  body("categoryId")
    .isInt({ gt: 0 })
    .withMessage("categoryId must be a positive integer"),

  // body("subcategoryId")
  //   .isInt({ gt: 0 })
  //   .withMessage("subcategoryId must be a positive integer"),

  body("name").isString().trim().notEmpty().withMessage("name is required"),

  // body("msq").isString().trim().notEmpty().withMessage("msq is required"),


  // body("lifeCycleAging")
  //   .optional()
  //   .isInt({ min: 0 })
  //   .withMessage("lifeCycleAging must be a non-negative integer"),

  body("description")
    .optional({ nullable: true })
    .isString()
    .withMessage("description must be a string"),

  body("specValues").isArray().withMessage("specValues must be an array"),

  body("specValues.*.specFieldId")
    .isInt({ gt: 0 })
    .withMessage("Each specFieldId must be a positive integer"),

  body("specValues.*.value")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Each spec value must be a non-empty string"),
];

export const updateProductValidator = [
  param("id").isInt().withMessage("id must be a valid integer"),
  body("brandId")
    .optional()
    .isInt({ gt: 0 })
    .withMessage("brandId must be a positive integer"),
  body("categoryId")
    .optional()
    .isInt({ gt: 0 })
    .withMessage("categoryId must be a positive integer"),
  // body("subcategoryId")
  //   .optional()
  //   .isInt({ gt: 0 })
  //   .withMessage("subcategoryId must be a positive integer"),
  body("name")
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage("name is required"),
  body("msq")
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage("msq is required"),


  body("description")
    .optional({ nullable: true })
    .isString()
    .withMessage("description must be a string"),

  body("lifeCycleAging")
    .optional()
    .isInt({ min: 0 })
    .withMessage("lifeCycleAging must be a non-negative integer"),

  body("specValues")
    .optional()
    .isArray()
    .withMessage("specValues must be an array"),
  body("specValues.*.specFieldId")
    .optional()
    .isInt({ gt: 0 })
    .withMessage("Each specFieldId must be a positive integer"),
  body("specValues.*.value")
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Each spec value must be a non-empty string"),
];
