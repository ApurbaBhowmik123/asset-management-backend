import { Router } from "express";
import { hasPermission } from "@src/middleware/permission.middleware";
import {
  eWasteRequest,
  approveEwaste,
} from "@controllers/product_request/e_waste.controller";
import { upload } from "@src/utils/multer";
import { parseJsonFields } from "@middlewares/parsedJSON.middleware";

export const eWasteRouter = Router();

eWasteRouter.get("/list", hasPermission("read-e-waste"), eWasteRequest);
eWasteRouter.post(
  "/approve",
  hasPermission("update-e-waste"),
  upload.single("signaturedFile"),
  parseJsonFields(["ProductRequestIds"]),
  approveEwaste
);
