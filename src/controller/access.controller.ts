import { successResponse } from "../utils/successResponse";
import { ErrorHandler } from "../utils/ErrorHandler";
import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "../../prisma/generated/prisma";
import { connect } from "http2";

const prisma = new PrismaClient();

export const getMyAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }
    const userDetails = await prisma.user.findUnique({
      where: { id: Number(user.id) },
      include: {
        roles: {
          include: {
            permissions: true,
          },
        },
      },
    });
    if (!userDetails) {
      return next(new ErrorHandler("User not found", 404));
    }
    const slugs = userDetails.roles
      .flatMap((role: { permissions: any }) => role.permissions)
      .map((permission: { slug: any }) => permission.slug);
    const id = userDetails.roles
      .flatMap((role: { permissions: any }) => role.permissions)
      .map((permission: { id: number }) => permission.id);

    return successResponse(
      res,
      200,
      "Access fetched successfully",
      { slugs, id },
      null
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 400));
    }
    return next(new ErrorHandler("An unknown error occurred", 500));
  }
};

export const reloadSuperAdminAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await prisma.role.update({
      where: { name: "Super Admin" },
      data: {
        permissions: {
          connect: await prisma.permission.findMany(),
        },
      },
    });
    return successResponse(
      res,
      200,
      "Super Admin access reloaded successfully",
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
