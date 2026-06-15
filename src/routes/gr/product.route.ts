import { Router } from "express";
import {
    getCategories,
    getSubCategoryByCategoryId,
    getProductByCategoryId,
    getProductByCatSubCatId,
} from "@controllers/gr/product.controller";
import { hasPermission } from "@middlewares/permission.middleware";

export const productRouter = Router();

productRouter.get("/categories", hasPermission('create-gr'), getCategories);
// New: Get products by category only (no subcategory needed)
productRouter.get("/categories/:categoryId/products", hasPermission('create-gr'), getProductByCategoryId);
// Backward compatible routes
productRouter.get("/categories/:categoryId/subcategories", hasPermission('create-gr'), getSubCategoryByCategoryId);
productRouter.get("/categories/:categoryId/subcategories/:subCategoryId/products", hasPermission('create-gr'), getProductByCatSubCatId);
