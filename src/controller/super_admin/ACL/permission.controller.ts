import { successResponse } from "../../../utils/successResponse";
import { ErrorHandler } from "../../../utils/ErrorHandler";
import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "../../../../prisma/generated/prisma";
import { generateSlug } from "../../../common/generate_slug";
import { createPagedResponse } from "../../../utils/pagedResponse";
const prisma = new PrismaClient();

export const getAllPermissions = async (
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
    const allowedSortFields = ["name", "slug", "createdAt"];
    const finalSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    // Prepare filters
    const whereClause = search
      ? {
          OR: [
            { name: { contains: search } },
            { description: { contains: search } },
          ],
        }
      : {};

    // Count total first
    const total = await prisma.permission.count({ where: whereClause });

    // Get paginated data
    const permissions = await prisma.permission.findMany({
      where: whereClause,
      orderBy: {
        [finalSortBy]: sortOrder,
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const paged = createPagedResponse(permissions, page, limit, total);

    return successResponse(
      res,
      200,
      "Permissions fetched successfully",
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

export const getPermissionById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const permissionId = req.params.id;
    const permission = await prisma.permission.findUnique({
      where: { id: Number(permissionId) },
    });
    if (!permission) {
      return next(new ErrorHandler("Permission not found", 404));
    }
    return successResponse(
      res,
      200,
      "Permission fetched successfully",
      permission,
      null
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 400));
    }
    return next(new ErrorHandler("An unknown error occurred", 500));
  }
};

export const createPermission = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, description, type, resource } = req.body;
    if (type === "basic") {
      const slug = generateSlug(name);
      const newPermission = await prisma.permission.create({
        data: { name, description, slug },
      });
      return successResponse(
        res,
        201,
        "Permission created successfully",
        newPermission,
        null
      );
    } else {
      resource.forEach(async (element: string) => {
        const slug = generateSlug(`${element} ${name}`);
        const newPermission = await prisma.permission.create({
          data: {
            name: `${element} ${name}`,
            description: `${element} ${name}`,
            slug,
          },
        });
      });
      return successResponse(
        res,
        201,
        "Permissions created successfully",
        null,
        null
      );
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 400));
    }
    return next(new ErrorHandler("An unknown error occurred", 500));
  }
};

export const updatePermission = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const permissionId = req.params.id;
    const { name, description } = req.body;
    const permission = await prisma.permission.findUnique({
      where: { id: Number(permissionId) },
    });
    if (!permission) {
      return next(new ErrorHandler("Permission not found", 404));
    }
    permission.name = name || permission.name;
    permission.description = description || permission.description;
    await prisma.permission.update({
      where: { id: Number(permissionId) },
      data: permission,
    });
    return successResponse(
      res,
      200,
      "Permission updated successfully",
      permission,
      null
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 400));
    }
    return next(new ErrorHandler("An unknown error occurred", 500));
  }
};

export const deletePermission = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const permissionId = req.params.id;
    const permission = await prisma.permission.findUnique({
      where: { id: Number(permissionId) },
    });
    if (!permission) {
      return next(new ErrorHandler("Permission not found", 404));
    }
    await prisma.permission.delete({ where: { id: Number(permissionId) } });
    return successResponse(
      res,
      200,
      "Permission deleted successfully",
      null,
      null
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 400));
    }
    return next(new ErrorHandler("An unknown error occurred", 500));
  }
};

export const getPerm = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const permissions = await prisma.permission.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });
    return successResponse(
      res,
      200,
      "Permissions fetched successfully",
      permissions,
      null
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 400));
    }
    return next(new ErrorHandler("An unknown error occurred", 500));
  }
};
