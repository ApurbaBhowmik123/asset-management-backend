import { body } from "express-validator";

export const unassignAssetValidator = [
  body("inventoryProductIds")
    .isArray()
    .withMessage("Inventory product IDs must be an array"),
  body("assignmentIds")
    .isArray()
    .withMessage("Assignment IDs must be an array"),
  body("approvedBy")
    .isNumeric()
    .withMessage("Approved by must be a valid user ID"),
  body("approvedDate")
    .isISO8601()
    .withMessage("Approved date must be a valid date"),
  body("remarks").optional().isString().withMessage("Remarks must be a string"),
];
