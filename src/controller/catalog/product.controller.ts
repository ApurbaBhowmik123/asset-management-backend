import { successResponse } from "@utils/successResponse";
import { PrismaClient } from "../../../prisma/generated/prisma/client";
import { Request, Response, NextFunction } from "express";
import { ErrorHandler } from "@utils/ErrorHandler";
import { createPagedResponse } from "@utils/pagedResponse";
import { generateNextCode } from "@utils/codeGenerator";
const prisma = new PrismaClient();

export const getAllProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const sortBy = (req.query.sortBy as string) || "createdAt";
    const sortOrder =
      (req.query.sortOrder as string) === "asc" ? "asc" : "desc";

    const allowedSortFields = ["name", "sku", "createdAt", "purchaseDate"];
    const finalSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    const whereClause = search
      ? {
          OR: [{ name: { contains: search } }, { msq: { contains: search } }],
        }
      : {};

    const total = await prisma.product.count({ where: whereClause });

    const products = await prisma.product.findMany({
      where: whereClause,
      orderBy: { [finalSortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        brand: true,
        category: true,
                productSpecValue: true,
        createdUser: {
          select: {
            id: true,
            name: true,
          },
        },
        updatedUser: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const paged = createPagedResponse(products, page, limit, total);
    return successResponse(
      res,
      200,
      "Products fetched successfully",
      paged,
      null
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 400));
    }
    return next(new ErrorHandler("An unknown error occurred", 500));
  }
};

export const getProductById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id: Number(id) },
      include: {
        brand: true,
        category: true,
                productSpecValue: true,
        createdUser: {
          select: {
            id: true,
            name: true,
          },
        },
        updatedUser: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!product) return next(new ErrorHandler("Product not found", 404));

    return successResponse(res, 200, "Fetched product", product, null);
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      brandId,
      categoryId,
      name,
      msq,
      description,
      lifeCycleAging,
      specValues = [],
    } = req.body;

    const userId = req.user?.id;

    const uuid = await generateNextCode(prisma.product, "uuid", "PROD");

    const product = await prisma.product.create({
      data: {
        uuid,
        brandId,
        categoryId,
        name,
        msq,
        lifeCycleAging: Number(lifeCycleAging) || null,
        description,
        createdBy: Number(userId),
        productSpecValue: {
          create: specValues.map((spec: any) => ({
            specFieldId: spec.specFieldId,
            value: spec.value,
            createdBy: Number(userId),
          })),
        },
      },
      include: {
        productSpecValue: true,
      },
    });

    return successResponse(
      res,
      200,
      "Product created successfully",
      product,
      null
    );
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const {
      brandId,
      categoryId,
      name,
      msq,
      description,
      lifeCycleAging,
      specValues = [],
    } = req.body;

    const userId = req.user?.id;

    const existingProduct = await prisma.product.findUnique({
      where: { id: Number(id) },
    });
    if (!existingProduct)
      return next(new ErrorHandler("Product not found", 404));

    const updatedProduct = await prisma.product.update({
      where: { id: Number(id) },
      data: {
        brandId,
        categoryId,
        name,
        msq,
        description,
        lifeCycleAging: Number(lifeCycleAging) || null,
        updatedBy: Number(userId),
        updatedAt: new Date(),
        productSpecValue: {
          deleteMany: { productId: Number(id) },
          create: specValues.map((spec: any) => ({
            uuid: crypto.randomUUID(),
            specFieldId: spec.specFieldId,
            value: spec.value,
            createdBy: Number(userId),
            updatedAt: new Date(),
          })),
        },
      },
      include: {
        productSpecValue: true,
      },
    });

    return successResponse(res, 200, "Product updated", updatedProduct, null);
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id: Number(id) },
    });
    if (!product) return next(new ErrorHandler("Product not found", 404));

    await prisma.product.delete({ where: { id: Number(id) } });

    return successResponse(
      res,
      200,
      "Product deleted successfully",
      product,
      null
    );
  } catch (error) {
    next(error);
  }
};
