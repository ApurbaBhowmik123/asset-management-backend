import { Router } from "express";
import {
  createGr,
  getGr,
  getGrById,
  updateGRStatus,
  updateGr,
  addSapCode,
  deleteGr,
  tagGr,
  getGrSummary,
  tagItem,
  bulkTagItem,
} from "@controllers/gr/gr.controller";
import { hasPermission } from "@middlewares/permission.middleware";
import {
  validateCreateGr,
  validateUpdateGr,
} from "@validators/gr/gr.validator";
import { validateAddSapCode } from "@validators/gr/add-sap-code.validator";
import { validate } from "@middlewares/validate.midlleware";
import { upload } from "@utils/multer";
import { parseJsonFields } from "@middlewares/parsedJSON.middleware";
import { paginationValidator } from "@validators/pagination.validator";

export const grRouter = Router();

grRouter.post(
  "/",
  hasPermission("create-gr"),
  upload.fields([
    { name: "warrantyFiles", maxCount: 100 },
    { name: "invoiceFiles", maxCount: 100 },
    { name: "invoiceFile", maxCount: 1 }
  ]),
  parseJsonFields(["products"]),
  validateCreateGr,
  validate,
  createGr
);

grRouter.get(
  "/",
  hasPermission("read-gr"),
  paginationValidator(["sapId", "sapDate", "grDate", "createdAt", "updatedAt"]),
  validate,
  getGr
);

grRouter.get("/summary", hasPermission("read-gr"), getGrSummary);
grRouter.get("/:grId", hasPermission("read-gr"), validate, getGrById);
grRouter.patch(
  "/:grId/status",
  hasPermission("update-gr"),
  validate,
  updateGRStatus
);

grRouter.put(
  "/:grId",
  hasPermission("update-gr"),
  validateUpdateGr,
  validate,
  updateGr
);

grRouter.put(
  "/:grId/tag",
  hasPermission("update-gr"),
  validate,
  tagGr
);

grRouter.delete("/:grId", hasPermission("delete-gr"), validate, deleteGr);

grRouter.put(
  "/add-sap-code/:inventoryProductDetailId",
  hasPermission("update-gr"),
  validateAddSapCode,
  validate,
  addSapCode
);

grRouter.post(
  "/tag-item",
  hasPermission("update-gr"),
  validate,
  tagItem
);

grRouter.post(
  "/bulk-tag-item",
  hasPermission("update-gr"),
  validate,
  bulkTagItem
);
