import { Router } from "express";
import { hasPermission } from "@middlewares/permission.middleware";
import { handoverAsset } from "@controllers/asset_management/handover.controller";
import { handoverValidator } from "@validators/asset/handover.validator";
import { validate } from "@middlewares/validate.midlleware";
import { upload } from "@src/utils/multer";
import { parseJsonFields } from "@middlewares/parsedJSON.middleware";
const handoverrouter = Router();

handoverrouter.post(
  "/:id",
  hasPermission("update-asset"),
  upload.single("signaturedFile"),
  parseJsonFields(["inventoryIds"]),
  handoverValidator,
  validate,
  handoverAsset
);

export default handoverrouter;
