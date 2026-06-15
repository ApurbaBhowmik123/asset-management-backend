import { Router } from "express";
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  updateCategoryStatus
} from "@controllers/catalog/category.controller";
import { paginationValidator } from "@validators/pagination.validator";
import { validate } from "@middlewares/validate.midlleware";
import { hasPermission } from "@middlewares/permission.middleware";
import {
  createCategoryValidator,
  updateCategoryValidator,
} from "@validators/catalog/category.validator";

export const categoryRouter = Router();

categoryRouter.get(
  "/",
  hasPermission("read-categories"),
  paginationValidator([
    "name",
    "uuid",
    "description",
    "createdAt",
    "updatedAt",
  ]),
  validate,
  getAllCategories
);

categoryRouter.get("/:id", hasPermission("read-categories"), getCategoryById);

categoryRouter.post(
  "/",
  hasPermission("create-categories"),
  createCategoryValidator,
  validate,
  createCategory
);

categoryRouter.put(
  "/:id",
  hasPermission("update-categories"),
  updateCategoryValidator,
  validate,
  updateCategory
);

categoryRouter.delete(
  "/:id",
  hasPermission("delete-categories"),
  deleteCategory
);

categoryRouter.patch(
  "/:id/status",
  hasPermission("update-categories"),
  updateCategoryStatus
);