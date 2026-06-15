import { successResponse } from "@utils/successResponse";
import { Request, Response, NextFunction } from "express";
import { ErrorHandler } from "@utils/ErrorHandler";
import { PrismaClient } from "../../../prisma/generated/prisma";
import { createPagedResponse } from "@utils/pagedResponse";
import { getSafeString } from "@utils/paramHelper";

const prisma = new PrismaClient();

export const getMailConfigs = async (
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

    const allowedSortFields = ["unitId", "action", "createdAt"];
    const finalSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    const whereClause = search
      ? {
        OR: [
          { action: { contains: search } },
          { unit: { name: { contains: search } } },
        ],
      }
      : {};
    const mailConfigs = await prisma.mailConfig.findMany({
      where: { ...whereClause, status: true },
      include: {
        unit: {
          select: {
            id: true,
            name: true,
          },
        },
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
        unitAdmin: {
          select: {
            id: true,
            name: true,
          },
        },
        superAdmin: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { [finalSortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });
    const total = await prisma.mailConfig.count({
      where: { ...whereClause, status: true },
    });
    return successResponse(
      res,
      200,
      "Mail Config fetched successfully",
      createPagedResponse(mailConfigs, page, limit, total),
      null
    );
  } catch (error: unknown) {
    return next(
      new ErrorHandler(
        error instanceof Error ? error.message : "Internal Server Error",
        500
      )
    );
  }
};

export const getMailConfigById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(getSafeString(req.params.id));
    const mailConfig = await prisma.mailConfig.findUnique({
      where: { id: id, status: true },
      include: {
        unit: {
          select: {
            id: true,
            name: true,
          },
        },
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
        unitAdmin: {
          select: {
            id: true,
            name: true,
          },
        },
        superAdmin: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!mailConfig) {
      return next(new ErrorHandler("Mail Config not found", 404));
    }
    return successResponse(
      res,
      200,
      "Mail Config fetched successfully",
      mailConfig,
      null
    );
  } catch (error: unknown) {
    return next(
      new ErrorHandler(
        error instanceof Error ? error.message : "Internal Server Error",
        500
      )
    );
  }
};

export const createMailConfig = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { unitId, unitAdminId, action, subject, superAdminId } = req.body;
    const createdBy = parseInt(req.user?.id ?? "0");
    const newMailConfig = await prisma.mailConfig.create({
      data: {
        unitId: Number(unitId),
        unitAdminId: Number(unitAdminId),
        superAdminId: Number(superAdminId),
        createdBy,
        updatedBy: createdBy,
        action,
        subject,
      },
    });
    return successResponse(
      res,
      201,
      "Mail Config created successfully",
      newMailConfig,
      null
    );
  } catch (error: unknown) {
    return next(
      new ErrorHandler(
        error instanceof Error ? error.message : "Internal Server Error",
        500
      )
    );
  }
};

export const getUnitAdminsByUnitId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const unitId = parseInt(getSafeString(req.params.unitId));
    const unitAdmins = await prisma.user.findMany({
      where: {
        unitId: unitId,
        roles: { some: { name: "Unit Admin" } },
        status: true,
      },
      include: {
        roles: {
          select: {
            name: true,
          },
        },
      },
    });
    return successResponse(
      res,
      200,
      "Unit Admins fetched successfully",
      unitAdmins,
      null
    );
  } catch (error: unknown) {
    return next(
      new ErrorHandler(
        error instanceof Error ? error.message : "Internal Server Error",
        500
      )
    );
  }
};

export const getSuperAdmins = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const superAdmins = await prisma.user.findMany({
      where: {
        roles: { some: { name: "Super Admin" } },
        status: true,
      },
      include: {
        roles: {
          select: {
            name: true,
          },
        },
      },
    });
    return successResponse(
      res,
      200,
      "Super Admins fetched successfully",
      superAdmins,
      null
    );
  } catch (error: unknown) {
    return next(
      new ErrorHandler(
        error instanceof Error ? error.message : "Internal Server Error",
        500
      )
    );
  }
};

export const updateMailConfig = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(getSafeString(req.params.id));
    const { unitId, unitAdminId, action, subject, superAdminId } = req.body;
    const updatedBy = parseInt(req.user?.id ?? "0");
    const mailConfig = await prisma.mailConfig.findUnique({
      where: { id: id, status: true },
    });
    if (!mailConfig) {
      return next(new ErrorHandler("Mail Config not found", 404));
    }
    const updatedMailConfig = await prisma.mailConfig.update({
      where: { id: id },
      data: {
        unitId: Number(unitId),
        unitAdminId: Number(unitAdminId),
        superAdminId: Number(superAdminId),
        action,
        subject,
        updatedBy,
      },
    });
    return successResponse(
      res,
      200,
      "Mail Config updated successfully",
      updatedMailConfig,
      null
    );
  } catch (error: unknown) {
    return next(
      new ErrorHandler(
        error instanceof Error ? error.message : "Internal Server Error",
        500
      )
    );
  }
};
export const deleteMailConfig = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(getSafeString(req.params.id));
    const mailConfig = await prisma.mailConfig.findUnique({
      where: { id: id, status: true },
    });
    if (!mailConfig) {
      return next(new ErrorHandler("Mail Config not found", 404));
    }
    await prisma.mailConfig.delete({
      where: { id: id },
    });
    return successResponse(
      res,
      200,
      "Mail Config deleted successfully",
      null,
      null
    );
  } catch (error: unknown) {
    return next(
      new ErrorHandler(
        error instanceof Error ? error.message : "Internal Server Error",
        500
      )
    );
  }
};
