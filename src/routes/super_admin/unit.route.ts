import { Router } from "express";
import {
  getUnits,
  createUnit,
  getUnitById,
  updateUnit,
  deleteUnit,
} from "../../controller/super_admin/unit.controller";

import { hasPermission } from "../../middleware/permission.middleware";
import { validate } from "../../middleware/validate.midlleware";
import {
  validateCreateUnit,
  validateUpdateUnit,
} from "../../validator/super_admin/units/unit.validator";

export const unitRouter = Router();


unitRouter.get(
  "/",
  hasPermission("read-units"),
  getUnits
);


unitRouter.get(
  "/find/:id",
  hasPermission("read-units"),
  getUnitById
);


unitRouter.post(
  "/create",
  hasPermission("create-units"),
  validateCreateUnit,
  validate,
  createUnit
);


unitRouter.put(
  "/update/:id",
  hasPermission("update-units"),
  validateUpdateUnit,
  validate,
  updateUnit
);


unitRouter.delete(
  "/delete/:id",
  hasPermission("delete-units"),
  deleteUnit
);
