import { successResponse } from "@utils/successResponse";
import { Request, Response, NextFunction } from "express";
import { ErrorHandler } from "@utils/ErrorHandler";
import { PrismaClient } from "../../../prisma/generated/prisma/client";
import prisma from "../../utils/prisma";


export const getUnit = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = parseInt(req.user?.id ?? "0");
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
        status: true,
      },
      include: {
        roles: true,
      },
    });
    if (!user) {
      return next(
        new ErrorHandler("You have no permission to access this resource", 404)
      );
    }
    let unit = null;
    if (user.roles.some((role) => role.name === "Super Admin")) {
      unit = await prisma.unit.findMany({
        where: {
          status: true,
        },
        select: {
          id: true,
          name: true,
          status: true,
          unitlocation: {
            select: {
              location: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });
    } else {
      unit = await prisma.unit.findMany({
        where: {
          id: Number(user.unitId),
          status: true,
        },
        select: {
          id: true,
          name: true,
          status: true,
          unitlocation: {
            select: {
              location: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });
    }
    return successResponse(res, 200, "Unit fetched successfully", unit, null);
  } catch (error) {
    if (error instanceof ErrorHandler) {
      return next(new ErrorHandler(error.message, error.statusCode));
    }
    return next(new ErrorHandler("Internal Server Error", 500));
  }
};
