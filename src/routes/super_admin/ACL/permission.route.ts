import { Router } from "express";
import { hasPermission } from "@middlewares/permission.middleware";
import {
  getAllPermissions,
  getPermissionById,
  createPermission,
  updatePermission,
  deletePermission,
  getPerm,
} from "@controllers/super_admin/ACL/permission.controller";
import { validate } from "@middlewares/validate.midlleware";
import { createPermissionValidator } from "@validators/super_admin/ACL/permission.validator";
import { paginationValidator } from "@validators/pagination.validator";
export const permissionRoute = Router();
permissionRoute.get(
  "/",
  hasPermission("read-permissions"),
  paginationValidator(["name", "slug", "createdAt", "updatedAt"]),
  validate,
  getAllPermissions
);

permissionRoute.get(
  "/:id",
  hasPermission("read-permissions"),
  getPermissionById
);

permissionRoute.post(
  "/",
  hasPermission("create-permissions"),
  createPermissionValidator,
  validate,
  createPermission
);

permissionRoute.put(
  "/:id",
  hasPermission("update-permissions"),
  updatePermission
);

permissionRoute.delete(
  "/:id",
  hasPermission("delete-permissions"),
  deletePermission
);

permissionRoute.get("/perm/list", hasPermission("read-permissions"), getPerm);
