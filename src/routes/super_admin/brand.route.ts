import { Router } from "express";
import {
 getBrands,
 getBrandById,
 createBrand,
 updateBrand,
 deleteBrand
} from "../../controller/super_admin/brand.controller";

import { hasPermission } from "../../middleware/permission.middleware";
import { validate } from "../../middleware/validate.midlleware";
import {
  validateCreateBrand,
  validateUpdateBrand
} from "../../validator/super_admin/brands/brand.validator";

export const brandRouter = Router();



brandRouter.get(
  "/",
  hasPermission("read-brands"),
  getBrands
);


brandRouter.get(
  "/find/:id",
  hasPermission("read-brands"),
  getBrandById
);


brandRouter.post(
  "/create",
  hasPermission("create-brands"),
  validateCreateBrand,
  validate,
  createBrand
);


brandRouter.put(
  "/update/:id",
  hasPermission("update-brands"),
  validateUpdateBrand,
  validate,
  updateBrand
);


brandRouter.delete(
  "/delete/:id",
  hasPermission("delete-brands"),
  deleteBrand
);
