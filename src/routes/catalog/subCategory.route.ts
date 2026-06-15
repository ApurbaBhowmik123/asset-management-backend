import { Router } from "express";
import {
  getSubcategories,
  getSubCategoryById,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  updateSubcategoryStatus,
} from "@controllers/catalog/subcategory.controller";
import { hasPermission } from "@src/middleware/permission.middleware";
export const SubCategoryRouter = Router();
import { paginationValidator } from "@validators/pagination.validator";
import { validate } from "@middlewares/validate.midlleware";
import {
  createSubcategoryValidator,
  updateSubcategoryValidator,
} from "@validators/catalog/subcategory.validator";

SubCategoryRouter.get(
  "/",
  hasPermission("read-subcategories"),
  paginationValidator([
    "createdAt",
    "updatedAt",
    "name",
    "description",
    "fieldType",
  ]),
  validate,
  getSubcategories
);

SubCategoryRouter.get(
  "/:id",
  hasPermission("read-subcategories"),
  validate,
  getSubCategoryById
);

SubCategoryRouter.post(
  "/",
  hasPermission("create-subcategories"),
  createSubcategoryValidator,
  validate,
  createSubcategory
);

SubCategoryRouter.put(
  "/:subcategoryId",
  hasPermission("update-subcategories"),
  updateSubcategoryValidator,
  validate,
  updateSubcategory
);

SubCategoryRouter.delete(
  "/:id",
  hasPermission("delete-subcategories"),
  deleteSubcategory
);

SubCategoryRouter.patch(
  "/:id/status",
  hasPermission("update-subcategories"),
  validate,
  updateSubcategoryStatus
);
