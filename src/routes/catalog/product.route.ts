import { Router } from "express";
import {
  getProductById,
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "@controllers/catalog/product.controller";
import { paginationValidator } from "@validators/pagination.validator";
import { validate } from "@middlewares/validate.midlleware";
import { hasPermission } from "@middlewares/permission.middleware";
import { createProductValidator, updateProductValidator } from "@validators/catalog/product.validator";

export const productRouter = Router();

productRouter.get("/",hasPermission('read-product'),paginationValidator(['name', 'serialNumber']),validate, getAllProducts);

productRouter.get("/:id",hasPermission('read-product'), getProductById);

productRouter.post("/",hasPermission('create-product'),createProductValidator,validate, createProduct);

productRouter.put("/:id",hasPermission('update-product'),updateProductValidator, validate, updateProduct);

productRouter.delete("/:id",hasPermission('delete-product'), deleteProduct);
