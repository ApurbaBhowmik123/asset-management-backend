import { successResponse } from "@utils/successResponse";
import { ErrorHandler } from "@utils/ErrorHandler";
import e, { Request, Response, NextFunction } from "express";
import { PrismaClient } from "../../../prisma/generated/prisma";
import { createPagedResponse } from "@src/utils/pagedResponse";
import { AssignedStatus } from "@src/enum/enum";
import { uploadFiles } from "@src/helpers/uploadFiles";
import { generateUniqueId } from "@src/utils/randomNumberGenerator";
import { createLog } from "@src/helpers/createLog";
import { createLogReport } from "@src/utils/logReport";
import { LogAction } from "@src/enum/enum";

const prisma = new PrismaClient();

// export const eWasteRequest = async (
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

//     const allowedSortFields = [
//       "uuid",
//       "createdAt",
//       "updatedAt",
//       "assignedStatus",
//     ];
//     const finalSortBy = allowedSortFields.includes(sortBy)
//       ? sortBy
//       : "createdAt";

//     // Build where clause conditionally
//     const whereClause: any = {
//       status: true,
//       assignedStatus: {
//         in: [AssignedStatus.E_WASTE, AssignedStatus.WRITE_OFF],
//       },
//     };

//     if (search.trim()) {
//       whereClause.OR = [
//         {
//           OR: [
//             { uuid: { contains: search } },
//             { serialNo1: { contains: search } },
//             { serialNo2: { contains: search } },
//             { assignedStatus: { equals: search as any } },

//             // From related inventoryProducts.product
//             {
//               grInventoryProduct: {
//                 product: {
//                   OR: [
//                     { name: { contains: search } },

//                     {
//                       brand: {
//                         name: { contains: search },
//                       },
//                     },
//                     {
//                       category: {
//                         name: { contains: search },
//                       },
//                     },
//                   ],
//                 },
//               },
//             },

//             // From specValues
//             {
//               specValues: {
//                 some: {
//                   OR: [
//                     { value: { contains: search } },
//                     {
//                       specField: {
//                         name: { contains: search },
//                       },
//                     },
//                   ],
//                 },
//               },
//             },

//             // From software installs
//             {
//               softwareInstalls: {
//                 some: {
//                   OR: [
//                     { value: { contains: search } },
//                     {
//                       softwares: {
//                         name: { contains: search },
//                       },
//                     },
//                     {
//                       softwares: {
//                         version: { contains: search },
//                       },
//                     },
//                   ],
//                 },
//               },
//             },
//           ],
//         },
//       ];
//     }
//     const userId = parseInt(req.user?.id ?? "0");
//     if (isNaN(userId)) {
//       return next(new ErrorHandler("Invalid user ID", 400));
//     }
//     const user = await prisma.user.findUnique({
//       where: {
//         id: userId,
//         status: true,
//       },
//       include: {
//         roles: true,
//       },
//     });
//     if (!user) {
//       return next(
//         new ErrorHandler("You have no permission to access this resource", 404)
//       );
//     }
//     let inventory = null;
//     let totalCount = 0;
//     if (user.roles.some((role) => role.name === "Super Admin")) {
//       inventory = await prisma.inventoryProductDetail.findMany({
//         where: whereClause,
//         orderBy: {
//           [finalSortBy]: sortOrder,
//         },
//         skip: (page - 1) * limit,
//         take: limit,
//         include: {
//           createdUser: {
//             select: {
//               name: true,
//             },
//           },
//           unit: {
//             select: {
//               name: true,
//               id: true,
//             },
//           },
//           location: {
//             select: {
//               id: true,
//               name: true,
//             },
//           },
//           updatedUser: {
//             select: {
//               name: true,
//             },
//           },
//           specValues: {
//             select: {
//               id: true,
//               value: true,
//               specField: {
//                 select: {
//                   id: true,
//                   name: true,
//                 },
//               },
//             },
//           },
//           AssignProductDetails: {
//             select: {
//               id: true,
//               assignedToUser: {
//                 select: {
//                   id: true,
//                   name: true,
//                   email: true,
//                   department: {
//                     select: {
//                       id: true,
//                       name: true,
//                     },
//                   },
//                   designation: true,
//                 },
//               },
//             },
//           },
//           grInventoryProduct: {
//             include: {
//               product: {
//                 include: {
//                   brand: true,
//                   category: true,
//                 },
//               },
//               grDetails: {
//                 select: {
//                   id: true,
//                   invoiceDate: true,
//                   invoiceNumber: true,
//                   grDate: true,
//                   grId: true,
//                   sapDate: true,
//                   sapId: true,
//                 },
//               },
//             },
//           },
//           softwareInstalls: {
//             where: {
//               status: true,
//             },
//             select: {
//               id: true,
//               value: true,
//               softwares: {
//                 select: {
//                   id: true,
//                   name: true,
//                   version: true,
//                 },
//               },
//             },
//           },
//           services: {
//             select: {
//               servicingCost: true,
//             },
//           },
//         },
//       });
//       totalCount = await prisma.inventoryProductDetail.count({
//         where: whereClause,
//       });
//     } else {
//       inventory = await prisma.inventoryProductDetail.findMany({
//         where: { ...whereClause, unit: { id: user.unitId } },
//         orderBy: {
//           [finalSortBy]: sortOrder,
//         },
//         skip: (page - 1) * limit,
//         take: limit,
//         include: {
//           createdUser: {
//             select: {
//               name: true,
//               id: true,
//             },
//           },
//           unit: {
//             select: {
//               name: true,
//               id: true,
//             },
//           },
//           location: {
//             select: {
//               id: true,
//               name: true,
//             },
//           },
//           updatedUser: {
//             select: {
//               id: true,
//               name: true,
//             },
//           },
//           specValues: {
//             select: {
//               id: true,
//               value: true,
//               specField: {
//                 select: {
//                   id: true,
//                   name: true,
//                 },
//               },
//             },
//           },
//           AssignProductDetails: {
//             select: {
//               id: true,
//               assignedToUser: {
//                 select: {
//                   id: true,
//                   name: true,
//                   email: true,
//                   department: {
//                     select: {
//                       id: true,
//                       name: true,
//                     },
//                   },
//                   designation: true,
//                 },
//               },
//             },
//           },
//           grInventoryProduct: {
//             include: {
//               product: {
//                 include: {
//                   brand: true,
//                   category: true,
//                 },
//               },
//               grDetails: {
//                 select: {
//                   id: true,
//                   invoiceDate: true,
//                   invoiceNumber: true,
//                   grDate: true,
//                   grId: true,
//                   sapDate: true,
//                   sapId: true,
//                 },
//               },
//             },
//           },
//           softwareInstalls: {
//             where: {
//               status: true,
//             },
//             select: {
//               id: true,
//               value: true,
//               softwares: {
//                 select: {
//                   id: true,
//                   name: true,
//                   version: true,
//                 },
//               },
//             },
//           },
//           services: {
//             select: {
//               servicingCost: true,
//             },
//           },
//         },
//       });
//       totalCount = await prisma.inventoryProductDetail.count({
//         where: { ...whereClause, unit: { id: user.unitId } },
//       });
//     }
//     inventory = inventory.map((item) => {
//       const ratePerPiece = item.grInventoryProduct?.ratePerPiece || 0;
//       const servicingCostTotal = item.services?.reduce(
//         (sum, service) => sum + (service.servicingCost || 0),
//         0
//       );

//       return {
//         ...item,
//         totalCost: ratePerPiece + servicingCostTotal,
//       };
//     });

//     const pagedResponse = createPagedResponse(
//       inventory,
//       page,
//       limit,
//       totalCount
//     );

//     return successResponse(
//       res,
//       200,
//       "E-Waste Inventory fetched successfully",
//       pagedResponse,
//       null
//     );
//   } catch (error) {
//     console.error("Error in eWasteRequest:", error);
//     return next(
//       new ErrorHandler(
//         error instanceof Error ? error.message : "Internal Server Error",
//         500
//       )
//     );
//   }
// };

export const eWasteRequest = async (
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
      "requestStatus",
    ];
    const finalSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    const eWasteRequest = await prisma.productRequest.findMany({
      where: {
        RequestStatus: {
          in: [AssignedStatus.E_WASTE, AssignedStatus.WRITE_OFF],
        },
        AND: {
          approvalStatus: {
            not: "Approved",
          },
        },
      },
      select: {
        id: true,
        RequestStatus: true,
        uuid: true,
        Reason: true,
        approvalStatus: true,
        createdAt: true,
        updatedAt: true,
        InventoryProductDetails: {
          select: {
            uuid: true,
            serialNo1: true,
            id: true,
            location: {
              select: {
                id: true,
                name: true,
              },
            },
            services: {
              select: {
                servicingCost: true,
              },
            },
            grInventoryProduct: {
              select: {
                id: true,
                ratePerPiece: true,
                product: {
                  select: {
                    name: true,
                    category: { select: { name: true } },
                    brand: { select: { name: true } }
                  }
                },
                grDetails: {
                  select: {
                    grDate: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        [finalSortBy]: sortOrder,
      },
      skip: (page - 1) * limit,
      take: limit,
    });
    const formatted = eWasteRequest.map((item) => {
      const ratePerPiece =
        item.InventoryProductDetails.grInventoryProduct?.ratePerPiece || 0;
      const servicingCostTotal = item.InventoryProductDetails.services?.reduce(
        (sum, service) => sum + (service.servicingCost || 0),
        0
      );

      return {
        ...item,
        totalCost: ratePerPiece + servicingCostTotal,
      };
    });
    const totalCount = await prisma.productRequest.count({
      where: {
        RequestStatus: {
          in: [AssignedStatus.E_WASTE, AssignedStatus.WRITE_OFF],
        },
        AND: {
          approvalStatus: {
            not: "Approved",
          },
        },
      },
    });
    return successResponse(
      res,
      200,
      "E-Waste Request fetched successfully",
      createPagedResponse(formatted, page, limit, totalCount),
      null
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 400));
    }
    return next(new ErrorHandler("An unknown error occurred", 500));
  }
};

export const approveEwaste = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let signatureFileURL = "";
    const signaturedFile = req.file;
    if (signaturedFile) {
      const uploadedFiles = await uploadFiles(
        "e-waste-approve",
        signaturedFile
      );

      if (uploadedFiles.length > 0) {
        signatureFileURL = `${process.env.APP_URL}${uploadedFiles[0]}`;
      } else {
        return next(new ErrorHandler("Failed to upload signature file", 500));
      }
    }
    const { issuerId, approverId, reviewerId, ProductRequestIds } = req.body;
    const userId = parseInt(req?.user?.id ?? "0");
    const transactionId = generateUniqueId();
    const eWasteRequestApprove = await prisma.ewasteRequestApprove.create({
      data: {
        issuerId: Number(issuerId),
        approverId: Number(approverId),
        reviewerId: Number(reviewerId),
        createdBy: userId,
        approveId: transactionId,
        signaturedFile: signatureFileURL,
      },
    });
    for (const productRequestId of ProductRequestIds) {
      const requestRecord = await prisma.productRequest.findUnique({
        where: { id: Number(productRequestId) },
      });
      if (!requestRecord) {
        return next(new ErrorHandler("request record not found", 404));
      }
      const productDetail = await prisma.inventoryProductDetail.findUnique({
        where: { id: requestRecord.InventoryProductDetailsId },
      });
      if (productDetail) {
        let updatedStatus = requestRecord.RequestStatus;

        const updatedProductDetail = await prisma.inventoryProductDetail.update(
          {
            where: {
              id: requestRecord.InventoryProductDetailsId,
            },
            data: {
              assignedStatus: updatedStatus,
            },
          }
        );

        await prisma.productRequest.update({
          where: { id: productRequestId },
          data: {
            approvalStatus: "Approved",
            approverId: userId,
            ewasteId: eWasteRequestApprove.id,
          },
        });
        const log = await createLog({
          action: LogAction.PRODUCT_REQUEST,
          userId: userId,
          relatedModelType: "prisma.productRequest",
          relatedModelId: productRequestId,
          details: updatedProductDetail,
          actionUrl: `/product-requests/${productRequestId}`,
        });

        if (log) {
          await createLogReport(
            requestRecord.uuid,
            requestRecord.InventoryProductDetailsId,
            `PRODUCT Status Approved ${requestRecord.RequestStatus} REQUEST`,
            requestRecord.createdAt,
            "Product Status change Request",
            userId,
            log.id,
            null,
            updatedProductDetail?.assignedStatus
          );
        }
      }
    }
    return successResponse(
      res,
      200,
      "E-Waste Request approved successfully",
      { eWasteRequestApprove },
      null
    );
  } catch (error) {
    console.error("Error approving E-Waste request:", error);
    return next(new ErrorHandler("Failed to approve E-Waste request", 500));
  }
};
