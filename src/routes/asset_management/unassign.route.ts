import Router from "express";
import {
  getAssignedAssetsByLocations,
  getAssignedAssetsByUser,
  unassignAsset,
} from "@controllers/asset_management/unassign.controller";
import { hasPermission } from "@middlewares/permission.middleware";
import { unassignAssetValidator } from "@validators/asset/unassign.validator";
import { validate } from "@middlewares/validate.midlleware";
import { upload } from "@src/utils/multer";
import { parseJsonFields } from "@middlewares/parsedJSON.middleware";

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
  upload.single("file"),
  parseJsonFields(["inventoryProductIds", "assignmentIds", "conditions"]),
  unassignAssetValidator,
  validate,
  unassignAsset
);
