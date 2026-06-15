import { Router } from "express";
import {
  createDepartment,
  getDepartments,
  updateDepartment,
  deleteDepartment,
  getDepartmentById,
} from "../../controller/super_admin/department.controller";

import { hasPermission } from "../../middleware/permission.middleware";
import { validate } from "../../middleware/validate.midlleware";
import {
  validateCreateDepartment,
  validateUpdateDepartment
} from "../../validator/super_admin/departments/department.validator";

export const departmentRouter = Router();



departmentRouter.get(
  "/",
  hasPermission("read-departments"),
  getDepartments
);


departmentRouter.get(
  "/find/:id",
  hasPermission("read-departments"),
  getDepartmentById
);


departmentRouter.post(
  "/create",
  hasPermission("create-departments"),
  validateCreateDepartment,
  validate,
  createDepartment
);


departmentRouter.put(
  "/update/:id",
  hasPermission("update-departments"),
  validateUpdateDepartment,
  validate,
  updateDepartment
);


departmentRouter.delete(
  "/delete/:id",
  hasPermission("delete-departments"),
  deleteDepartment
);
