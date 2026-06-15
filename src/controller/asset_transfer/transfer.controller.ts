import { successResponse } from "@utils/successResponse";
import { ErrorHandler } from "@utils/ErrorHandler";
import { Request, Response, NextFunction } from "express";
import { generateNextCode } from "@src/utils/codeGenerator";
import { PrismaClient } from "../../../prisma/generated/prisma";
import { AssetTransfer } from "@src/enum/enum";
import { AssignedStatus } from "@src/enum/enum";
import { createLogReport } from "@utils/logReport";
import { createPagedResponse } from "@utils/pagedResponse";
import * as dotenv from "dotenv";
dotenv.config();

const prisma = new PrismaClient();

export const fetTransferableProductlist = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = parseInt(req.user?.id ?? "0");
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = (req.query.search as string) || "";
  const sortBy = (req.query.sortBy as string) || "createdAt";
  const sortOrder = req.query.sortOrder === "asc" ? "asc" : "desc";
  const { sourceUnitId, sourceLocationId } = req.query;

  const allowedSortFields = [
    "name",
    "category_name",
    "subcategory_name",
    "product_name",
    "updatedAt",
  ];
  const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";

  if (isNaN(userId)) {
    return next(new ErrorHandler("Invalid user ID", 400));
  }

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

    const searchFilter: any[] = [];

    if (search) {
      searchFilter.push(
        {
          uuid: {
            contains: search,
          },
        },
        {
          grInventoryProduct: {
            product: {
              name: {
                contains: search,
              },
            },
          },
        },
        {
          grInventoryProduct: {
            product: {
              category: {
                name: {
                  contains: search,
                },
              },
            },
          },
        },
        {
          grInventoryProduct: {
            product: {
              subcategory: {
                name: {
                  contains: search,
                },
              },
            },
          },
        }
      );
    }

    const baseWhereClause: any = {
      status: true,
      assignedStatus: {
        in: [
          AssignedStatus.InStock,
          AssignedStatus.InstallationCompleted,
          AssignedStatus.ASSIGNED,
        ],
      },
      ...(sourceUnitId ? { unitId: Number(sourceUnitId) } : {}),
      ...(sourceLocationId ? { locationId: Number(sourceLocationId) } : {}),
      ...(searchFilter.length ? { OR: searchFilter } : {}),
    };

    if (!user.roles.some((role) => role.name === "Super Admin")) {
      baseWhereClause.unitId = Number(user.unitId);
    }

    const transferableList = await prisma.inventoryProductDetail.findMany({
      where: baseWhereClause,
      select: {
        id: true,
        uuid: true,
        assignedStatus: true,
        createdAt: true,
        updatedAt: true,
        unitId: true,
        locationId: true,
        grInventoryProduct: {
          select: {
            id: true,
            grDetails: {
              select: {
                id: true,
                status: true,
              },
            },
            product: {
              select: {
                id: true,
                name: true,
                category: { select: { id: true, name: true } }
              },
            },
          },
        },
      },
    });

    const sortedList = transferableList.sort((a, b) => {
      const getValue = (item: typeof a) => {
        const product = item.grInventoryProduct?.product;
        switch (finalSortBy) {
          case "name":
          case "product_name":
            return product?.name || "";
          case "category_name":
            return product?.category?.name || "";
          
          case "updatedAt":
            return new Date(item.updatedAt || "").getTime();
          default:
            return new Date(item.createdAt || "").getTime();
        }
      };

      const aValue = getValue(a);
      const bValue = getValue(b);

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortOrder === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return sortOrder === "asc"
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number);
      }
    });

    const totalCount = sortedList.length;
    const start = (page - 1) * limit;
    const pagedData = sortedList.slice(start, start + limit);

    const pagedResponse = createPagedResponse(
      pagedData,
      page,
      limit,
      totalCount
    );

    return successResponse(
      res,
      200,
      "Transferable product list fetched successfully",
      pagedResponse,
      null
    );
  } catch (error) {
    console.error("Error in fetTransferableProductlist:", error);
    return next(
      error instanceof Error
        ? new ErrorHandler(error.message, 500)
        : new ErrorHandler("An unexpected error occurred", 500)
    );
  }
};

export const createTransfer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      issuerId,
      approverId,
      transferDate,
      sourceUnitId,
      sourceUnitLocationId,
      destinationUnitId,
      destinationUnitLocationId,
      remarks,
      inventoryProductDetailIds,
    } = req.body;
    const transferId = await generateNextCode(
      prisma.productTransfer,
      "transferId",
      "TRF-"
    );
    const userId = parseInt(req?.user?.id ?? "0");
    if (inventoryProductDetailIds.length === 0) {
      return next(
        new ErrorHandler("No inventory product details provided", 400)
      );
    }
    for (const inventoryProductDetailId of inventoryProductDetailIds) {
      const productTransfer = await prisma.productTransfer.create({
        data: {
          transferId: transferId,
          issuerId: Number(issuerId),
          approverId: Number(approverId),
          transferDate: new Date(transferDate),
          inventoryProductDetailId: Number(inventoryProductDetailId),
          sourceUnitId: Number(sourceUnitId),
          sourceLocationId: Number(sourceUnitLocationId),
          destinationUnitId: Number(destinationUnitId),
          destinationLocationId: Number(destinationUnitLocationId),
          remarks: remarks,
          createdBy: userId,
          updateBy: userId,
          status: AssetTransfer.HOLD,
        },
      });
      const log = await prisma.log.create({
        data: {
          action: "Create Asset Transfer",
          userId: userId,
          details: JSON.stringify({
            transferId: transferId,
          }),
        },
      });
      await createLogReport(
        productTransfer.transferId,
        inventoryProductDetailId,
        "Product Transfer Initiated",
        productTransfer.createdAt,
        "Product Transfer",
        userId,
        log.id,
        `${process.env.FRONTEND_URL}/transfer/transfer/${transferId}`,
        "Product Transfer Initiated"
      );
    }
    const inventoryProductDetails =
      await prisma.inventoryProductDetail.findMany({
        where: {
          id: {
            in: inventoryProductDetailIds.map(Number),
          },
        },
      });
    for (const inventoryProductDetail of inventoryProductDetails) {
      await prisma.inventoryProductDetail.update({
        where: {
          id: inventoryProductDetail.id,
        },
        data: {
          previousAssignedStatus: inventoryProductDetail.assignedStatus,
          assignedStatus: AssignedStatus.BLOCKED,
        },
      });
    }
    return successResponse(
      res,
      200,
      "Asset transfer created successfully",
      null,
      null
    );
  } catch (error) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 500));
    }
    return next(new ErrorHandler("Internal Server Error", 500));
  }
};
