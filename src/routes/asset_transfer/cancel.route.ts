import { Router } from "express";
import { cancelTransfer } from "@controllers/asset_transfer/cancel_transfer.controller";
import { hasPermission } from "@middlewares/permission.middleware";

export const cancelRouter = Router();

cancelRouter.put(
  "/:transferId",
  hasPermission("update-transfer"),
  cancelTransfer
);
