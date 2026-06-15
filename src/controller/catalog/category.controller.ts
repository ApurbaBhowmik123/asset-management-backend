import { successResponse } from "@utils/successResponse";
import { Request, Response, NextFunction } from "express";
import { ErrorHandler } from "@utils/ErrorHandler";
import { createPagedResponse } from "@utils/pagedResponse";
import { PrismaClient } from "../../../prisma/generated/prisma/client";
import { generateNextCode } from "@utils/codeGenerator";

const prisma = new PrismaClient();

export const getAllCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const sortBy = (req.query.sortBy as string) || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? "asc" : "desc";

    const allowedSortFields = [
      "name",
      "uuid",
      "description",
      "createdAt",
      "updatedAt",
    ];
    const finalSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    const whereClause: any = {
      status: true,
    };

    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { uuid: { contains: search } },
      ];
    }

    const categories = await prisma.category.findMany({
      where: whereClause,
      include: {
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
        categorySpecFields: {
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
        },
      },
      orderBy: {
        [finalSortBy]: sortOrder,
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalCount = await prisma.category.count({
      where: whereClause,
    });

    return successResponse(
      res,
      200,
      "Category List retrieved successfully",
      createPagedResponse(categories, page, limit, totalCount),
      null
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 500));
    }
    return next(new ErrorHandler("An unexpected error occurred", 500));
  }
};

export const getCategoryById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    // Fetch category by ID
    const category = await prisma.category.findUnique({
      where: { id: Number(id) },
      include: {
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
        categorySpecFields: {
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
        },
      },
    });

    if (!category) {
      return next(new ErrorHandler("Category not found", 404));
    }

    // Send response
    return successResponse(
      res,
      200,
      "Category retrieved successfully",
      category,
      null
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 500));
    }
    return next(new ErrorHandler("An unexpected error occurred", 500));
  }
};

export const createCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, description, assetType, trackingType, abbriviatedName, maintainanceFrequency, specFieldIds = [] } = req.body;

    const categoryID = await generateNextCode(
      prisma.category,
      "uuid",
      "CAT-",
      3
    );
    // Create category
    const newCategory = await prisma.category.create({
      data: {
        name,
        description,
        assetType: assetType || "PHYSICAL",
        trackingType: trackingType || "TRACKABLE",
        abbriviatedName: abbriviatedName || null,
        maintainanceFrequency: maintainanceFrequency ? parseInt(maintainanceFrequency) : null,
        uuid: categoryID,
        createdBy: Number(req.user?.id),
      },
    });

    if (specFieldIds.length > 0) {
      const uniqueIds = Array.from(new Set(specFieldIds.map(Number))) as number[];
      await prisma.categorySpecField.createMany({
        data: uniqueIds.map((specFieldId: number) => ({
          categoryId: newCategory.id,
          specFieldId,
        })),
      });
    }

    // Send response
    return successResponse(
      res,
      201,
      "Category created successfully",
      newCategory,
      null
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 500));
    }
    return next(new ErrorHandler("An unexpected error occurred", 500));
  }
};

export const updateCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { name, description, assetType, trackingType, abbriviatedName, maintainanceFrequency, specFieldIds = [] } = req.body;

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id: Number(id) },
    });

    if (!existingCategory) {
      return next(new ErrorHandler("Category not found", 404));
    }

    // Update category
    const updatedCategory = await prisma.category.update({
      where: { id: Number(id) },
      data: {
        name,
        description,
        assetType: assetType || existingCategory.assetType,
        trackingType: trackingType || existingCategory.trackingType,
        abbriviatedName: abbriviatedName !== undefined ? abbriviatedName : existingCategory.abbriviatedName,
        maintainanceFrequency: maintainanceFrequency !== undefined ? (maintainanceFrequency ? parseInt(maintainanceFrequency) : null) : existingCategory.maintainanceFrequency,
        updatedAt: new Date(),
        updatedBy: Number(req.user?.id),
      },
    });

    // Remove all old spec field links
    await prisma.categorySpecField.deleteMany({
      where: { categoryId: Number(id) },
    });

    // Add new spec field links
    if (specFieldIds.length > 0) {
      const uniqueIds = Array.from(new Set(specFieldIds.map(Number))) as number[];
      await prisma.categorySpecField.createMany({
        data: uniqueIds.map((specFieldId: number) => ({
          categoryId: Number(id),
          specFieldId,
        })),
      });
    }

    // Send response
    return successResponse(
      res,
      200,
      "Category updated successfully",
      updatedCategory,
      null
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 500));
    }
    return next(new ErrorHandler("An unexpected error occurred", 500));
  }
};

export const deleteCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id: Number(id) },
    });

    if (!existingCategory) {
      return next(new ErrorHandler("Category not found", 404));
    }

    // Delete category
    await prisma.category.delete({
      where: { id: Number(id) },
    });

    // Send response
    return successResponse(
      res,
      200,
      "Category deleted successfully",
      null,
      null
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 500));
    }
    return next(new ErrorHandler("An unexpected error occurred", 500));
  }
};

export const updateCategoryStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id: Number(id) },
    });

    if (!existingCategory) {
      return next(new ErrorHandler("Category not found", 404));
    }

    // Update category status
    const updatedCategory = await prisma.category.update({
      where: { id: Number(id) },
      data: {
        status: !existingCategory.status, // Toggle status
        updatedAt: new Date(),
        updatedBy: Number(req.user?.id),
      },
    });

    // Send response
    return successResponse(
      res,
      200,
      "Category status updated successfully",
      updatedCategory,
      null
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 500));
    }
    return next(new ErrorHandler("An unexpected error occurred", 500));
  }
};
