import { Router } from "express";
import {
  getCategories,
  getSubCategoryByCategoryId,
  getSpecfieldBySubCategoryId,
  getSpecfieldByCategoryId,
} from "@controllers/catalog/catalog.controller";
import { hasPermission } from "@middlewares/permission.middleware";
const router = Router();

router.get("/categories",hasPermission('create-product'), getCategories);
router.get("/categories/:categoryId/subcategories",hasPermission('create-product'), getSubCategoryByCategoryId);
router.get("/subcategories/:subCategoryId/specfields",hasPermission('create-product'), getSpecfieldBySubCategoryId);
router.get("/categories/:categoryId/specfields",hasPermission('create-product'), getSpecfieldByCategoryId);

export default router;