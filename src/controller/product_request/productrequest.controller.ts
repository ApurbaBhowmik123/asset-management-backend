import { successResponse } from "@utils/successResponse";
import { Request, Response, NextFunction } from "express";
import { ErrorHandler } from "@utils/ErrorHandler";
import {
  AssignedStatus,
  AssetTransfer,
  LogAction,
  RequestStatus,
} from "@src/enum/enum";
import { createPagedResponse } from "@src/utils/pagedResponse";
import { createLog } from "@src/helpers/createLog";
import { createLogReport } from "@utils/logReport";
import { generateUniqueId } from "@src/utils/randomNumberGenerator";
import * as dotenv from "dotenv";
import { getSafeString } from "@utils/paramHelper";
import prisma from "../../utils/prisma";
dotenv.config();

export const productRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { InventoryProductDetailsId, Reason, RequestStatus } = req.body;
    const userID = parseInt(req.user?.id ?? "0");
    // Validate required fields
    if (!InventoryProductDetailsId || !Reason || !RequestStatus) {
      return next(
        new ErrorHandler(
          "InventoryProductDetailsId, Reason, and RequestStatus are required",
          400
        )
      );
    }

    // Validate logged-in user
    if (!req.user || !(req as any).user.id) {
      return next(
        new ErrorHandler("Unauthorized: Missing user information", 401)
      );
    }
    const requestBy = Number((req as any).user.id);
    if (isNaN(requestBy)) {
      return next(new ErrorHandler("Invalid user ID", 400));
    }

    // Ensure foreign key exists
    const productDetail = await prisma.inventoryProductDetail.findUnique({
      where: {
        id: Number(InventoryProductDetailsId),
        NOT: {
          assignedStatus: {
            in: [AssignedStatus.WRITE_OFF, AssignedStatus.E_WASTE],
          },
        },
      },
    });

    if (!productDetail) {
      return next(
        new ErrorHandler("This product is not available for request", 400)
      );
    }
    const updateProductDetail = await prisma.inventoryProductDetail.update({
      where: { id: Number(InventoryProductDetailsId) },
      data: { previousAssignedStatus: productDetail.assignedStatus },
    });

    // Save to DB
    const newRequest = await prisma.productRequest.create({
      data: {
        uuid: generateUniqueId(),
        InventoryProductDetailsId: Number(InventoryProductDetailsId),
        Reason: Reason.trim(),
        RequestStatus: RequestStatus.toUpperCase(),
        RequestBy: requestBy,
      },
      include: {
        createdUser: {
          select: {
            id: true,
            name: true,
          },
        },
        InventoryProductDetails: true,
      },
    });

    const log = await createLog({
      action: LogAction.PRODUCT_REQUEST,
      userId: userID,
      relatedModelType: "prisma.productRequest",
      relatedModelId: newRequest.id,
      details: newRequest,
      actionUrl: `/product-requests/${newRequest.id}`,
    });
    const inventoryProductDetail =
      await prisma.inventoryProductDetail.findUnique({
        where: { id: Number(InventoryProductDetailsId) },
      });
    if (log) {
      await createLogReport(
        newRequest.uuid,
        Number(InventoryProductDetailsId),
        `PRODUCT ${RequestStatus} REQUEST Remarks:- ${Reason}`,
        newRequest.createdAt,
        "Product Status change Request",
        userID,
        log.id,
        `${process.env.FRONTEND_URL}/product-status/${newRequest.uuid}`,
        inventoryProductDetail?.assignedStatus
      );
    }

    return successResponse(
      res,
      201,
      "Product request created successfully",
      newRequest,
      null
    );
  } catch (error) {
    console.error("Error in productRequest:", error);
    return next(
      new ErrorHandler(
        error instanceof Error ? error.message : "Internal Server Error",
        500
      )
    );
  }
};

export const productRequestGetAll = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Pagination, search, sorting defaults
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || "";
    const statusFilter = (req.query.status as string) || ""; // For RequestStatus filtering
    const sortBy = (req.query.sortBy as string) || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? "asc" : "desc";

    // Allowed sort fields
    const allowedSortFields = ["id", "RequestStatus", "createdAt", "updatedAt"];
    const finalSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    // Where clause
    const whereClause: any = {};

    if (search.trim()) {
      whereClause.OR = [
        { Reason: { contains: search } },
        { RequestStatus: { contains: search } },

        {
          InventoryProductDetails: {
            grInventoryProduct: {
              product: {
                name: { contains: search },
              },
            },
          },
        },
      ];
    }

    // Filter by RequestStatus if provided
    if (statusFilter.trim()) {
      whereClause.RequestStatus = { equals: statusFilter };
    }

    // Fetch paginated results
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
    let result = null;
    let totalCount = 0;
    if (user.roles.some((role) => role.name === "Super Admin")) {
      result = await prisma.productRequest.findMany({
        where: {
          ...whereClause,
          RequestStatus: {
            notIn: [RequestStatus.E_WASTE, "WRITE-OFF"],
          },
        },
        orderBy: { [finalSortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          createdUser: true,
          InventoryProductDetails: {
            include: {
              unit: true,
              grInventoryProduct: {
                include: { product: true },
              },
            },
          },
        },
      });

      // Count total for pagination
      totalCount = await prisma.productRequest.count({
        where: whereClause,
      });
    } else {
      result = await prisma.productRequest.findMany({
        where: {
          ...whereClause,
          InventoryProductDetails: { unit: { id: user.unitId } },
          RequestStatus: {
            notIn: [RequestStatus.E_WASTE, "WRITE-OFF"],
          },
        },
        orderBy: { [finalSortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          createdUser: true,
          InventoryProductDetails: {
            include: {
              unit: true,
              grInventoryProduct: {
                include: { product: true },
              },
            },
          },
        },
      });

      // Count total for pagination
      totalCount = await prisma.productRequest.count({
        where: whereClause,
      });
    }

    return successResponse(
      res,
      200,
      "Product Request list fetched successfully",
      createPagedResponse(result, page, limit, totalCount),
      null
    );
  } catch (error) {
    console.error("Error in productRequestGetAll:", error);
    return next(
      new ErrorHandler(
        error instanceof Error ? error.message : "Internal Server Error",
        500
      )
    );
  }
};

// export const requestApprove = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const requestId = Number(req.params.requestId);

//     if (!requestId || isNaN(requestId)) {
//       return next(new ErrorHandler("Valid requestId is required", 400));
//     }

//     // Validate logged-in user
//     if (!req.user || !(req as any).user.id) {
//       return next(new ErrorHandler("Unauthorized: Missing user information", 401));
//     }

//     const userId = Number((req as any).user.id);
// console.log("userId",req.user)
//     // Check if user is superadmin
//     const user = await prisma.user.findFirst({
//       where: { id: userId, status: true },
//       include: { roles: true },
//     });
// console.log("user",user)
//     if (!user) {
//       return next(new ErrorHandler("User not found or inactive", 404));
//     }

//     const isSuperAdmin = user.roles?.some((role) => role.name === "Super Admin");
//     console.log("isSuperAdmin",isSuperAdmin)
//     if (!isSuperAdmin) {
//       return next(new ErrorHandler("Only superadmin can approve requests", 403));
//     }

//     // Fetch the product request
//     const requestRecord = await prisma.productRequest.findUnique({
//       where: { id: requestId },
//       select: { InventoryProductDetailsId: true },
//     });

//     if (!requestRecord) {
//       return next(new ErrorHandler("Product request not found", 404));
//     }

//     // Run transaction to update both tables
//     await prisma.$transaction([
//       prisma.inventoryProductDetail.update({
//         where: { id: requestRecord.InventoryProductDetailsId },
//         data: { assignedStatus: "Approved" },
//       }),
//       prisma.productRequest.update({
//         where: { id: requestId },
//         data: { RequestStatus: "Approved" },
//       }),
//     ]);

//     return successResponse(res, 200, "Product request approved successfully", null, null);
//   } catch (error) {
//     console.error("Error in requestApprove:", error);
//     return next(
//       new ErrorHandler(
//         error instanceof Error ? error.message : "Internal Server Error",
//         500
//       )
//     );
//   }
// };

export const requestApprove = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const requestId = Number(req.params.requestId);
    const userID = parseInt(req.user?.id ?? "0");

    if (!requestId || isNaN(requestId)) {
      return next(new ErrorHandler("Valid requestId is required", 400));
    }

    // Validate logged-in user
    if (!req.user || !(req as any).user.id) {
      return next(
        new ErrorHandler("Unauthorized: Missing user information", 401)
      );
    }

    const userId = Number((req as any).user.id);
    console.log("userId", req.user);

    // Check if user is superadmin
    const user = await prisma.user.findFirst({
      where: { id: userId, status: true },
      include: { roles: true },
    });
    console.log("user", user);

    if (!user) {
      return next(new ErrorHandler("User not found or inactive", 404));
    }

    const isSuperAdmin = user.roles?.some(
      (role) => role.name.toLowerCase() === "super admin"
    );
    console.log("isSuperAdmin", isSuperAdmin);
    if (!isSuperAdmin) {
      return next(
        new ErrorHandler("Only superadmin can approve requests", 403)
      );
    }

    // Fetch the product request
    const requestRecord = await prisma.productRequest.findUnique({
      where: { id: requestId },
    });
    if (!requestRecord) {
      return next(new ErrorHandler("request record not found", 404));
    }
    const productDetail = await prisma.inventoryProductDetail.findUnique({
      where: { id: requestRecord.InventoryProductDetailsId },
    });
    if (productDetail) {
      let updatedStatus = requestRecord.RequestStatus;
      if (requestRecord.RequestStatus === "UNBLOCK") {
        updatedStatus = AssignedStatus.InStock;
      } else if (requestRecord.RequestStatus === "BLOCK") {
        updatedStatus = AssignedStatus.BLOCKED;
      }

      const updatedProductDetail = await prisma.inventoryProductDetail.update({
        where: {
          id: requestRecord.InventoryProductDetailsId,
        },
        data: {
          assignedStatus: updatedStatus,
        },
      });

      await prisma.productRequest.update({
        where: { id: requestId },
        data: { approvalStatus: "Approved", approverId: userID },
      });
      const log = await createLog({
        action: LogAction.PRODUCT_REQUEST,
        userId: userID,
        relatedModelType: "prisma.productRequest",
        relatedModelId: requestId,
        details: updatedProductDetail,
        actionUrl: `/product-requests/${requestId}`,
      });

      // if (log) {
      await createLogReport(
        requestRecord.uuid,
        requestRecord.InventoryProductDetailsId,
        `PRODUCT Status Approved ${requestRecord.RequestStatus} REQUEST`,
        requestRecord.createdAt,
        "Product Status change Request Approved",
        userID,
        null,
        `${process.env.FRONTEND_URL}/product-status/${requestRecord.uuid}`,
        updatedProductDetail?.assignedStatus,
        0
      );
      // }
    }

    return successResponse(
      res,
      200,
      "Product request approved successfully",
      null,
      null
    );
  } catch (error) {
    console.error("Error in requestApprove:", error);
    return next(
      new ErrorHandler(
        error instanceof Error ? error.message : "Internal Server Error",
        500
      )
    );
  }
};

export const productRequestDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const requestId = getSafeString(req.params.requestId);
    const productRequest = await prisma.productRequest.findUnique({
      where: { uuid: requestId },
      include: {
        createdUser: {
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
        InventoryProductDetails: {
          select: {
            uuid: true,
            serialNo1: true,
            assignedStatus: true,
            grInventoryProduct: {
              select: {
                product: {
                  select: {
                    name: true,
                    brand: {
                      select: {
                        name: true,
                      },
                    },
                    
                  },
                },
              },
            },
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
          },
        },
      },
    });
    const logDetails = await prisma.logReport.findMany({
      where: {
        transactionId: requestId,
      },
    });
    return successResponse(
      res,
      200,
      "Product request details fetched successfully",
      { productRequest, logDetails },
      null
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 500));
    }
    return next(new ErrorHandler("Internal Server Error", 500));
  }
};
