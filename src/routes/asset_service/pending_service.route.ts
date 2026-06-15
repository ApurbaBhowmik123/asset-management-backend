import { Router } from "express";
import { getPendingAssetsService } from "@controllers/asset_service/pending_asset_service.controller";
import { hasPermission } from "@src/middleware/permission.middleware";

export const pendingServiceRouter = Router();

pendingServiceRouter.get(
  "/list",
  hasPermission("read-services"),
  getPendingAssetsService
);
