import Router from "express";
import {
  getAssignedAssetsByLocations,
  getAssignedAssetsByUser,
  unassignAsset,
} from "@controllers/asset_management/unassign.controller";
import { hasPermission } from "@middlewares/permission.middleware";
import { unassignAssetValidator } from "@validators/asset/unassign.validator";
import { validate } from "@middlewares/validate.midlleware";

export const unassignRouter = Router();

unassignRouter.get(
  "/:userId",
  getAssignedAssetsByUser
);
unassignRouter.get(
  "/location/:locationId",
  getAssignedAssetsByLocations
);
unassignRouter.post(
  "/",
  hasPermission("unassign-asset"),
  unassignAssetValidator,
  validate,
  unassignAsset
);
