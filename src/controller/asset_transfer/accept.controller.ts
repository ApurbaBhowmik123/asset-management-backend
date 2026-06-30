import { successResponse } from "@utils/successResponse";
import { ErrorHandler } from "@utils/ErrorHandler";
import { Request, Response, NextFunction } from "express";
import { createPagedResponse } from "@src/utils/pagedResponse";
import { getSafeString } from "@utils/paramHelper";
import prisma from "../../utils/prisma";


// export const allProductlist = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const page = parseInt(req.query.page as string) || 1;
//     const limit = parseInt(req.query.limit as string) || 10;
//     const search = (req.query.search as string) || "";
//     const sortBy = (req.query.sortBy as string) || "createdAt";
//     const sortOrder = req.query.sortOrder === "asc" ? "asc" : "desc";

//     if (!req.user || !(req as any).user.id) {
//       return next(new ErrorHandler("Unauthorized: Missing user information", 401));
//     }

//     const userId = Number((req as any).user.id);
//     if (isNaN(userId) || userId <= 0) {
//       return next(new ErrorHandler("Invalid user ID", 400));
//     }

//     const user = await prisma.user.findFirst({
//       where: { id: userId, status: true },
//       include: {
//         roles: true,
//         department: true,
//         location: true,
//       },
//     });

//     if (!user) {
//       return next(new ErrorHandler("User not found or inactive", 404));
//     }

//     const userRole = user.roles?.map((r) => r.name) || [];
//     const userUnitId = user.unitId || null;

//     const allowedSortFields = ["transferId", "status", "transferDate", "createdAt", "updatedAt"];
//     const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";

//     const whereClause: any = {};

//     if (search.trim()) {
//       whereClause.OR = [
//         { transferId: { contains: search } },
//         { status: { contains: search } },
//         { remarks: { contains: search } },
//         {
//           inventoryProductDetails: {
//             some: {
//               grInventoryProduct: {
//                 product: { name: { contains: search } },
//               },
//             },
//           },
//         },
//       ];
//     }

//     // Role-based filtering
//     if (!userRole.includes("superadmin") && userUnitId) {
//       whereClause.AND = [
//         {
//           OR: [{ sourceUnitId: userUnitId }, { destinationUnitId: userUnitId }],
//         },
//       ];
//     }

//     // Explicit query filtering for unit_admin frontend requests
//     if (req.query.sourceUnitId || req.query.destinationUnitId) {
//       whereClause.AND = whereClause.AND || [];
//       const orConditions: any[] = [];

//       if (req.query.sourceUnitId) {
//         orConditions.push({ sourceUnitId: Number(req.query.sourceUnitId) });
//       }
//       if (req.query.destinationUnitId) {
//         orConditions.push({ destinationUnitId: Number(req.query.destinationUnitId) });
//       }

//       if (orConditions.length > 0) {
//         whereClause.AND.push({ OR: orConditions });
//       }
//     }

//     const result = await prisma.productTransfer.findMany({
//       where: whereClause,
//       orderBy: { [finalSortBy]: sortOrder },
//       skip: (page - 1) * limit,
//       take: limit,
//       include: {
//         inventoryProductDetails: {
//           include: {
//             grInventoryProduct: {
//               include: { product: true },
//             },
//           },
//         },
//         sourceUnit: true,
//         sourceUnitLocation: {
//           include: {
//             location: true,
//           },
//         },
//         destinationUnit: true,
//         destinationUnitLocation: {
//           include: {
//             location: true,
//           },
//         },
//         issuer: true,
//         approver: true,
//         createdByUser: true,
//         updatedByUser: true,
//         productTransferAcceptance: true,
//       },
//     });

//     const totalCount = await prisma.productTransfer.count({
//       where: whereClause,
//     });

//     return successResponse(
//       res,
//       200,
//       "Product Transfer list fetched successfully",
//       createPagedResponse(result, page, limit, totalCount),
//       null
//     );
//   } catch (error) {
//     console.error("Error in allProductlist:", error);
//     return next(
//       new ErrorHandler(
//         error instanceof Error ? error.message : "Internal Server Error",
//         500
//       )
//     );
//   }
// };

export const allProductlist = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Pagination and sorting defaults
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || "";
    const sortBy = (req.query.sortBy as string) || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? "asc" : "desc";

    // Validate logged-in user
    if (!req.user || !(req as any).user.id) {
      return next(
        new ErrorHandler("Unauthorized: Missing user information", 401)
      );
    }

    const userId = Number((req as any).user.id);
    if (isNaN(userId) || userId <= 0) {
      return next(new ErrorHandler("Invalid user ID", 400));
    }

    // Fetch user from DB with roles and unitId
    const user = await prisma.user.findFirst({
      where: { id: userId, status: true },
      include: {
        roles: true,
        department: true,
        location: true,
      },
    });

    if (!user) {
      return next(new ErrorHandler("User not found or inactive", 404));
    }

    // Extract roles and unit ID (unitId from User table)
    const userRole = user.roles?.map((r) => r.name) || [];
    const userUnitId = user.unitId || null;

    console.log("User Roles:", userRole);
    console.log("User Unit ID:", userUnitId);

    //  Allowed sort fields
    const allowedSortFields = [
      "transferId",
      "status",
      "transferDate",
      "createdAt",
      "updatedAt",
    ];
    const finalSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    //  Build where clause
    const whereClause: any = {};

    if (search.trim()) {
      whereClause.OR = [
        { transferId: { contains: search } },
        { status: { contains: search } },
        { remarks: { contains: search } },
        {
          inventoryProductDetails: {
            some: {
              grInventoryProduct: {
                product: { name: { contains: search } },
              },
            },
          },
        },
      ];
    }

    // Apply role-based restriction if not superadmin
    if (!userRole.includes("superadmin") && userUnitId) {
      whereClause.AND = [];

      // If they are a source unit admin
      if (userRole.includes("sourceUnitAdmin")) {
        whereClause.AND.push({ sourceUnitId: userUnitId });
      }
      // If they are a destination unit admin
      else if (userRole.includes("destinationUnitAdmin")) {
        whereClause.AND.push({ destinationUnitId: userUnitId });
      }
      // If they are both or general unit admin, allow either source or destination
      else if (userRole.includes("Unit Admin")) {
        whereClause.AND.push({
          OR: [{ sourceUnitId: userUnitId }, { destinationUnitId: userUnitId }],
        });
      }
    }

    //  Fetch paginated results
    const result = await prisma.productTransfer.findMany({
      where: whereClause,
      orderBy: { [finalSortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        inventoryProductDetails: {
          include: {
            grInventoryProduct: {
              include: { product: true },
            },
          },
        },
        sourceUnit: true,
        sourceUnitLocation: true,
        destinationUnit: true,
        destinationUnitLocation: true,
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
        createdByUser: {
          select: {
            id: true,
            name: true,
          },
        },
        updatedByUser: {
          select: {
            id: true,
            name: true,
          },
        },
        productTransferAcceptance: true,
      },
    });

    const totalCount = await prisma.productTransfer.count({
      where: whereClause,
    });

    return successResponse(
      res,
      200,
      "Product Transfer list fetched successfully",
      createPagedResponse(result, page, limit, totalCount),
      null
    );
  } catch (error) {
    console.error("Error in allProductlist:", error);
    return next(
      new ErrorHandler(
        error instanceof Error ? error.message : "Internal Server Error",
        500
      )
    );
  }
};

// export const transferDetails = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const page = parseInt(req.query.page as string) || 1;
//     const limit = parseInt(req.query.limit as string) || 10;
//     const search = (req.query.search as string) || "";
//     const sortBy = (req.query.sortBy as string) || "createdAt";
//     const sortOrder = req.query.sortOrder === "asc" ? "asc" : "desc";

//     const { transferId } = req.params;

//     if (!transferId) {
//       return next(new ErrorHandler("Transfer ID is required", 400));
//     }

//     // Fetch the transfer with full relational data
//     const result = await prisma.productTransfer.findMany({
//       where: {
//         transferId: transferId,
//         OR: [
//           { status: { contains: search } },
//           { remarks: { contains: search } },
//         ],
//       },
//       orderBy: {
//         [sortBy]: sortOrder,
//       },
//       skip: (page - 1) * limit,
//       take: limit,
//       include: {
//         inventoryProductDetails: {
//           include: {
//             grInventoryProduct: {
//               include: {
//                 product: true,
//               },
//             },
//           },
//         },
//         sourceUnit: true,
//         sourceUnitLocation: {
//           include: {
//             location: true,
//           },
//         },
//         destinationUnit: true,
//         destinationUnitLocation: {
//           include: {
//             location: true,
//           },
//         },
//         issuer: true,
//         approver: true,
//         createdByUser: true,
//         updatedByUser: true,
//         productTransferAcceptance: true,
//       },
//     });

//     const totalCount = await prisma.productTransfer.count({
//       where: {
//         transferId: {
//           contains: transferId,
//         },
//         OR: [
//           { status: { contains: search } },
//           { remarks: { contains: search } },
//           {
//             inventoryProductDetails: {
//               grInventoryProduct: {
//                 product: {
//                   name: { contains: search },
//                 },
//               },
//             },
//           },
//         ],
//       },
//     });

//     return successResponse(
//       res,
//       200,
//       "Product Transfer details fetched successfully",
//       createPagedResponse(result, page, limit, totalCount),
//       null
//     );
//   } catch (error) {
//     console.error(error);
//     if (error instanceof Error) {
//       return next(new ErrorHandler(error.message, 500));
//     }
//     return next(new ErrorHandler("Internal Server Error", 500));
//   }
// };

export const transferDetails = async (
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

    const { transferId: rawTransferId } = req.params;
    const transferId = getSafeString(rawTransferId);

    if (!transferId) {
      return next(new ErrorHandler("Transfer ID is required", 400));
    }

    // Fetch transfers with status = "HOLD" only
    const result = await prisma.productTransfer.findMany({
      where: {
        transferId,
        // status: "HOLD",
        OR: [
          { remarks: { contains: search } },
          {
            inventoryProductDetails: {
              grInventoryProduct: {
                product: {
                  name: { contains: search },
                },
              },
            },
          },
        ],
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        inventoryProductDetails: {
          include: {
            grInventoryProduct: {
              include: {
                product: true,
              },
            },
          },
        },
        sourceUnit: true,
        sourceUnitLocation: true,
        destinationUnit: true,
        destinationUnitLocation: true,
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
        createdByUser: {
          select: {
            id: true,
            name: true,
          },
        },
        updatedByUser: {
          select: {
            id: true,
            name: true,
          },
        },
        productTransferAcceptance: true,
      },
    });

    const totalCount = await prisma.productTransfer.count({
      where: {
        transferId,
        status: "HOLD",
        OR: [
          { remarks: { contains: search } },
          {
            inventoryProductDetails: {
              grInventoryProduct: {
                product: {
                  name: { contains: search },
                },
              },
            },
          },
        ],
      },
    });

    return successResponse(
      res,
      200,
      "Product Transfer (HOLD) details fetched successfully",
      createPagedResponse(result, page, limit, totalCount),
      null
    );
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 500));
    }
    return next(new ErrorHandler("Internal Server Error", 500));
  }
};
