import { Router } from "express";
import { getUnit } from "@controllers/gr/unit.controller";
import { hasPermission } from "@middlewares/permission.middleware";
export const unitRouter = Router();
unitRouter.get("/list", hasPermission("create-gr"), getUnit);