import { Router } from "express";
import { hasPermission } from "@middlewares/permission.middleware";
import { createTransfer, fetTransferableProductlist } from "@src/controller/asset_transfer/transfer.controller";
import {validateCreateTransfer} from "@validators/asset_transfer/createTransfer.validator"
import { validate } from "@middlewares/validate.midlleware";
export const transferRouter = Router();

transferRouter.post(
  "/create",
  hasPermission("create-transfer"),
  validateCreateTransfer,
  validate,
  createTransfer
);

transferRouter.get(
  "/list",
  hasPermission("read-transfer"),
  fetTransferableProductlist
);  