import { successResponse } from "@utils/successResponse";
import { ErrorHandler } from "@utils/ErrorHandler";
import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "../../../prisma/generated/prisma";
import { v4 as uuidv4 } from "uuid";
import { sendAssignProductEmail } from "@utils/mail";
import { generateNextCode } from "@utils/codeGenerator";
import { AssignedStatus, AssignmentStatus } from "@src/enum/enum";
import { LogAction } from "@src/enum/enum";
import { createPagedResponse } from "@src/utils/pagedResponse";
import { createLogReport } from "@utils/logReport";
import * as dotenv from "dotenv";
import { MailActions } from "@src/enum/enum";
import { formatDate } from "@utils/formatDate";
import { foundSuperAdminUnitAdmin } from "@src/utils/foundSuperAdminUnitAdmin";
import { getSafeStringOrUndefined } from "@utils/paramHelper";

dotenv.config();

const prisma = new PrismaClient();

export const assignAsset = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      start_date,
      end_date,
      assignedToUserId,
      assignedToLocationId,
      inventoryProductDetailId,
      notes,
      approverId,
      issuerId,
    } = req.body;
    if (
      !inventoryProductDetailId ||
      !Array.isArray(inventoryProductDetailId) ||
      inventoryProductDetailId.length === 0 ||
      !start_date
    ) {
      return next(
        new ErrorHandler(
          "inventoryProductDetailId (array) and start_date are required",
          400
        )
      );
    }
    let assignedToUser = null;

    const assignedId = uuidv4();

    const assignments: any[] = [];
    const updatedProducts: any[] = [];
    const userId = parseInt(req?.user?.id ?? "0");

    for (const productId of inventoryProductDetailId) {
      const productDetail = await prisma.inventoryProductDetail.findUnique({
        where: { id: Number(productId) },
      });

      if (!productDetail) {
        return next(new ErrorHandler("Product not found", 404));
      }

      const alreadyAssigned = await prisma.productAssignment.findFirst({
        where: {
          inventoryProductDetailId: Number(productId),
          status: {
            in: [AssignmentStatus.Active, AssignmentStatus.Handovered],
          },
        },
      });

      if (alreadyAssigned) {
        return next(new ErrorHandler(`Product  already assigned`, 400));
      }

      const [assignment, updatedProduct] = await prisma.$transaction([
        prisma.productAssignment.create({
          data: {
            assignedId,
            uuid: await generateNextCode(
              prisma.productAssignment,
              "uuid",
              "ASSIGN-"
            ),
            inventoryProductDetailId: Number(productId),
            assignedToUserId: assignedToUserId
              ? Number(assignedToUserId)
              : null,
            assignedToLocationId: assignedToLocationId
              ? Number(assignedToLocationId)
              : null,
            issuerId: Number(issuerId),
            approverId: Number(approverId),
            startDate: new Date(start_date),
            endDate: end_date ? new Date(end_date) : null,
            isExtended: false,
            status: AssignmentStatus.Active,
            notes: notes || null,
          },
        }),

        prisma.inventoryProductDetail.update({
          where: { id: Number(productId) },
          data: {
            isUsed: true,
            assignedStatus: AssignedStatus.ASSIGNED,
          },
        }),
      ]);
      const log = await prisma.log.create({
        data: {
          action: LogAction.ASSIGN,
          userId: userId,
          relatedModelType: "prisma.productAssignment",
          relatedModelId: assignment?.id ?? null,
          details: JSON.stringify({
            assignment,
          }),
        },
      });
      let logDetails = null;
      const assignmentCreatedBy = await prisma.user.findUnique({
        where: { id: Number(issuerId) },
        select: {
          name: true,
        },
      });
      if (assignedToUserId) {
        assignedToUser = await prisma.user.findUnique({
          where: { id: Number(assignedToUserId) },
          select: {
            name: true,
            email: true,
            unit: { select: { name: true, id: true } },
          },
        });
        logDetails = `Assigned Product to ${assignedToUser?.name || "N/A"
          } issued By ${assignmentCreatedBy?.name || "N/A"}`;
      } else {
        const assignedToLocation = await prisma.location.findUnique({
          where: { id: Number(assignedToLocationId) },
          select: {
            name: true,
          },
        });
        logDetails = `Assigned Product to Location ${assignedToLocation?.name || "N/A"
          } issued By ${assignmentCreatedBy?.name || "N/A"} Remarks:- ${notes || "N/A"
          }`;
      }
      await createLogReport(
        assignment.uuid,
        productId,
        logDetails,
        assignment.createdAt,
        "Product Assignment",
        userId,
        log.id,
        `${process.env.FRONTEND_URL}/assetmanagement/assigndetails/${assignedId}`,
        "Assigned"
      );
      assignments.push(assignment);
      updatedProducts.push(updatedProduct);
    }

    const issuedToUser = assignedToUserId
      ? await prisma.user.findUnique({
        where: { id: Number(assignedToUserId) },
        select: {
          name: true,
          email: true,
          designation: true,
          mobile: true,
          username: true,
          department: {
            select: {
              name: true,
            },
          },
          unit: {
            select: {
              name: true,
              address: {
                select: {
                  addressLine1: true,
                },
              },
            },
          },
        },
      })
      : null;

    const issuer = await prisma.user.findUnique({
      where: { id: Number(issuerId) },
      select: {
        name: true,
        email: true,
      },
    });
    const approver = await prisma.user.findUnique({
      where: { id: Number(approverId) },
      select: {
        name: true,
        email: true,
      },
    });

    const assignedProductDetails = await prisma.inventoryProductDetail.findMany(
      {
        where: {
          id: {
            in: inventoryProductDetailId.map(Number),
          },
        },
        select: {
          id: true,
          uuid: true,
          assignedStatus: true,
          createdAt: true,
          updatedAt: true,
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
                  
                  brand: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                  category: {
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
      }
    );
    let emailList: Array<string> = [];
    if (issuedToUser?.email) {
      emailList.push(issuedToUser.email);
    }
    if (assignedToUser?.email) {
      emailList.push(assignedToUser.email);
    }

    if (assignedToUser?.unit?.id) {
      const unitAdminEmails = await foundSuperAdminUnitAdmin(
        Number(assignedToUser.unit.id),
        false
      );
      emailList = [...new Set([...emailList, ...unitAdminEmails])];
    }

    await sendAssignProductEmail(
      emailList,
      issuedToUser?.unit?.name || "N/A",
      issuedToUser?.name || "N/A",
      issuedToUser?.username || "N/A",
      issuedToUser?.designation || "N/A",
      issuedToUser?.mobile || "N/A",
      issuedToUser?.unit?.address?.addressLine1 || "N/A",
      issuedToUser?.email || "N/A",
      issuedToUser?.department?.name || "N/A",
      formatDate(start_date),
      formatDate(end_date),
      issuer?.name || "N/A",
      assignedProductDetails,
      res,
      next
    );

    return successResponse(
      res,
      200,
      "Assets assigned successfully",
      { assignedId, assignments, updatedProducts, assignedProductDetails },
      null
    );
  } catch (error) {
    console.error("Error assigning asset:", error);
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 500));
    }
    return next(new ErrorHandler("An unexpected error occurred", 500));
  }
};

export const getAssignList = async (
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

    const searchFilter = search
      ? {
        OR: [
          {
            inventoryProductDetail: {
              uuid: {
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
          {
            assignedToUser: {
              name: {
                contains: search,
              },
            },
          },
          {
            assignedToUser: {
              unit: {
                name: {
                  contains: search,
                },
              },
            },
          },
          {
            assignedToLocation: {
              name: {
                contains: search,
              },
            },
          },
          {
            inventoryProductDetail: {
              specValues: {
                some: {
                  value: {
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
                  productSpecValue: {
                    some: {
                      value: {
                        contains: search,
                      },
                    },
                  },
                },
              },
            },
          },
        ],
      }
      : {};
    const allowedSortFields = [
      "assignedId",
      "inventoryProductDetailId",
      "status",
      "uuid",
    ];
    const finalSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    let assignments = null;
    let totalCount = 0;
    if (user.roles.some((role) => role.name === "Super Admin")) {
      assignments = await prisma.productAssignment.findMany({
        where: {
          status: {
            in: [AssignmentStatus.Active, AssignmentStatus.Handovered],
          },
          ...searchFilter,
        },

        select: {
          assignedId: true,
          id: true,
          status: true,
          uuid: true,
          createdAt: true,
          startDate: true,
          endDate: true,
          assignedToUser: {
            select: {
              id: true,
              uuid: true,
              name: true,
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
          assignedToLocation: {
            select: {
              name: true,
              id: true,
              unitlocation: {
                select: {
                  unit: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
          inventoryProductDetail: {
            select: {
              id: true,
              uuid: true,
              assignedStatus: true,
              unit: {
                select: {
                  id: true,
                },
              },
              grInventoryProduct: {
                select: {
                  id: true,
                  product: {
                    select: {
                      id: true,
                      name: true,
                      
                      brand: {
                        select: {
                          id: true,
                          name: true,
                        },
                      },
                      productSpecValue: {
                        select: {
                          value: true,
                          specField: {
                            select: { name: true }
                          }
                        }
                      },
                    },
                  },
                },
              },
              specValues: {
                select: {
                  value: true,
                  specField: {
                    select: {
                      name: true,
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
      totalCount = await prisma.productAssignment.count({
        where: {
          status: {
            in: [AssignmentStatus.Active, AssignmentStatus.Handovered],
          },
          ...searchFilter,
        },
      });
    } else {
      assignments = await prisma.productAssignment.findMany({
        where: {
          status: {
            in: [AssignmentStatus.Active, AssignmentStatus.Handovered],
          },
          ...searchFilter,
          inventoryProductDetail: {
            unit: {
              id: Number(user.unitId),
            },
          },
        },

        select: {
          assignedId: true,
          id: true,
          status: true,
          uuid: true,
          createdAt: true,
          assignedToUser: {
            select: {
              id: true,
              uuid: true,
              name: true,
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
          assignedToLocation: {
            select: {
              name: true,
              id: true,
              unitlocation: {
                select: {
                  unit: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
          inventoryProductDetail: {
            select: {
              id: true,
              uuid: true,
              assignedStatus: true,
              unit: {
                select: {
                  id: true,
                },
              },
              grInventoryProduct: {
                select: {
                  id: true,
                  product: {
                    select: {
                      id: true,
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
        orderBy: {
          [finalSortBy]: sortOrder,
        },
        skip: (page - 1) * limit,
        take: limit,
      });
      totalCount = await prisma.productAssignment.count({
        where: {
          status: {
            in: [AssignmentStatus.Active, AssignmentStatus.Handovered],
          },
          ...searchFilter,
          inventoryProductDetail: {
            unit: {
              id: Number(user.unitId),
            },
          },
        },
      });
    }

    return successResponse(
      res,
      200,
      "Assignments retrieved successfully",
      createPagedResponse(assignments, page, limit, totalCount),
      null
    );
  } catch (error) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 500));
    }
    return next(new ErrorHandler("Internal Server Error", 500));
  }
};

export const getAssignDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const assignedId = getSafeStringOrUndefined(req.params.id);

    if (!assignedId) {
      return next(new ErrorHandler("Assigned ID is required", 400));
    }

    const assignments = await prisma.productAssignment.findMany({
      where: {
        assignedId,
        // status: {
        //   in: [AssignmentStatus.Active, AssignmentStatus.Handovered],
        // },
      },
      include: {
        inventoryProductDetail: {
          include: {
            unit: true,
            grInventoryProduct: {
              include: {
                product: {
                  include: {
                    brand: true,
                    category: true,
                    productSpecValue: {
                      include: {
                        specField: true,
                      },
                    },
                  },
                },
                grDetails: {
                  include: {
                    vendor: true,
                  },
                },
              },
            },
            qrCode: true,
            softwareInstalls: {
              where: {
                status: true,
              },
              include: {
                softwares: true,
                createdUser: { select: { id: true, name: true } },
              },
            },
            specValues: {
              include: {
                specField: true,
              },
            },
          },
        },
        assignedToUser: {
          select: {
            id: true,
            name: true,
            email: true,
            designation: true,
            department: { select: { id: true, name: true } },
          },
        },
        assignedToLocation: true,
        issuer: { select: { id: true, name: true, email: true } },
        approver: { select: { id: true, name: true, email: true } },
        productHandover: true,
        logs: {
          orderBy: { createdAt: "desc" },
          include: {
            performedBy: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }) as any;

    if (!assignments || assignments.length === 0) {
      return successResponse(
        res,
        200,
        "No data found for this assignedId",
        {
          data: null,
        },
        null
      );
    }

    const first = assignments[0];

    const responseData = {
      assignedId: first.assignedId,
      uuid: first.uuid,
      startDate: first.startDate,
      endDate: first.endDate,
      status: first.status,
      notes: first.notes,
      isExtended: first.isExtended,
      createdAt: first.createdAt,
      updatedAt: first.updatedAt,
      assignedTo: first.assignedToUserId
        ? { user: first.assignedToUser }
        : { location: first.assignedToLocation },
      issuer: first.issuer,
      approver: first.approver,
      handover: first.productHandover,
      logs: first.logs,
      products: assignments.map((assignment: any) => {
        const grProduct = assignment.inventoryProductDetail.grInventoryProduct;
        return {
          inventorProductId: assignment.inventoryProductDetail.id,
          id: grProduct.product.id,
          name: grProduct.product.name,
          brand: grProduct.product.brand,
          category: grProduct.product.category,
          subcategory: grProduct.product.subcategory,
          serialNo1: assignment.inventoryProductDetail.serialNo1,
          serialNo2: assignment.inventoryProductDetail.serialNo2,
          qrCode: assignment.inventoryProductDetail.qrCode?.qrCodeUrl,
          grDetails: grProduct.grDetails,
          softwareInstalls: assignment.inventoryProductDetail.softwareInstalls,
          specValues: assignment.inventoryProductDetail.specValues?.length ? assignment.inventoryProductDetail.specValues : grProduct.product.productSpecValue,
        };
      }),
    };

    return successResponse(
      res,
      200,
      "Assigned asset group fetched successfully",
      {
        data: responseData,
      },
      null
    );
  } catch (error) {
    console.error("Error in fetchAssignDetailsSingle:", error);
    return next(
      error instanceof Error
        ? new ErrorHandler(error.message, 500)
        : new ErrorHandler("An unexpected error occurred", 500)
    );
  }
};
