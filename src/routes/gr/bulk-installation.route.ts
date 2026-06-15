import {
  downloadSampleInstallationXL,
  readXlsx,
  installSoftWareToProducts,
} from "@controllers/gr/installationbulkservice.controller";
import { Router } from "express";
import { hasPermission } from "@src/middleware/permission.middleware";
import { upload } from "@utils/multer";

export const bulkInstallationRouter = Router();

bulkInstallationRouter.get(
  "/download/sample",
  hasPermission("read-installation"),
  downloadSampleInstallationXL
);

bulkInstallationRouter.post(
  "/upload",
  hasPermission("create-installation"),
  upload.single("file"),
  readXlsx
);

bulkInstallationRouter.post(
  "/install",
  hasPermission("create-installation"),
  installSoftWareToProducts
);
