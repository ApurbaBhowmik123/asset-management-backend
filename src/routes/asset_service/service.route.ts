import { Router } from "express";
import { hasPermission } from "@middlewares/permission.middleware";
export const serviceRouter = Router();
import {
  getServiceDetails,
  getServices,
} from "@controllers/asset_service/service.controller";
serviceRouter.get("/list", hasPermission("read-services"), getServices);
serviceRouter.get(
  "/details/:id",
  hasPermission("read-services"),
  getServiceDetails
);
