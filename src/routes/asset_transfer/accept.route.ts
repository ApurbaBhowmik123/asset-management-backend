import { Router } from "express";
export const acceptRouter = Router();
import { hasPermission } from "@middlewares/permission.middleware";
import {
  allProductlist,
  transferDetails,
} from "@controllers/asset_transfer/accept.controller";
import { acceptTransfer } from "@controllers/asset_transfer/accept_transfer.controller";
import { acceptTransferValidator } from "@src/validator/asset_transfer/acceptTransfer.validator";
import { validate } from "@middlewares/validate.midlleware";

acceptRouter.get("/list", hasPermission("read-transfer"), allProductlist);

acceptRouter.get(
  "/details/:transferId",
  hasPermission("read-transfer"),
  transferDetails
);

acceptRouter.put(
  "/:transferId",
  hasPermission("update-transfer"),
  acceptTransferValidator,
  validate,
  acceptTransfer
);
