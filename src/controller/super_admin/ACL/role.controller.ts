import { successResponse } from "../../../utils/successResponse";
import { ErrorHandler } from "../../../utils/ErrorHandler";
import { Request, Response, NextFunction } from "express";
import { generateSlug } from "../../../common/generate_slug";
import { createPagedResponse } from "../../../utils/pagedResponse";
import prisma from "../../../utils/prisma";


export const getAllRoles = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const sortBy = (req.query.sortBy as string) || 'createdAt'; // default fallback
    const sortOrder = (req.query.sortOrder as string) === 'asc' ? 'asc' : 'desc';

    // Validate sortBy against allowed fields
    const allowedSortFields = ['name', 'slug', 'createdAt', 'updatedAt'];
    const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    // Prepare filters
    const whereClause = search
      ? {
          OR: [
            { name: { contains: search, } },
            { description: { contains: search, } },
          ],
        }
      : {};

    // Count total first
    const total = await prisma.role.count({ where: whereClause });

    // Get paginated data
    const roles = await prisma.role.findMany({
      where: whereClause,
      orderBy: {
        [finalSortBy]: sortOrder,
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const paged = createPagedResponse(roles, page, limit, total);

    return successResponse(res, 200, "Roles fetched successfully", paged, null);
  } catch (error: unknown) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 400));
    }
    return next(new ErrorHandler("An unknown error occurred", 500));
  }
};

export const getRoleById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const roleId = req.params.id;
    const role = await prisma.role.findUnique({
      where: { id: Number(roleId) },
      include: {
        permissions: true,
      },
    });
    if (!role) {
      return next(new ErrorHandler("Role not found", 404));
    }
    return successResponse(res, 200, "Role fetched successfully", role, null);
  } catch (error: unknown) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 400));
    }
    return next(new ErrorHandler("An unknown error occurred", 500));
  }
};

export const createRole = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, description, permissions: permissionIds } = req.body;
    const permissions = await prisma.permission.findMany({
      where: { id: { in: permissionIds } },
    });

    if (permissions.length !== permissionIds.length) {
      return next(new ErrorHandler("One or more permissions are invalid", 400));
    }
    const slug = generateSlug(name);
    const role = await prisma.role.create({
      data: {
        name,
        description,
        slug,
        permissions: { connect: permissions.map((p) => ({ id: p.id })) },
      },
    });

    return successResponse(res, 201, "Role created successfully", role, null);
  } catch (error: unknown) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 400));
    }
    return next(new ErrorHandler("An unknown error occurred", 500));
  }
};

export const updateRole = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const roleId = req.params.id;
    const { name, description, permissions: permissionIds } = req.body;

    const role = await prisma.role.findUnique({
      where: { id: Number(roleId) },
    });
    if (!role) {
      return next(new ErrorHandler("Role not found", 404));
    }

    const permissions = await prisma.permission.findMany({
      where: { id: { in: permissionIds } },
    });
    if (permissions.length !== permissionIds.length) {
      return next(new ErrorHandler("One or more permissions are invalid", 400));
    }

    await prisma.role.update({
      where: { id: Number(roleId) },
      data: {
        name: name || role.name,
        description: description || role.description,
        permissions: { set: permissions.map((p) => ({ id: p.id })) },
        slug: generateSlug(name || role.name),
      },
    });
    successResponse(res, 200, "Role updated successfully", role, null);
  } catch (error: unknown) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 400));
    }
    return next(new ErrorHandler("An unknown error occurred", 500));
  }
};

export const deleteRole = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const roleId = req.params.id;
    const role = await prisma.role.findUnique({
      where: { id: Number(roleId) },
    });
    if (!role) {
      return next(new ErrorHandler("Role not found", 404));
    }
    await prisma.role.delete({
      where: { id: Number(roleId) },
    });
    return successResponse(res, 200, "Role deleted successfully", null, null);
  } catch (error: unknown) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 400));
    }
    return next(new ErrorHandler("An unknown error occurred", 500));
  }
};
