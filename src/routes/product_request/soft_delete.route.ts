import { Router } from "express";
import {
  updateAssetStatus,
  deletedAssetList,
} from "@controllers/product_request/soft_delete.controller";
import { hasPermission } from "@middlewares/permission.middleware";

export const softDeleteRouter = Router();

softDeleteRouter.put(
  "/update/:id",
  hasPermission("create-soft-delete"),
  updateAssetStatus
);
softDeleteRouter.get("/", hasPermission("read-soft-delete"), deletedAssetList);
