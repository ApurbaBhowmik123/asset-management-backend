import { body } from "express-validator";
import { MailActions } from "@src/enum/enum";

export const createMailConfigValidator = [
  body("unitId").isInt().withMessage("Unit ID must be an integer"),
  body("unitAdminId").isInt().withMessage("Unit Admin ID must be an integer"),
  body("action")
    .isString()
    .withMessage("Action must be a string")
    .isIn(Object.values(MailActions))
    .withMessage(
      `Action must be one of the following: ${Object.values(MailActions).join(
        ", "
      )}`
    ),
  body("subject").optional().isString().withMessage("Subject must be a string"),
  body("superAdminId").isInt().withMessage("Super Admin ID must be an integer"),
];
