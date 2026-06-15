import { body, param } from "express-validator";

export const acceptTransferValidator = [
  param("transferId").isString().withMessage("Invalid transfer ID"),
  body("approverId").isInt().withMessage("Invalid approver ID"),
  body("issuerId").isInt().withMessage("Invalid issuer ID"),
  body("approveDate").isISO8601().withMessage("Invalid approve date"),
];
