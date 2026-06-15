import { Router } from "express";
import { getMyAccess, reloadSuperAdminAccess } from "../controller/access.controller";
import { authCheck } from "../middleware/auth.middleware";
import { hasPermission } from "../middleware/permission.middleware";
export const accessRouter = Router();

accessRouter.get("/get-my-access", authCheck, getMyAccess);
accessRouter.get("/reload-super-admin-access", authCheck, hasPermission("access-module"), reloadSuperAdminAccess);
