import Router from "express";
import { softwareRouter } from "./software.route";
import { hasPermission } from "@middlewares/permission.middleware";
import { authCheck } from "@middlewares/auth.middleware";
export const softwareRoute = Router();

softwareRoute.use(authCheck, hasPermission("software-module"), softwareRouter);
