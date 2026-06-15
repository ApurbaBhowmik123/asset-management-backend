import { successResponse } from "@utils/successResponse";
import { ErrorHandler } from "@utils/ErrorHandler";
import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "../../../prisma/generated/prisma";
import { createLogReport } from "@utils/logReport";
import { createLog } from "@src/helpers/createLog";
import { createPagedResponse } from "@src/utils/pagedResponse";
import { getSafeString } from "@utils/paramHelper";
const prisma = new PrismaClient();

export const updateAssetStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const assetId = parseInt(getSafeString(req.params.id));
    const { remarks } = req.body;
    const userId = parseInt(req.user?.id ?? "0");
    const updateAsset = await prisma.inventoryProductDetail.update({
      where: { id: assetId },
      data: { status: false, updatedBy: userId, updatedAt: new Date() },
    });
    const log = await createLog({
      action: "soft_delete",
      userId,
      relatedModelId: assetId,
      relatedModelType: "prisma.inventoryProductDetail",
    });
    const user = await prisma.user.findUnique({ where: { id: userId } });
    await createLogReport(
      updateAsset.uuid,
      assetId,
      `Product soft deleted ${updateAsset.uuid} Deleted By ${user?.name} Remarks: ${remarks}`,
      updateAsset.updatedAt,
      "Soft Delete",
      userId,
      log ? log.id : null,
      null,
      "Soft Deleted",
      0
    );
    return successResponse(
      res,
      200,
      "Asset status updated successfully",
      updateAsset,
      null
    );
  } catch (error) {
    console.error("Error in updateAssetStatus:", error);
    return next(
      new ErrorHandler(
        error instanceof Error ? error.message : "Internal Server Error",
        500
      )
    );
  }
};

export const deletedAssetList = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || "";
    const sortBy = (req.query.sortBy as string) || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? "asc" : "desc";

    const allowedSortFields = [
      "uuid",
      "createdAt",
      "updatedAt",
      "assignedStatus",
    ];
    const finalSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";
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
    let inventory = null;
    let totalCount = 0;
    if (user.roles.some((role) => role.name === "Super Admin")) {
      inventory = await prisma.inventoryProductDetail.findMany({
        where: { status: false },
        orderBy: {
          [finalSortBy]: sortOrder,
        },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          createdUser: {
            select: {
              name: true,
            },
          },
          updatedUser: {
            select: {
              name: true,
            },
          },
          location: {
            select: {
              id: true,
              name: true,
            },
          },
          specValues: {
            select: {
              id: true,
              value: true,
              specField: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          AssignProductDetails: {
            select: {
              id: true,
              assignedToUser: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  department: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                  designation: true,
                },
              },
            },
          },
          grInventoryProduct: {
            include: {
              product: {
                include: {
                  brand: true,
                  category: true,
                },
              },
              grDetails: {
                select: {
                  id: true,
                  invoiceDate: true,
                  invoiceNumber: true,
                  grDate: true,
                  grId: true,
                  sapDate: true,
                  sapId: true,
                },
              },
            },
          },
          softwareInstalls: {
            where: {
              status: true,
            },
            select: {
              id: true,
              value: true,
              softwares: {
                select: {
                  id: true,
                  name: true,
                  version: true,
                },
              },
            },
          },
          services: {
            select: {
              servicingCost: true,
            },
          },
        },
      });
      totalCount = await prisma.inventoryProductDetail.count({
        where: { status: false },
      });
    } else {
      inventory = await prisma.inventoryProductDetail.findMany({
        where: {
          status: false,
          unit: user.unitId !== null ? { id: user.unitId } : undefined,
        },
        orderBy: {
          [finalSortBy]: sortOrder,
        },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          createdUser: {
            select: {
              name: true,
              id: true,
            },
          },
          updatedUser: {
            select: {
              name: true,
              id: true,
            },
          },
          unit: {
            select: {
              name: true,
              id: true,
            },
          },
          location: {
            select: {
              id: true,
              name: true,
            },
          },

          specValues: {
            select: {
              id: true,
              value: true,
              specField: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          AssignProductDetails: {
            select: {
              id: true,
              assignedToUser: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  department: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                  designation: true,
                },
              },
            },
          },
          grInventoryProduct: {
            include: {
              product: {
                include: {
                  brand: true,
                  category: true,
                },
              },
              grDetails: {
                select: {
                  id: true,
                  invoiceDate: true,
                  invoiceNumber: true,
                  grDate: true,
                  grId: true,
                  sapDate: true,
                  sapId: true,
                },
              },
            },
          },
          softwareInstalls: {
            where: {
              status: true,
            },
            select: {
              id: true,
              value: true,
              softwares: {
                select: {
                  id: true,
                  name: true,
                  version: true,
                },
              },
            },
          },
          services: {
            select: {
              servicingCost: true,
            },
          },
        },
      });
      totalCount = await prisma.inventoryProductDetail.count({
        where: {
          status: false,
          unit: user.unitId !== null ? { id: user.unitId } : undefined,
        },
      });
    }
    inventory = inventory.map((item) => {
      const ratePerPiece = item.grInventoryProduct?.ratePerPiece || 0;
      const servicingCostTotal = item.services?.reduce(
        (sum, service) => sum + (service.servicingCost || 0),
        0
      );

      return {
        ...item,
        totalCost: ratePerPiece + servicingCostTotal,
      };
    });

    const pagedResponse = createPagedResponse(
      inventory,
      page,
      limit,
      totalCount
    );
    return successResponse(
      res,
      200,
      "Deleted assets retrieved successfully",
      pagedResponse,
      null
    );
  } catch (error) {
    console.error("Error in deletedAssetList:", error);
    return next(
      new ErrorHandler(
        error instanceof Error ? error.message : "Internal Server Error",
        500
      )
    );
  }
};
