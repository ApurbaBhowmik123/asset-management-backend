import { Request, Response, NextFunction } from "express";
import { successResponse } from "../../utils/successResponse";
import { ErrorHandler } from "../../utils/ErrorHandler";
import { createPagedResponse } from "../../utils/pagedResponse";
import { generateNextCode } from "../../utils/codeGenerator";
import prisma from "../../utils/prisma";

export const getBrands = async (
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

    const allowedSortFields = ["name", "status", "createdAt"];
    const finalSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    const whereClause = search
      ? {
          OR: [{ name: { contains: search } }],
        }
      : {};

    const total = await prisma.brand.count({ where: whereClause });

    const brands = await prisma.brand.findMany({
      where: whereClause,
      orderBy: { [finalSortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
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
      },
    });

    const paged = createPagedResponse(brands, page, limit, total);

    return successResponse(
      res,
      200,
      "Brands fetched successfully",
      paged,
      null
    );
  } catch (error: unknown) {
    if (error instanceof Error)
      return next(new ErrorHandler(error.message, 400));
    return next(new ErrorHandler("An unknown error occurred", 500));
  }
};

export const getBrandById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const brand = await prisma.brand.findUnique({
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
      },
    });

    if (!brand) return next(new ErrorHandler("Brand not found", 404));

    return successResponse(res, 200, "Brand fetched successfully", brand, null);
  } catch (error: unknown) {
    if (error instanceof Error)
      return next(new ErrorHandler(error.message, 400));
    return next(new ErrorHandler("An unknown error occurred", 500));
  }
};

export const createBrand = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const inputBrands = Array.isArray(req.body) ? req.body : [req.body];

    const createdBrands = [];

    for (const brandInput of inputBrands) {
      const { name } = brandInput;

      const existing = await prisma.brand.findFirst({ where: { name } });
      if (existing) {
        return next(
          new ErrorHandler(`Brand name "${name}" already exists`, 409)
        );
      }

      const uuid = await generateNextCode(prisma.brand, "uuid", "BR");

      const newBrand = await prisma.brand.create({
        data: {
          uuid,
          name,
          createdBy: Number(userId),
        },
      });

      createdBrands.push(newBrand);
    }

    return successResponse(
      res,
      201,
      "Brand created successfully",
      createdBrands,
      null
    );
  } catch (error: unknown) {
    if (error instanceof Error)
      return next(new ErrorHandler(error.message, 400));
    return next(new ErrorHandler("An unknown error occurred", 500));
  }
};

export const updateBrand = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const userId = req.user?.id;

    const findBrand = await prisma.brand.findUnique({
      where: { id: Number(id) },
    });
    if (!findBrand) return next(new ErrorHandler("Brand not found", 404));

    const existing = await prisma.brand.findFirst({
      where: {
        name,
        NOT: { id: Number(id) },
      },
    });

    if (existing)
      return next(new ErrorHandler("Brand name already exists", 409));

    const brand = await prisma.brand.update({
      where: { id: Number(id) },
      data: {
        name,
        updatedBy: Number(userId),
        updatedAt: new Date(),
      },
    });

    return successResponse(res, 200, "Brand updated successfully", brand, null);
  } catch (error: unknown) {
    if (error instanceof Error)
      return next(new ErrorHandler(error.message, 400));
    return next(new ErrorHandler("An unknown error occurred", 500));
  }
};

export const deleteBrand = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const brand = await prisma.brand.findUnique({ where: { id: Number(id) } });
    if (!brand) return next(new ErrorHandler("Brand not found", 404));

    await prisma.brand.delete({ where: { id: Number(id) } });

    return successResponse(res, 200, "Brand deleted successfully", null, null);
  } catch (error: unknown) {
    if (error instanceof Error)
      return next(new ErrorHandler(error.message, 400));
    return next(new ErrorHandler("An unknown error occurred", 500));
  }
};
