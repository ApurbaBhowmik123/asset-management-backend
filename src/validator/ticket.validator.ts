import { body } from "express-validator";

export const validateCreateTicket = [
 body("subjectLine").optional(),
  body("priority").optional(),
  body("attachment").optional(),
  body("assetIds").optional(),
];

export const validateUpdateTicket = [
  body("subjectLine").optional(),
  body("supportEngineerId").optional(),

  body("priority").optional(),

  body("status").optional(),

  body("attachment").optional(),

  body("assetIds").optional(),
];
