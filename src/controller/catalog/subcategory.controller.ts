import { successResponse } from "@utils/successResponse";
import { PrismaClient } from "../../../prisma/generated/prisma/client";
import { Request, Response, NextFunction } from "express";
import { ErrorHandler } from "@utils/ErrorHandler";
import { createPagedResponse } from "@utils/pagedResponse";
import { generateNextCode } from "@utils/codeGenerator";
import { getSafeString } from "@utils/paramHelper";
import prisma from "../../utils/prisma";


export interface SpecFieldOption {
  id?: number;
  uuid?: string;
  value: string;
  status?: boolean;
}

export interface SpecField {
  id?: number;
  uuid?: string;
  name: string;
  fieldType: string;
  unit?: string;
  isRequired: boolean;
  description?: string;
  status?: boolean;
  options?: SpecFieldOption[];
}

export const getSubcategories = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const sortBy = (req.query.sortBy as string) || "createdAt"; // default fallback
    const sortOrder =
      (req.query.sortOrder as string) === "asc" ? "asc" : "desc";

    // Validate sortBy against allowed fields
    const allowedSortFields = [
      "createdAt",
      "updatedAt",
      "name",
      "description",
      "fieldType",
    ];
    const finalSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    // Fetch subcategories from the database
    const subcategories = await prisma.subcategory.findMany({
      where: {
        name: {
          contains: search,
        },
        description: {
          contains: search,
        },
        uuid: {
          contains: search,
        },
        status: true,
      },
      orderBy: {
        [finalSortBy]: sortOrder,
      },
      include: {
        category: true,
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
        subcategorySpecFields: {
          include: {
            specField: {
              include: {
                options: {
                  orderBy: { createdAt: "asc" },
                },
              },
            },
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Get total count for pagination
    const totalCount = await prisma.subcategory.count({
      where: {
        name: {
          contains: search,
        },
        description: {
          contains: search,
        },
        uuid: {
          contains: search,
        },
        status: true,
      },
    });
    // Send response
    return successResponse(
      res,
      200,
      "SubCategory fetched successfully",
      createPagedResponse(subcategories, page, limit, totalCount),
      null
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 500));
    }
    return next(new ErrorHandler("An unexpected error occurred", 500));
  }
};

export const getSubCategoryById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    // Fetch subcategory by ID
    const subcategory = await prisma.subcategory.findUnique({
      where: {
        id: Number(id),
      },
      include: {
        category: true,
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
        subcategorySpecFields: {
          include: {
            specField: {
              include: {
                options: {
                  orderBy: { createdAt: "asc" },
                },
              },
            },
          },
        },
      },
    });

    if (!subcategory) {
      return next(new ErrorHandler("SubCategory not found", 404));
    }

    // Send response
    return successResponse(
      res,
      200,
      "SubCategory fetched successfully",
      subcategory,
      null
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 500));
    }
    return next(new ErrorHandler("An unexpected error occurred", 500));
  }
};

export const createSubcategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const {
    name,
    description,
    maintainanceFrequency,
    categoryId,
    specFieldIds = [],
    abbriviatedName,
  } = req.body;
  const userId = parseInt(req.user?.id ?? "0");
  const subCategoryuuid = await generateNextCode(
    prisma.subcategory,
    "uuid",
    "SUBCAT-"
  );
  try {
    const subcategory = await prisma.subcategory.create({
      data: {
        name,
        description,
        categoryId,
        createdBy: userId,
        maintainanceFrequency: Number(maintainanceFrequency) || null,
        uuid: subCategoryuuid,
        abbriviatedName,
      },
    });

    if (specFieldIds.length > 0) {
      const existing = await prisma.subcategorySpecField.findMany({
        where: { },
        select: { specFieldId: true },
      });

      const existingIds = new Set(existing.map((e) => e.specFieldId));

      const newRecords = specFieldIds
        .filter((id: number) => !existingIds.has(id))
        .map((specFieldId: number) => ({
                    specFieldId,
        }));

      if (newRecords.length > 0) {
        await prisma.subcategorySpecField.createMany({ data: newRecords });
      }
    }

    successResponse(
      res,
      201,
      "Subcategory created successfully",
      subcategory,
      null
    );
  } catch (error) {
    console.error("Error creating subcategory:", error);

    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 500));
    }

    return next(
      new ErrorHandler(
        "An unexpected error occurred while creating subcategory",
        500
      )
    );
  }
};

export const updateSubcategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const subcategoryId = parseInt(getSafeString(req.params.subcategoryId));
  const userId = parseInt(req.user?.id ?? "0");

  // ✅ Explicit typing of req.body
  const {
    name,
    description,
    maintainanceFrequency,
    categoryId,
    abbriviatedName,
    specFieldIds = [],
  }: {
    name: string;
    description?: string;
    maintainanceFrequency?: number;
    categoryId: number;
    abbriviatedName?: string;
    specFieldIds: number[];
  } = req.body;

  try {
    // Step 1: Ensure subcategory exists
    const existingSubcategory = await prisma.subcategory.findUnique({
      where: { id: subcategoryId },
    });

    if (!existingSubcategory) {
      return next(new ErrorHandler("Subcategory not found", 404));
    }

    // Step 2: Update subcategory
    const updatedSubcategory = await prisma.subcategory.update({
      where: { id: subcategoryId },
      data: {
        name,
        description,
        categoryId,
        abbriviatedName,
        maintainanceFrequency:
          maintainanceFrequency !== undefined
            ? Number(maintainanceFrequency)
            : null,
        updatedBy: userId,
        updatedAt: new Date(),
      },
    });

    // Step 3: Remove all old spec field links
    await prisma.subcategorySpecField.deleteMany({
      where: { subcategoryId },
    });

    // Step 4: Add new spec field links (deduplicated)
    if (specFieldIds.length > 0) {
      const uniqueIds: number[] = [...new Set(specFieldIds)];

      await prisma.subcategorySpecField.createMany({
        data: uniqueIds.map((specFieldId) => ({
          subcategoryId,
          specFieldId,
        })),
      });
    }

    // Step 5: Return response
    successResponse(
      res,
      200,
      "Subcategory updated successfully",
      updatedSubcategory,
      null
    );
  } catch (error) {
    console.error("Error updating subcategory:", error);

    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 500));
    }

    return next(
      new ErrorHandler(
        "An unexpected error occurred while updating subcategory",
        500
      )
    );
  }
};

export const deleteSubcategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  try {
    // Check if subcategory exists
    const existingSubcategory = await prisma.subcategory.findUnique({
      where: { id: Number(id) },
    });
    if (!existingSubcategory) {
      return next(new ErrorHandler("Subcategory not found", 404));
    }
    // Delete subcategory
    const subcategory = await prisma.subcategory.delete({
      where: { id: Number(id) },
    });

    return successResponse(
      res,
      200,
      "Subcategory deleted successfully",
      subcategory,
      null
    );
  } catch (error) {
    console.error("Error deleting subcategory:", error);
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 500));
    }

    return next(new ErrorHandler("An unexpected error occurred", 500));
  }
};

export const updateSubcategoryStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;

  try {
    const existingSubcategory = await prisma.subcategory.findUnique({
      where: { id: Number(id) },
    });
    if (!existingSubcategory) {
      return next(new ErrorHandler("Subcategory not found", 404));
    }
    const updatedSubcategory = await prisma.subcategory.update({
      where: { id: Number(id) },
      data: {
        status: !existingSubcategory.status, // Toggle status
      },
      include: {
        category: {
          select: { id: true, name: true, uuid: true },
        },
        createdUser: {
          select: { id: true, name: true, uuid: true },
        },
        updatedUser: {
          select: { id: true, name: true, uuid: true },
        },
      },
    });

    return successResponse(
      res,
      200,
      "Subcategory status updated successfully",
      updatedSubcategory,
      null
    );
  } catch (error) {
    console.error("Error updating subcategory status:", error);
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 500));
    }
    return next(new ErrorHandler("An unexpected error occurred", 500));
  }
};
