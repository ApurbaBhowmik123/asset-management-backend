import { successResponse } from "@utils/successResponse";
import { Request, Response, NextFunction } from "express";
import { ErrorHandler } from "@utils/ErrorHandler";
import { PrismaClient } from "../../../prisma/generated/prisma/client";
import { generateNextCode } from "@utils/codeGenerator";
import { createPagedResponse } from "@src/utils/pagedResponse";
import { getSafeString } from "@utils/paramHelper";
import prisma from "../../utils/prisma";


export interface option {
  value: string;
  status?: boolean;
}

export const getSpecFields = async (
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

    const whereClause: any = { status: true };

    if (search) {
      const searchTerms = search.split(" ").map((term) => term.trim());
      whereClause.OR = searchTerms.flatMap((term) => [
        { name: { contains: term } },
        { uuid: { contains: term } },
        { unit: { contains: term } },
        { description: { contains: term } },
        { fieldType: { contains: term } },
        { createdUser: { name: { contains: term } } },
      ]);
    }

    const [specFields, totalCount] = await Promise.all([
      prisma.specField.findMany({
        where: whereClause,
        orderBy: { [finalSortBy]: sortOrder },
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
          options: {
            where: { status: true },
            orderBy: { createdAt: "asc" },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.specField.count({ where: whereClause }),
    ]);

    return successResponse(
      res,
      200,
      "Spec fields retrieved successfully",
      createPagedResponse(specFields, page, limit, totalCount),
      null
    );
  } catch (error) {
    return next(new ErrorHandler("Failed to retrieve spec fields", 500));
  }
};

export const createSpecField = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = parseInt(req.user?.id ?? "0");
  const { name, fieldType, unit, isRequired, description, status, options } =
    req.body;
  try {
    // Check for duplicate field name within the same subcategory
    const existingField = await prisma.specField.findFirst({
      where: {
        name: name,
        status: true,
      },
    });
    const specFieldUUID = await generateNextCode(
      prisma.specField,
      "uuid",
      "SPEC-"
    );
    if (existingField) {
      return next(
        new ErrorHandler(`Spec field with name "${name}" already exists`, 400)
      );
    }

    const lastOption = await prisma.specFieldOption.findFirst({
      where: {
        uuid: {
          startsWith: "SPECOP-",
        },
      },
      orderBy: {
        uuid: "desc",
      },
    });

    const baseNumber = lastOption
      ? parseInt(lastOption.uuid.replace("SPECOP-", ""), 10)
      : 0;

    let optionData: any[] = [];
    if (options && options.length > 0) {
      for (let i = 0; i < options.length; i++) {
        const newNumber = (baseNumber + i + 1).toString().padStart(3, "0");
        const uuid = `SPECOP-${newNumber}`;
        optionData.push({
          value: options[i].value,
          status: options[i].status ?? true,
          createdBy: userId,
          updatedBy: userId,
          uuid,
        });
      }
    }

    const specField = await prisma.specField.create({
      data: {
        name,
        fieldType,
        uuid: specFieldUUID,
        unit: unit || null,
        isRequired,
        description: description || null,
        status: status ?? true,
        createdBy: userId,
        updatedBy: userId,
        options: optionData.length > 0 ? { create: optionData } : undefined,
      },
      include: {
        options: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return successResponse(
      res,
      201,
      "Spec field created successfully",
      specField,
      null
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Unique constraint failed")) {
        return next(new ErrorHandler("Spec field name already exists", 400));
      }
      return next(new ErrorHandler(error.message, 500));
    }
    return next(new ErrorHandler("Failed to create spec field", 500));
  }
};

export const updateSpecField = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = parseInt(req.user?.id ?? "0");
  const id = parseInt(getSafeString(req.params.id));
  const { name, fieldType, unit, isRequired, description, status, options } =
    req.body;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Check if spec field exists
      const specField = await tx.specField.findUnique({
        where: { id: id, status: true },
        include: { options: true },
      });

      if (!specField) {
        throw new Error("Spec field not found or inactive");
      }

      // 2. Update spec field basic info
      await tx.specField.update({
        where: { id: id },
        data: {
          name,
          fieldType,
          unit: unit || null,
          isRequired,
          description: description || null,
          status: status ?? true,
          updatedBy: userId,
          updatedAt: new Date(),
        },
      });

      // 3. Handle options synchronization
      if (options !== undefined && Array.isArray(options)) {
        // Get the IDs of options that should remain active (present in payload)
        const payloadOptionIds = options
          .filter((option) => option.id)
          .map((option) => option.id);

        // Mark all existing options as inactive first
        await tx.specFieldOption.updateMany({
          where: { specFieldId: id },
          data: {
            status: false,
            updatedBy: userId,
            updatedAt: new Date(),
          },
        });

        // Process each option in the new list
        for (const option of options) {
          if (option.id) {
            // Reactivate and update existing option
            await tx.specFieldOption.update({
              where: { id: option.id },
              data: {
                value: option.value,
                status: true, // Reactivate
                updatedBy: userId,
                updatedAt: new Date(),
              },
            });
          } else {
            // Create new option
            await tx.specFieldOption.create({
              data: {
                specFieldId: id,
                value: option.value,
                status: true,
                createdBy: userId,
                updatedBy: userId,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            });
          }
        }

        // Note: Options not present in the payload will remain inactive (status: false)
        // This effectively "unlinks" them from this spec field
      }

      // 4. Return updated spec field
      return await tx.specField.findUnique({
        where: { id: id },
        include: {
          options: {
            where: { status: true },
            orderBy: { createdAt: "asc" },
          },
          subcategorySpecFields: {
            include: {
                          },
          },
        },
      });
    });

    return successResponse(
      res,
      200,
      "Spec field updated successfully",
      result,
      null
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Spec field not found or inactive") {
        return next(new ErrorHandler("Spec field not found or inactive", 404));
      }
      if (error.message.includes("Unique constraint failed")) {
        return next(new ErrorHandler("Spec field name already exists", 400));
      }
      return next(new ErrorHandler(error.message, 500));
    }
    return next(new ErrorHandler("Failed to update spec field", 500));
  }
};

export const getSpecFieldById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const id = parseInt(getSafeString(req.params.id));

  try {
    const specField = await prisma.specField.findUnique({
      where: { id: id, status: true },
      include: {
        options: {
          where: { status: true },
          orderBy: { createdAt: "asc" },
        },
        subcategorySpecFields: {
          include: {
            subcategory: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    if (!specField) {
      return next(new ErrorHandler("Spec field not found or inactive", 404));
    }

    return successResponse(
      res,
      200,
      "Spec field retrieved successfully",
      specField,
      null
    );
  } catch (error) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 500));
    }
    return next(new ErrorHandler("Failed to retrieve spec field", 500));
  }
};

export const deleteSpecField = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const id = parseInt(getSafeString(req.params.id));
  const userId = parseInt(req.user?.id ?? "0");

  try {
    // 1. Check if the specField exists
    const specField = await prisma.specField.findUnique({
      where: { id },
      include: {
        subcategorySpecFields: true,
        productSpecValue: true,
        grProductSpecValues: true,
      },
    });

    if (!specField) {
      return next(new ErrorHandler("Spec field not found", 404));
    }

    // 2. Prevent deletion if specField is referenced in other tables
    if (
      specField.subcategorySpecFields.length > 0 ||
      specField.productSpecValue.length > 0 ||
      specField.grProductSpecValues.length > 0
    ) {
      return next(
        new ErrorHandler(
          "Cannot delete spec field: It is referenced in other records.",
          400
        )
      );
    }

    // 3. Delete related options first
    await prisma.specFieldOption.deleteMany({
      where: { specFieldId: id },
    });

    // 4. Delete the specField
    await prisma.specField.delete({
      where: { id },
    });

    return successResponse(
      res,
      200,
      "Spec field deleted successfully",
      null,
      null
    );
  } catch (error) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 500));
    }
    return next(new ErrorHandler("Failed to delete spec field", 500));
  }
};

export const updateSpecFieldStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const id = parseInt(getSafeString(req.params.id));
  const userId = parseInt(req.user?.id ?? "0");

  try {
    const specField = await prisma.specField.findUnique({
      where: { id: id },
    });

    if (!specField) {
      return next(new ErrorHandler("Spec field not found or inactive", 404));
    }

    const updatedSpecField = await prisma.specField.update({
      where: { id: id },
      data: {
        status: !specField.status, // Toggle status
        updatedAt: new Date(),
        updatedBy: userId,
      },
    });

    return successResponse(
      res,
      200,
      "Spec field status updated successfully",
      updatedSpecField,
      null
    );
  } catch (error) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 500));
    }
    return next(new ErrorHandler("Failed to update spec field status", 500));
  }
};

export const getSpecFieldOptionBySpecField = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const specfieldId = parseInt(getSafeString(req.params?.specfieldId ?? ""));
    const specficFieldOptions = await prisma.specFieldOption.findMany({
      where: {
        specFieldId: specfieldId,
      },
    });
    return successResponse(
      res,
      200,
      "Spec field options are fetched",
      specficFieldOptions,
      null
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 500));
    }
    return next(new ErrorHandler("Internal Server Error", 500));
  }
};
