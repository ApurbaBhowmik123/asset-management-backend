import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "../../../prisma/generated/prisma";
import { successResponse } from "../../utils/successResponse";
import { ErrorHandler } from "../../utils/ErrorHandler";
import { generateNextCode } from "@src/utils/codeGenerator";
import { createPagedResponse } from "@src/utils/pagedResponse";

const prisma = new PrismaClient();

export const getDepartments = async (
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
          OR: [
            { name: { contains: search } },
            { description: { contains: search } },
          ],
        }
      : {};

    const total = await prisma.department.count({ where: whereClause });

    const departments = await prisma.department.findMany({
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

    const paged = createPagedResponse(departments, page, limit, total);
    return successResponse(
      res,
      200,
      "Departments fetched successfully",
      paged,
      null
    );
  } catch (error: unknown) {
    if (error instanceof Error)
      return next(new ErrorHandler(error.message, 400));
    return next(new ErrorHandler("An unknown error occurred", 500));
  }
};

export const getDepartmentById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const department = await prisma.department.findUnique({
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

    if (!department) {
      return next(new ErrorHandler("Department not found", 404));
    }

    return successResponse(
      res,
      200,
      "Department fetched successfully",
      department,
      null
    );
  } catch (error: unknown) {
    if (error instanceof Error)
      return next(new ErrorHandler(error.message, 400));
    return next(new ErrorHandler("An unknown error occurred", 500));
  }
};
export const createDepartment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const departments = Array.isArray(req.body) ? req.body : [req.body];

    const createdDepartments = [];

    for (const dept of departments) {
      const { name, description } = dept;

      const existing = await prisma.department.findFirst({
        where: { name },
      });

      if (existing) {
        return next(
          new ErrorHandler(`Department name "${name}" already exists`, 409)
        );
      }

      const uuid = await generateNextCode(prisma.department, "uuid", "DEPT");

      const created = await prisma.department.create({
        data: {
          uuid,
          name,
          description,
          createdBy: Number(userId),
        },
      });

      createdDepartments.push(created);
    }

    return successResponse(
      res,
      201,
      "Department(s) created successfully",
      createdDepartments,
      null
    );
  } catch (error: unknown) {
    if (error instanceof Error)
      return next(new ErrorHandler(error.message, 400));
    return next(new ErrorHandler("An unknown error occurred", 500));
  }
};

export const updateDepartment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const userId = (req as any).user?.id;

    const findDepartment = await prisma.department.findUnique({
      where: { id: Number(id) },
    });

    if (!findDepartment) {
      return next(new ErrorHandler("Department not found", 404));
    }

    const existing = await prisma.department.findFirst({
      where: {
        name,
        NOT: { id: Number(id) },
      },
    });

    if (existing) {
      return next(new ErrorHandler("Department name already exists", 409));
    }

    const department = await prisma.department.update({
      where: { id: Number(id) },
      data: {
        name,
        description,
        updatedBy: Number(userId),
        updatedAt: new Date(),
      },
    });

    return successResponse(
      res,
      200,
      "Department updated successfully",
      department,
      null
    );
  } catch (error: unknown) {
    if (error instanceof Error)
      return next(new ErrorHandler(error.message, 400));
    return next(new ErrorHandler("An unknown error occurred", 500));
  }
};

export const deleteDepartment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const department = await prisma.department.findUnique({
      where: { id: Number(id) },
    });

    if (!department) {
      return next(new ErrorHandler("Department not found", 404));
    }

    await prisma.department.delete({
      where: { id: Number(id) },
    });

    return successResponse(
      res,
      200,
      "Department deleted successfully",
      null,
      null
    );
  } catch (error: unknown) {
    if (error instanceof Error)
      return next(new ErrorHandler(error.message, 400));
    return next(new ErrorHandler("An unknown error occurred", 500));
  }
};
