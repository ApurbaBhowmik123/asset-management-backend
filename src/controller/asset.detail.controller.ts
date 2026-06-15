import { successResponse } from "@utils/successResponse";
import { PrismaClient } from "../../prisma/generated/prisma/client";
import { Request, Response, NextFunction } from "express";
import { ErrorHandler } from "@utils/ErrorHandler";
import { getSafeStringOrUndefined } from "@utils/paramHelper";

const prisma = new PrismaClient();

export const getAssetById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = getSafeStringOrUndefined(req.params.id);

    const asset = await prisma.inventoryProductDetail.findUnique({
      where: { uuid: id },
      select: {
        uuid: true,
        serialNo1: true,
        unit: {
          select: {
            name: true,
          },
        },
        location: {
          select: {
            name: true,
          },
        },
        grInventoryProduct: {
          select: {
            product: {
              select: {
                name: true,
                category: {
                  select: {
                    name: true,
                  },
                },
                brand: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            grDetails: {
              select: {
                grDate: true,
              },
            },
          },
        },
      },
    });

    if (!asset) return next(new ErrorHandler("Asset not found", 404));

    return successResponse(res, 200, "Fetched asset", asset, null);
  } catch (error) {
    next(error);
  }
};
