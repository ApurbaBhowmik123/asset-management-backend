import { Router } from "express";
export const mailConfigRouter = Router();
import {
  getMailConfigs,
  getMailConfigById,
  createMailConfig,
  getSuperAdmins,
  getUnitAdminsByUnitId,
  updateMailConfig,
  deleteMailConfig,
} from "../../controller/super_admin/mail-config.controller";
import { hasPermission } from "@middlewares/permission.middleware";
import { createMailConfigValidator } from "@validators/super_admin/mail-config/createMailConfig.validator";
import { validate } from "@middlewares/validate.midlleware";

mailConfigRouter.get(
  "/list",
  hasPermission("read-mail-configuration"),
  getMailConfigs
);
mailConfigRouter.get(
  "/details/:id",
  hasPermission("read-mail-configuration"),
  getMailConfigById
);
mailConfigRouter.post(
  "/create",
  hasPermission("create-mail-configuration"),
  createMailConfigValidator,
  validate,
  createMailConfig
);
mailConfigRouter.get(
  "/super-admins",
  hasPermission("create-mail-configuration"),
  getSuperAdmins
);
mailConfigRouter.get(
  "/unit-admins/:unitId",
  hasPermission("create-mail-configuration"),
  getUnitAdminsByUnitId
);

mailConfigRouter.put(
  "/update/:id",
  hasPermission("update-mail-configuration"),
  createMailConfigValidator,
  validate,
  updateMailConfig
);

mailConfigRouter.delete(
  "/delete/:id",
  hasPermission("delete-mail-configuration"),
  deleteMailConfig
);
