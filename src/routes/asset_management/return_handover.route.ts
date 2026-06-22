import { Router } from "express";
import { hasPermission } from "@middlewares/permission.middleware";
import { returnHandoverAsset } from "@controllers/asset_management/return_handover.controller";
import { handoverValidator } from "@validators/asset/handover.validator";
import { validate } from "@middlewares/validate.midlleware";
import { upload } from "@src/utils/multer";
import { parseJsonFields } from "@middlewares/parsedJSON.middleware";
const returnhandoverrouter = Router();

returnhandoverrouter.post(
  "/:id",
  hasPermission("update-asset"),
  upload.single("signaturedFile"),
  parseJsonFields(["inventoryIds"]),
  handoverValidator,
  validate,
  returnHandoverAsset
);

export default returnhandoverrouter;
