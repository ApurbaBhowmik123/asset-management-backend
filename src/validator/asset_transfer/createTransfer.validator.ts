import { body } from "express-validator";

export const validateCreateTransfer = [
  body("issuerId")
    .isInt({ gt: 0 })
    .withMessage("issuerId must be a positive integer"),

  body("approverId")
    .isInt({ gt: 0 })
    .withMessage("approverId must be a positive integer"),

  body("transferDate")
    .isISO8601()
    .withMessage("transferDate must be a valid ISO date string"),

  body("sourceUnitId")
    .isInt({ gt: 0 })
    .withMessage("sourceUnitId must be a positive integer"),

  body("sourceUnitLocationId")
    .isInt({ gt: 0 })
    .withMessage("sourceUnitLocationId must be a positive integer"),

  body("destinationUnitId")
    .isInt({ gt: 0 })
    .withMessage("destinationUnitId must be a positive integer"),

  body("destinationUnitLocationId")
    .isInt({ gt: 0 })
    .withMessage("destinationUnitLocationId must be a positive integer"),

  body("inventoryProductDetailIds")
    .isArray({ min: 1 })
    .withMessage("inventoryProductDetailIds must be a non-empty array"),

  body("inventoryProductDetailIds.*")
    .isInt({ gt: 0 })
    .withMessage("Each inventoryProductDetailId must be a positive integer"),

  body("remarks")
    .optional()
    .isString()
    .withMessage("remarks must be a string"),
];
