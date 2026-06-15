import { Router } from "express";
import { hasPermission } from "@middlewares/permission.middleware";
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserStatus,
} from "@controllers/super_admin/ACL/user.controller";
import { validate } from "@middlewares/validate.midlleware";
import {
  createUserValidator,
  updateUserValidator,
} from "@validators/super_admin/ACL/user.validator";
import { paginationValidator } from "@validators/pagination.validator";

export const userRoute = Router();

userRoute.get("/", hasPermission("read-users"), 
                   paginationValidator(['name', 'email', 'designation', 'unit', 'department', 'createdAt', 'updatedAt']), validate, getAllUsers);

userRoute.get("/:id", hasPermission("read-users"), getUserById);

userRoute.post(
  "/",
  hasPermission("create-users"),
  createUserValidator,
  validate,
  createUser
);

userRoute.put(
  "/:id",
  hasPermission("update-users"),
  updateUserValidator,
  validate,
  updateUser
);

userRoute.put("/status/:id", hasPermission("update-users"), updateUserStatus);
