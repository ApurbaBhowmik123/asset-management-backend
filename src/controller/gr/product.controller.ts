import { successResponse } from "@utils/successResponse";
import { Request, Response, NextFunction } from "express";
import { ErrorHandler } from "@utils/ErrorHandler";
import { PrismaClient } from "../../../prisma/generated/prisma/client";
import { getSafeString } from "@utils/paramHelper";
const prisma = new PrismaClient();

export const getCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const categories = await prisma.category.findMany({
      where: {
        status: true,
      },
      select: {
        id: true,
        name: true,
        status: true,
        assetType: true,
        trackingType: true,
        abbriviatedName: true,
        maintainanceFrequency: true,
      },
      orderBy: {
        name: "asc",
      },
    });
    return successResponse(
      res,
      200,
      "Categories retrieved successfully",
      categories,
      null
    );
  } catch (error: unknown) {
    console.error(error);
    if (error instanceof ErrorHandler) {
      return next(new ErrorHandler(error.message, 500));
    } else {
      return next(new ErrorHandler("Internal Server Error", 500));
    }
  }
};

// Kept for backward compatibility
export const getSubCategoryByCategoryId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const categoryId = parseInt(getSafeString(req.params.categoryId));
    if (isNaN(categoryId)) {
      return next(new ErrorHandler("Invalid category ID", 400));
    }

    const subCategories = await prisma.subcategory.findMany({
      where: {
        categoryId: categoryId,
        status: true,
      },
      select: {
        id: true,
        name: true,
        status: true,
        maintainanceFrequency: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return successResponse(
      res,
      200,
      "Subcategories retrieved successfully",
      subCategories,
      null
    );
  } catch (error: unknown) {
    console.error(error);
    if (error instanceof ErrorHandler) {
      return next(new ErrorHandler(error.message, 500));
    } else {
      return next(new ErrorHandler("Internal Server Error", 500));
    }
  }
};

// NEW: Get products by category only (no subcategory needed)
export const getProductByCategoryId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const categoryId = parseInt(getSafeString(req.params.categoryId));
    if (isNaN(categoryId)) {
      return next(new ErrorHandler("Invalid category ID", 400));
    }

    const product = await prisma.product.findMany({
      where: {
        categoryId: categoryId,
        status: true,
      },
      include: {
        productSpecValue: {
          include: {
            specField: {
              include: {
                options: {
                  select: {
                    id: true,
                    value: true,
                    status: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return successResponse(
      res,
      200,
      "Product retrieved successfully",
      product,
      null
    );
  } catch (error: unknown) {
    console.error(error);
    if (error instanceof ErrorHandler) {
      return next(new ErrorHandler(error.message, 500));
    } else {
      return next(new ErrorHandler("Internal Server Error", 500));
    }
  }
};

// Kept for backward compatibility
export const getProductByCatSubCatId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const categoryId = parseInt(getSafeString(req.params.categoryId));
    const subCategoryId = parseInt(getSafeString(req.params.subCategoryId));
    if (isNaN(categoryId) || isNaN(subCategoryId)) {
      return next(new ErrorHandler("Invalid category or subcategory ID", 400));
    }

    const product = await prisma.product.findMany({
      where: {
        categoryId: categoryId,
                status: true,
      },
      include: {
        productSpecValue: {
          include: {
            specField: {
              include: {
                options: {
                  select: {
                    id: true,
                    value: true,
                    status: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return successResponse(
      res,
      200,
      "Product retrieved successfully",
      product,
      null
    );
  } catch (error: unknown) {
    console.error(error);
    if (error instanceof ErrorHandler) {
      return next(new ErrorHandler(error.message, 500));
    } else {
      return next(new ErrorHandler("Internal Server Error", 500));
    }
  }
};
