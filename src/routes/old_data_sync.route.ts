import {
  oldDataSync,
  AssetImportService,
  downloadSampleExcel,
} from "@controllers/old_data_sync/old_sync_modified.controller";
import { Router } from "express";
import { hasPermission } from "@src/middleware/permission.middleware";
import { authCheck } from "@src/middleware/auth.middleware";
import { upload } from "@src/utils/multer";
export const oldSyncRouter = Router();
oldSyncRouter.post(
  "/old-data-sync",
  authCheck,
  hasPermission("old-data-sync-module"),
  upload.single("file"),
  oldDataSync
);

const assetImportService = new AssetImportService();
oldSyncRouter.post(
  "/old-data-import",
  authCheck,
  hasPermission("old-data-sync-module"),
  (req, res) => assetImportService.bulkImportAssets(req, res)
);

oldSyncRouter.get(
  "/download-sample-excel",
  authCheck,
  hasPermission("old-data-sync-module"),
  downloadSampleExcel
);
