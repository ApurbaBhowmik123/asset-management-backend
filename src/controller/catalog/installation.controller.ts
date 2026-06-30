import { successResponse } from "@utils/successResponse";
import { ErrorHandler } from "@utils/ErrorHandler";
import { Request, Response, NextFunction } from "express";
import { generateNextCode } from "@utils/codeGenerator";
import { createPagedResponse } from "@utils/pagedResponse";
import { getSafeString } from "@utils/paramHelper";
import prisma from "../../utils/prisma";

export const createInstallation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = parseInt(req.user?.id ?? "0");
  try {
    const { name, version, required } = req.body;
    const uuid = await generateNextCode(
      prisma.installationSoftware,
      "uuid",
      "INS"
    );
    const installation = await prisma.installationSoftware.create({
      data: {
        uuid,
        name,
        version: version,
        required,
        createdBy: userId,
        updatedBy: userId,
      },
    });
    return successResponse(
      res,
      200,
      "Installation created successfully",
      installation,
      null
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 500));
    }
    return next(new ErrorHandler("Internal Server Error", 500));
  }
};

export const getAllInstallations = async (
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
      "version",
      "required",
      "createdAt",
      "updatedAt",
    ];
    const finalSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";
    const installations = await prisma.installationSoftware.findMany({
      where: {
        status: true,
        ...(search && {
          OR: [
            { name: { contains: search } },
            { version: { contains: search } },
          ],
        }),
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [finalSortBy]: sortOrder },
    });

    const totalCount = await prisma.installationSoftware.count({
      where: {
        status: true,
        ...(search && {
          OR: [
            { name: { contains: search } },
            { version: { contains: search } },
          ],
        }),
      },
    });
    const pagedResponse = createPagedResponse(
      installations,
      totalCount,
      page,
      limit
    );
    return successResponse(
      res,
      200,
      "Installations fetched successfully",
      pagedResponse,
      null
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 500));
    }
    return next(new ErrorHandler("Internal Server Error", 500));
  }
};

export const updateStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = parseInt(req.user?.id ?? "0");
  const installationId = parseInt(getSafeString(req.params.id));
  try {
    const installation = await prisma.installationSoftware.findUnique({
      where: { id: installationId },
    });
    if (!installation) {
      return next(new ErrorHandler("Installation not found", 404));
    }
    const updateinstallation = await prisma.installationSoftware.update({
      where: { id: installationId },
      data: {
        status: !installation.status,
        updatedBy: userId,
      },
    });
    return successResponse(
      res,
      200,
      `Installation ${updateinstallation.status ? "activated" : "deactivated"
      } successfully`,
      updateinstallation,
      null
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 500));
    }
    return next(new ErrorHandler("Internal Server Error", 500));
  }
};
