import { Router } from "express";
import {
  getSpecFields,
  createSpecField,
  updateSpecField,
  deleteSpecField,
  updateSpecFieldStatus,
  getSpecFieldById,
  getSpecFieldOptionBySpecField,
} from "@controllers/catalog/specfield.controller";
import { hasPermission } from "@middlewares/permission.middleware";
import {
  createSpecFieldValidator,
  updateSpecFieldValidator,
} from "@validators/catalog/specfield.validator";
import { validate } from "@middlewares/validate.midlleware";
export const SpecFieldRouter = Router();

SpecFieldRouter.get("/", 
  hasPermission("read-spec-fields"),
   getSpecFields);
SpecFieldRouter.get(
  "/:id",
  hasPermission("read-spec-fields"),
  getSpecFieldById
);
SpecFieldRouter.post(
  "/",
  hasPermission("create-spec-fields"),
  createSpecFieldValidator,
  validate,
  createSpecField
);

SpecFieldRouter.put(
  "/:id",
  hasPermission("update-spec-fields"),
  updateSpecFieldValidator,
  validate,
  updateSpecField
);

SpecFieldRouter.delete(
  "/:id",
  hasPermission("delete-spec-fields"),
  deleteSpecField
);

SpecFieldRouter.patch(
  "/:id/status",
  hasPermission("update-spec-fields"),
  updateSpecFieldStatus
);

SpecFieldRouter.get(
  "/spec/options/:specfieldId",
  hasPermission("read-spec-fields"),
  getSpecFieldOptionBySpecField
);