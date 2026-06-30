import { successResponse } from "@utils/successResponse";
import { Request, Response, NextFunction } from "express";
import { ErrorHandler } from "@utils/ErrorHandler";
import { AssignmentStatus, AssignedStatus } from "@src/enum/enum";
import { createPagedResponse } from "@src/utils/pagedResponse";
import { generateNextCode } from "@utils/codeGenerator";
import { createLogReport } from "@src/utils/logReport";
import { getSafeString, getSafeStringOrUndefined } from "@utils/paramHelper";
import * as dotenv from "dotenv";
import prisma from "../../utils/prisma";
dotenv.config();


export const getAssignedAssetsByUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = parseInt(getSafeString(req.params.userId));
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const sortBy = (req.query.sortBy as string) || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? "asc" : "desc";
    const allowedSortFields = [
      "assignedId",
      "inventoryProductDetailId",
      "status",
      "createdAt",
    ];
    const finalSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    const searchFilter = search
      ? {
        OR: [
          {
            inventoryProductDetail: {
              serialNo1: {
                contains: search,
              },
            },
          },
          {
            inventoryProductDetail: {
              grInventoryProduct: {
                product: {
                  name: {
                    contains: search,
                  },
                },
              },
            },
          },
          {
            inventoryProductDetail: {
              grInventoryProduct: {
                product: {
                  brand: {
                    name: {
                      contains: search,
                    },
                  },
                },
              },
            },
          },
          {
            assignedId: {
              contains: search,
            },
          },
        ],
      }
      : {};
    const assignedAssets = await prisma.productAssignment.findMany({
      where: {
        assignedToUserId: userId,
        status: {
          in: [AssignmentStatus.Active, AssignmentStatus.Handovered],
        },
        ...searchFilter,
      },
      select: {
        id: true,
        assignedId: true,
        status: true,
        assignedToUser: true,
        inventoryProductDetailId: true,
        createdAt: true,
        inventoryProductDetail: {
          select: {
            id: true,
            uuid: true,
            serialNo1: true,
            grInventoryProduct: {
              select: {
                product: {
                  select: {
                    id: true,
                    uuid: true,
                    name: true,
                    
                    brand: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        [finalSortBy]: sortOrder,
      },
    });
    const totalCount = await prisma.productAssignment.count({
      where: {
        assignedToUserId: userId,
        status: {
          in: [AssignmentStatus.Active, AssignmentStatus.Handovered],
        },
        ...searchFilter,
      },
    });
    return successResponse(
      res,
      200,
      "assigned asset list fetched successfully",
      createPagedResponse(assignedAssets, page, limit, totalCount),
      null
    );
  } catch (error) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 500));
    }
    return next(new ErrorHandler("Internal Server Error", 500));
  }
};

export const getAssignedAssetsByLocations = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const locationId = parseInt(getSafeString(req.params.locationId));
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const sortBy = (req.query.sortBy as string) || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? "asc" : "desc";
    const allowedSortFields = [
      "assignedId",
      "inventoryProductDetailId",
      "status",
      "createdAt",
    ];
    const finalSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    const searchFilter = search
      ? {
        OR: [
          {
            inventoryProductDetail: {
              serialNo1: {
                contains: search,
              },
            },
          },
          {
            inventoryProductDetail: {
              grInventoryProduct: {
                product: {
                  name: {
                    contains: search,
                  },
                },
              },
            },
          },
          {
            inventoryProductDetail: {
              grInventoryProduct: {
                product: {
                  brand: {
                    name: {
                      contains: search,
                    },
                  },
                },
              },
            },
          },
          {
            assignedId: {
              contains: search,
            },
          },
        ],
      }
      : {};

    const assignedAssets = await prisma.productAssignment.findMany({
      where: {
        assignedToLocationId: locationId,
        status: {
          in: [AssignmentStatus.Active, AssignmentStatus.Handovered],
        },
        ...searchFilter,
      },
      select: {
        id: true,
        assignedId: true,
        status: true,
        assignedToUser: true,
        inventoryProductDetailId: true,
        createdAt: true,
        inventoryProductDetail: {
          select: {
            id: true,
            uuid: true,
            serialNo1: true,
            grInventoryProduct: {
              select: {
                product: {
                  select: {
                    id: true,
                    uuid: true,
                    name: true,
                    
                    brand: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        [finalSortBy]: sortOrder,
      },
    });
    const totalCount = await prisma.productAssignment.count({
      where: {
        assignedToLocationId: locationId,
        status: {
          in: [AssignmentStatus.Active, AssignmentStatus.Handovered],
        },
        ...searchFilter,
      },
    });
    return successResponse(
      res,
      200,
      "assigned asset list fetched successfully",
      createPagedResponse(assignedAssets, page, limit, totalCount),
      null
    );
  } catch (error) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 500));
    }
    return next(new ErrorHandler("Internal Server Error", 500));
  }
};

export const unassignAsset = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      inventoryProductIds,
      assignmentIds,
      approvedBy,
      approvedDate,
      remarks,
    } = req.body;
    const userId = parseInt(req?.user?.id ?? "0");
    if (
      !Array.isArray(inventoryProductIds) ||
      inventoryProductIds.length === 0
    ) {
      return next(
        new ErrorHandler("Invalid or empty inventory product IDs", 400)
      );
    }
    await prisma.productAssignment.updateMany({
      where: {
        inventoryProductDetailId: { in: inventoryProductIds },
        assignedId: { in: assignmentIds },
      },
      data: {
        status: AssignmentStatus.PendingReturn,
      },
    });
    await prisma.inventoryProductDetail.updateMany({
      where: { id: { in: inventoryProductIds } },
      data: { assignedStatus: AssignedStatus.PENDING_RETURN },
    });
    const updatedAssignments = await prisma.productAssignment.findMany({
      where: {
        inventoryProductDetailId: { in: inventoryProductIds },
        assignedId: { in: assignmentIds },
      },
    });
        const updatedInventoryDetails =
      await prisma.inventoryProductDetail.findMany({
        where: {
          id: { in: inventoryProductIds },
        },
        include: {
          grInventoryProduct: {
            include: {
              product: {
                include: {
                  category: true,
                },
              },
            },
          },
        },
      });
    for (const inventoryProductId of inventoryProductIds) {
      const productUnassignment = await prisma.productUnAssignment.create({
        data: {
          uuid: await generateNextCode(
            prisma.productUnAssignment,
            "uuid",
            "mg-assn-"
          ),
          inventoryProductDetailId: inventoryProductId,
          approvedById: Number(approvedBy),
          unassignmentDate: new Date(approvedDate),
          remarks: remarks,
          createdById: userId,
        },
      });
      const inventoryProduct = await prisma.inventoryProductDetail.findUnique({
        where: { id: inventoryProductId },
      });
      if (inventoryProduct) {
        const log = await prisma.log.create({
          data: {
            action: "Unassigned Asset",
            userId: userId,
            details: JSON.stringify({
              productUnassignmentId: productUnassignment.id,
            }),
          },
        });
        let logDetails = "Product Unassignment";
        const approver = await prisma.user.findUnique({
          where: { id: Number(approvedBy) },
          select: { id: true, name: true },
        });
        if (updatedAssignments[0]?.assignedToLocationId) {
          const location = await prisma.location.findUnique({
            where: { id: updatedAssignments[0].assignedToLocationId },
            select: { id: true, name: true },
          });
          logDetails = `${inventoryProduct.uuid} Unassigned from location: ${location?.name} Approved By ${approver?.name} Remarks:- ${remarks}`;
        } else {
          if (updatedAssignments[0]?.assignedToUserId) {
            const user = await prisma.user.findUnique({
              where: { id: updatedAssignments[0].assignedToUserId },
              select: { id: true, name: true },
            });
            logDetails = `${inventoryProduct.uuid} Unassigned from user: ${user?.name} Approved By ${approver?.name} Remarks:- ${remarks}`;
          }
        }
        createLogReport(
          inventoryProduct.uuid,
          inventoryProductId,
          logDetails,
          productUnassignment.createdAt,
          "unassigned",
          userId,
          log.id,
          null,
          "Unassigning Asset"
        );
      }
    }

    return successResponse(
      res,
      200,
      "Asset unassigned successfully",
      { updatedAssignments, updatedInventoryDetails },
      null
    );
  } catch (error) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 500));
    }
    return next(new ErrorHandler("Internal Server Error", 500));
  }
};
