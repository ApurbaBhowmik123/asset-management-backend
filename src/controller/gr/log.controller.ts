import { successResponse } from "@utils/successResponse";
import { ErrorHandler } from "@utils/ErrorHandler";
import { Request, Response, NextFunction } from "express";
import { createPagedResponse } from "@utils/pagedResponse";
import { getSafeString } from "@utils/paramHelper";
import prisma from "../../utils/prisma";


export const getProductLog = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(getSafeString(req.params.inventoryProductDetailsId));
    const productDetails = await prisma.inventoryProductDetail.findUnique({
      where: { id, status: true, },
      include: {
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
        unit: {
          select: {
            id: true,
            name: true,
          },
        },
        grInventoryProduct: {
          include: {
            grDetails: true,
            product: {
              include: {
                brand: true,
                category: true,
                              },
            },
          },
        },
        softwareInstalls: {
          select: {
            id: true,
            value: true,
            createdAt: true,
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
          include: {
            createdUser: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        ticketAssets: {
          include: {
            ticket: {
              select: {
                createdBy: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                supportEngineer: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        productUnassignments: {
          include: {
            approvedBy: {
              select: {
                id: true,
                name: true,
              },
            },
            createdBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        transferDetails: {
          include: {
            sourceUnit: {
              select: {
                id: true,
                name: true,
              },
            },
            sourceUnitLocation: {
              select: {
                name: true,
              },
            },
            destinationUnit: {
              select: {
                id: true,
                name: true,
              },
            },
            destinationUnitLocation: {
              select: {
                id: true,
                name: true,
              },
            },
            createdByUser: {
              select: {
                id: true,
                name: true,
              },
            },
            productTransferAcceptance: {
              select: {
                approvedBy: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        AssignProductDetails: {
          include: {
            assignedToUser: {
              select: {
                id: true,
                name: true,
              },
            },
            assignedToLocation: {
              select: {
                id: true,
                name: true,
              },
            },
            issuer: {
              select: {
                id: true,
                name: true,
              },
            },
            approver: {
              select: {
                id: true,
                name: true,
              },
            },
            productHandover: {
              select: {
                id: true,
                handoverDate: true,
                signatureFile: true,
                pdfFile: true,
                isCompleted: true,
                createdAt: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                issuer: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        sapCodeAddedByUser: {
          select: {
            id: true,
            name: true,
          },
        },
        qrCode: true,
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
    return successResponse(
      res,
      200,
      "Log fetched successfully",
      productDetails,
      null
    );
  } catch (error) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 500));
    }
    return next(new ErrorHandler("Internal Server Error", 500));
  }
};

export const getLog = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(getSafeString(req.params.inventoryProductDetailsId));

    const logs = await prisma.logReport.findMany({
      where: {
        productId: id,
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            name: true,
          },
        },
        product: {
          select: {
            id: true,
            uuid: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return successResponse(res, 200, "Logs fetched successfully", logs, null);
  } catch (error) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 500));
    }
    return next(new ErrorHandler("Internal Server Error", 500));
  }
};

export const getLogs = async (
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
      "id",
      "uuid",
      "productId",
      "description",
      "createdAt",
      "updatedAt",
    ];
    const finalSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";
    const logs = await prisma.logReport.findMany({
      where: {
        OR: [
          { createdByUser: { name: { contains: search } } },
          { product: { uuid: { contains: search } } },
        ],
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            name: true,
          },
        },
        product: {
          select: {
            id: true,
            uuid: true,
          },
        },
      },
      orderBy: {
        [finalSortBy]: sortOrder,
      },
      skip: (page - 1) * limit,
      take: limit,
    });
    const totalLogs = await prisma.logReport.count({
      where: {
        OR: [
          { createdByUser: { name: { contains: search } } },
          { product: { uuid: { contains: search } } },
        ],
      },
    });
    return successResponse(
      res,
      200,
      "Logs fetched successfully",
      createPagedResponse(logs, page, limit, totalLogs),
      null
    );
  } catch (error) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 500));
    }
    return next(new ErrorHandler("Internal Server Error", 500));
  }
};
