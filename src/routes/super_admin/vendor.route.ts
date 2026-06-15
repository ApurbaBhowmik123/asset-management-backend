import { Router } from "express";
import {
    getVendors,
    getVendorById,
    createVendor,
    updateVendor,
    deleteVendor

} from "../../controller/super_admin/vendor.controller";

import { hasPermission } from "../../middleware/permission.middleware";
import { validate } from "../../middleware/validate.midlleware";
import {
  validateCreateVendor,
  validateUpdateVendor
} from "@validators/super_admin/vendors/vendor.validator";

export const vendorRouter = Router();



vendorRouter.get(
  "/",
  hasPermission("read-vendors"),
  getVendors
);


vendorRouter.get(
  "/find/:id",
  hasPermission("read-vendors"),
  getVendorById
);


vendorRouter.post(
  "/create",
  hasPermission("create-vendors"),
  validateCreateVendor,
  validate,
  createVendor
);


vendorRouter.put(
  "/update/:id",
  hasPermission("update-vendors"),
  validateUpdateVendor,
  validate,
  updateVendor
);


vendorRouter.delete(
  "/delete/:id",
  hasPermission("delete-vendors"),
  deleteVendor
);
