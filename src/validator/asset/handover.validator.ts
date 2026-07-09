import { body, param } from "express-validator";

export const handoverValidator = [
  param("id").notEmpty().isString().withMessage("Invalid asset ID"),
  body("inventoryIds").isArray().withMessage("Inventory IDs must be an array"),
];
