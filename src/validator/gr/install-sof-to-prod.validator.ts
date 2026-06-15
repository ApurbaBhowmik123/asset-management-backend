import { body, param } from "express-validator";

export const installSoftwareValidator = [
  param("id").isInt({ gt: 0 }).withMessage("id must be a positive integer"),

  body("softwareIds")
    .optional()
    .isArray()
    .withMessage("softwareIds must be an array"),

  body("softwareIds.*.id")
    .optional()
    .isInt({ gt: 0 })
    .withMessage("Each softwareId must be a positive integer"),

  body("softwareIds.*.value")
    .optional()
    .isString()
    .withMessage("Each software value must be a string"),
];
