import { successResponse } from "@utils/successResponse";
import { Request, Response, NextFunction } from "express";
import { ErrorHandler } from "@utils/ErrorHandler";
import { PrismaClient } from "../../../prisma/generated/prisma/client";
import { createPagedResponse } from "@utils/pagedResponse";
import prisma from "../../utils/prisma";


const cleanUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  const appUrl = process.env.APP_URL || "http://localhost:8082";
  if (url.startsWith("undefined")) {
    return url.replace("undefined", appUrl);
  }
  return url;
};

export const getQrList = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const unitId = req.query.unitId ?? null;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || "";
    const sortBy = (req.query.sortBy as string) || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? "asc" : "desc";

    const allowedSortFields = [
      "uuid",
      "product_name",
      "updatedAt",
      "serialNo1",
      "serialNo2",
      "assignedStatus",
    ];
    const finalSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";
    let QrList = null;
    const userId = parseInt(req.user?.id ?? "0");
    if (isNaN(userId)) {
      return next(new ErrorHandler("Invalid user ID", 400));
    }
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
    if (user.roles.some((role) => role.name === "Super Admin")) {
      QrList = await prisma.inventoryProductDetail.findMany({
        where: {
          status: true,
          ...(unitId && {
            unitId: Number(unitId),
          }),
        },
        select: {
          uuid: true,
          serialNo1: true,
          location: {
            select: {
              name: true,
            },
          },
          serialNo2: true,
          updatedAt: true,
          unit: {
            select: {
              id: true,
              name: true,
               uuid: true,
            },
          },
          qrCode: {
            select: {
              id: true,
              qrCodeUrl: true,
            },
          },
          
          grInventoryProduct: {
            select: {
              grDetails:{
                select:{
                  invoiceDate:true
                }
              },
              product: {
                
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
      QrList = await prisma.inventoryProductDetail.findMany({
        where: {
          status: true,
          unitId: Number(user.unitId),
        },
        select: {
          uuid: true,
          serialNo1: true,
          location: {
            select: {
              name: true,
            },
          },
          serialNo2: true,
          updatedAt: true,
          unit: {
            select: {
              id: true,
              name: true,
              uuid: true,
            },
          },
          qrCode: {
            select: {
              id: true,
              qrCodeUrl: true,
            },
          },
          grInventoryProduct: {
            select: {
               grDetails:{
                select:{
                  invoiceDate:true
                }
              },
              product: {
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

    const filteredList = QrList.filter((item) => {
      const uuid = item.uuid?.toLowerCase() || "";
      const productName =
        item.grInventoryProduct?.product?.name?.toLowerCase() || "";
      const serial1 = item.serialNo1?.toLowerCase() || "";
      const serial2 = item.serialNo2?.toLowerCase() || "";
      const searchLower = search.toLowerCase();

      return (
        uuid.includes(searchLower) ||
        productName.includes(searchLower) ||
        serial1.includes(searchLower) ||
        serial2.includes(searchLower)
      );
    });

    const sortedList = filteredList.sort((a, b) => {
      const getValue = (item: typeof a) => {
        switch (finalSortBy) {
          case "uuid":
            return item.uuid || "";
          case "product_name":
            return item.grInventoryProduct?.product?.name || "";
          case "serialNo1":
            return item.serialNo1 || "";
          case "serialNo2":
            return item.serialNo2 || "";
          case "updatedAt":
            return new Date(item.updatedAt || "").getTime();
          default:
            return "";
        }
      };

      const aVal = getValue(a);
      const bVal = getValue(b);

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortOrder === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      } else {
        return sortOrder === "asc"
          ? (aVal as number) - (bVal as number)
          : (bVal as number) - (aVal as number);
      }
    });

    const totalCount = sortedList.length;
    const start = (page - 1) * limit;
    const pagedData = sortedList.slice(start, start + limit);

    const sanitizedPagedData = pagedData.map(item => ({
      ...item,
      qrCode: item.qrCode
        ? {
            ...item.qrCode,
            qrCodeUrl: cleanUrl(item.qrCode.qrCodeUrl),
          }
        : null
    }));

    const pagedResponse = createPagedResponse(
      sanitizedPagedData,
      page,
      limit,
      totalCount
    );

    return successResponse(
      res,
      200,
      "QR List fetched successfully",
      pagedResponse,
      null
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 500));
    }
    return next(new ErrorHandler("An unexpected error occurred", 500));
  }
};
