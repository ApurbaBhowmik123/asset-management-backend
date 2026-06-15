import { successResponse } from "@utils/successResponse";
import { ErrorHandler } from "@utils/ErrorHandler";
import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "../../../prisma/generated/prisma";
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
      },
    });
    return successResponse(
      res,
      200,
      "Categories retrieved successfully",
      categories,
      null
    );
  } catch (error) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 500));
    }
    return next(new ErrorHandler("An unexpected error occurred", 500));
  }
};

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
      },
    });

    return successResponse(
      res,
      200,
      "Subcategories retrieved successfully",
      subCategories,
      null
    );
  } catch (error) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 500));
    }
    return next(new ErrorHandler("An unexpected error occurred", 500));
  }
};

export const getSpecfieldBySubCategoryId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const subCategoryId = parseInt(getSafeString(req.params.subCategoryId));
    if (isNaN(subCategoryId)) {
      return next(new ErrorHandler("Invalid subcategory ID", 400));
    }

    const specFields = await prisma.subcategorySpecField.findMany({
      where: {
              },
      include: {
        specField: {
          include: {
            options: true,
          },
        },
      },
    });
    return successResponse(
      res,
      200,
      "Spec fields retrieved successfully",
      specFields,
      null
    );
  } catch (error) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 500));
    }
    return next(new ErrorHandler("An unexpected error occurred", 500));
  }
};

export const getSpecfieldByCategoryId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const categoryId = parseInt(getSafeString(req.params.categoryId));
    if (isNaN(categoryId)) {
      return next(new ErrorHandler("Invalid category ID", 400));
    }

    const specFields = await prisma.categorySpecField.findMany({
      where: {
        categoryId: categoryId,
      },
      include: {
        specField: {
          include: {
            options: {
              where: { status: true },
              orderBy: { createdAt: "asc" },
            },
          },
        },
      },
    });
    return successResponse(
      res,
      200,
      "Spec fields retrieved successfully",
      specFields,
      null
    );
  } catch (error) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 500));
    }
    return next(new ErrorHandler("An unexpected error occurred", 500));
  }
};

