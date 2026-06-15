import { successResponse } from "@utils/successResponse";
import { ErrorHandler } from "@utils/ErrorHandler";
import { Request, Response, NextFunction } from "express";
import { PrismaClient, Prisma } from "../../../prisma/generated/prisma";
import { createPagedResponse } from "@src/utils/pagedResponse";
import { AssignedStatus, AssignmentStatus } from "@src/enum/enum";
import { getSafeStringOrUndefined } from "@utils/paramHelper";
const prisma = new PrismaClient();

export const fetchUserList = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = parseInt(req.user?.id ?? "0");

  try {
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        status: true,
      },
      include: {
        roles: true,
        department: true,
        location: true,
      },
    });

    if (!user) {
      return next(
        new ErrorHandler("You have no permission to access this resource", 404)
      );
    }

    let userList;

    if (user.roles?.some((role) => role.name === "Super Admin")) {
      userList = await prisma.user.findMany({
        where: {
          status: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
          designation: true,
          roles: true,
          mobile: true,
          mobile_prefix: true,
          uuid: true,
          department: true,
          location: true,
        },
      });
    } else {
      userList = await prisma.user.findMany({
        where: {
          unitId: Number(user.unitId),
          status: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
          designation: true,
          roles: true,
          mobile: true,
          mobile_prefix: true,
          uuid: true,
          department: true,
          location: true,
        },
      });
    }

    return successResponse(
      res,
      200,
      "Asset users retrieved successfully",
      userList,
      null
    );
  } catch (error) {
    console.error("Error fetching user list:", error);
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 500));
    }
    return next(new ErrorHandler("An unexpected error occurred", 500));
  }
};

export const fetchAssignableProducList = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = parseInt(req.user?.id ?? "0");
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = (req.query.search as string)?.trim();
  const sortBy = (req.query.sortBy as string) ?? "createdAt";
  const sortOrder = req.query.sortOrder === "asc" ? "asc" : "desc";

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

    const whereClause: any = {
      status: true,
    };

    if (search) {
      whereClause.OR = [
        { uuid: { contains: search } },
        // { serialNo1: { contains: search } },
        // { serialNo2: { contains: search } },
        { assignedStatus: { equals: search as any } },
        {
          grInventoryProduct: {
            product: {
              OR: [
                { name: { contains: search } },
                {
                  category: {
                    name: { contains: search },
                  },
                },
                {
                  subcategory: {
                    name: { contains: search },
                  },
                },
              ],
            },
          },
        },
      ];
    }

    let assignableProductList;

    const isSuperAdmin = user.roles.some((role) => role.name === "Super Admin");

    const baseWhere = isSuperAdmin
      ? {
        ...whereClause,
        assignedStatus: {
          notIn: [
            AssignedStatus.ASSIGNED,
            AssignedStatus.BLOCKED,
            AssignedStatus.WRITE_OFF,
            AssignedStatus.E_WASTE,
          ],
        },
      }
      : {
        ...whereClause,
        unitId: Number(user.unitId),
        OR: [
          {
            grInventoryProduct: {
              product: {
                category: {
                  name: "IT Assets",
                },
              },
            },
            assignedStatus: AssignedStatus.InstallationCompleted,
          },
          {
            grInventoryProduct: {
              product: {
                category: {
                  NOT: {
                    name: "IT Assets",
                  },
                },
              },
            },
            assignedStatus: AssignedStatus.InStock,
          },
        ],
      };

    assignableProductList = await prisma.inventoryProductDetail.findMany({
      where: baseWhere,
      select: {
        id: true,
        uuid: true,
        assignedStatus: true,
        createdAt: true,
        updatedAt: true,
        isUsed: true,
        status: true,
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

    // Sort in-memory
    const sortedList = assignableProductList.sort((a, b) => {
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
      "Assignable product list fetched successfully",
      pagedResponse,
      null
    );
  } catch (error) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 500));
    }
    return next(new ErrorHandler("An unexpected error occurred", 500));
  }
};

export const fetchAssignDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Parse and validate query params
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string) || 10);
    const search = (req.query.search as string) || "";
    const sortBy = (req.query.sortBy as string) || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? "asc" : "desc";

    const allowedSortFields = ["createdAt", "startDate", "endDate", "status"];
    const orderField = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    // Build the base where clause for filtering
    const baseWhereClause: Prisma.ProductAssignmentWhereInput = {
      status: {
        in: [AssignmentStatus.Active],
      },
      assignedToUserId: { not: null }, // Only assignments to users, not locations
    };

    // Add search filters if search term is provided
    const searchWhereClause: Prisma.ProductAssignmentWhereInput = search
      ? {
        OR: [
          { notes: { contains: search } },
          { uuid: { contains: search } },
          {
            assignedToUser: {
              name: { contains: search },
            },
          },
        ],
      }
      : {};

    // Combine base filters with search filters
    const combinedWhereClause: Prisma.ProductAssignmentWhereInput = {
      ...baseWhereClause,
      ...searchWhereClause,
    };

    // Step 1: Get all distinct assignedIds that match our criteria
    const allDistinct = await prisma.productAssignment.findMany({
      where: combinedWhereClause,
      distinct: ["assignedId"],
      select: {
        assignedId: true,
        [orderField]: true, // Include the sort field for proper ordering
      },
      orderBy: { [orderField]: sortOrder },
    });

    const allAssignedIds = allDistinct
      .map((item) => item.assignedId)
      .filter((id) => !!id);

    const total = allAssignedIds.length;
    const totalPages = Math.ceil(total / limit);

    // Step 2: Paginate assignedId values
    const paginatedAssignedIds = allAssignedIds.slice(
      (page - 1) * limit,
      page * limit
    );

    // Ensure paginatedAssignedIds is an array of strings
    const paginatedAssignedIdStrings = paginatedAssignedIds.map((id) => String(id));

    if (!paginatedAssignedIdStrings.length) {
      return successResponse(
        res,
        200,
        "No assigned asset groups found",
        { data: [], pagination: { page, limit, total, totalPages } },
        null
      );
    }

    // Step 3: Fetch all assignments for paginated assignedIds
    // Only filter by assignedId and base criteria, don't re-apply search filters
    const assignments = await prisma.productAssignment.findMany({
      where: {
        assignedId: { in: paginatedAssignedIdStrings },
        ...baseWhereClause, // Only base filters, no search filters here
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
      orderBy: { [orderField]: sortOrder },
    });

    // Step 4: Group by assignedId and maintain the same order as paginatedAssignedIds
    const groupedData = paginatedAssignedIds
      .map((id) => {
        const groupItems = assignments.filter((a) => String(a.assignedId) === String(id));
        if (!groupItems.length) return null;

        const first = groupItems[0];

        return {
          assignedId: id,
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
          products: groupItems.map((assignment) => {
            const grProduct =
              assignment.inventoryProductDetail.grInventoryProduct;
            return {
              id: grProduct.product.id,
              inventorProductId: assignment.inventoryProductDetail.id,
              AssetID: assignment.inventoryProductDetail.uuid,
              name: grProduct.product.name,
              brand: grProduct.product.brand,
              category: grProduct.product.category,
              
              serialNo1: assignment.inventoryProductDetail.serialNo1,
              serialNo2: assignment.inventoryProductDetail.serialNo2,
              qrCode: assignment.inventoryProductDetail.qrCode?.qrCodeUrl,
              grDetails: grProduct.grDetails,
              softwareInstalls:
                assignment.inventoryProductDetail.softwareInstalls,
            };
          }),
        };
      })
      .filter(Boolean);

    return successResponse(
      res,
      200,
      "Assigned asset groups fetched successfully",
      {
        data: groupedData,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      },
      null
    );
  } catch (error) {
    console.error("Error fetching assigned asset groups:", error);
    return next(
      error instanceof Error
        ? new ErrorHandler(error.message, 500)
        : new ErrorHandler("An unexpected error occurred", 500)
    );
  }
};

export const fetchAssignDetailsSingle = async (
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
        status: {
          in: [AssignmentStatus.Active, AssignmentStatus.Returned],
        },
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
          },
        },
        assignedToUser: {
          select: {
            id: true,
            name: true,
            email: true,
            mobile: true,
            uuid: true,
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
          AssetID: assignment.inventoryProductDetail.uuid,
          id: grProduct.product.id,
          name: grProduct.product.name,
          brand: grProduct.product.brand,
          category: grProduct.product.category,
          
          serialNo1: assignment.inventoryProductDetail.serialNo1,
          serialNo2: assignment.inventoryProductDetail.serialNo2,
          qrCode: assignment.inventoryProductDetail.qrCode?.qrCodeUrl,
          grDetails: grProduct.grDetails,
          softwareInstalls: assignment.inventoryProductDetail.softwareInstalls,
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
