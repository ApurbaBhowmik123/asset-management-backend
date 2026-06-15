import { Router } from "express";
import { hasPermission } from "../../../middleware/permission.middleware";
import {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
} from "../../../controller/super_admin/ACL/role.controller";
import { validate } from "../../../middleware/validate.midlleware";
import {
  createRoleValidator,
  updateRoleValidator,
} from "../../../validator/super_admin/ACL/role.validator";
import { paginationValidator } from "../../../validator/pagination.validator";

export const roleRoute = Router();

roleRoute.get("/", hasPermission("read-roles"), paginationValidator(['name', 'slug', 'createdAt', 'updatedAt']), validate, getAllRoles);

roleRoute.get("/:id", hasPermission("read-roles"), getRoleById);

roleRoute.post(
  "/",
  hasPermission("create-roles"),
  createRoleValidator,
  validate,
  createRole
);

roleRoute.put(
  "/:id",
  hasPermission("update-roles"),
  updateRoleValidator,
  validate,
  updateRole
);

roleRoute.delete("/:id", hasPermission("delete-roles"), deleteRole);
