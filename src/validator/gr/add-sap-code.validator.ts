import { body, param } from "express-validator";

export const validateAddSapCode = [
  param("inventoryProductDetailId")
    .isString()
    .withMessage("Invalid inventory product detail ID"),
  body("sapCode").isString().withMessage("SAP code must be a string"),
];
