import { successResponse } from "@utils/successResponse";
import { ErrorHandler } from "@utils/ErrorHandler";
import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "../../../prisma/generated/prisma";
import { createPagedResponse } from "@utils/pagedResponse";
import { AssignedStatus } from "@src/enum/enum";

const prisma = new PrismaClient();

export const getPendingAssetsService = async (
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
    const searchFilter = search
      ? {
          OR: [
            {
              uuid: {
                contains: search,
              },
            },
            {
              serialNo1: {
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
                  brand: {
                    name: {
                      contains: search,
                    },
                  },
                },
              },
            },
          ],
        }
      : {};

    const allowedSortFields = ["uuid", "serialNo1", "createdAt", "updatedAt"];
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
    let pendingServices = null;
    if (user.roles.some((role) => role.name === "Super Admin")) {
      pendingServices = await prisma.inventoryProductDetail.findMany({
        where: {
          ...searchFilter,
          status: true,
          maintenanceDueDate: {
            lte: new Date(),
          },
          grInventoryProduct: {
            product: {
              category: {
                name: "IT Assets",
              },
            },
          },
          assignedStatus: {
            notIn: [AssignedStatus.E_WASTE, AssignedStatus.WRITE_OFF],
          },
        },

        orderBy: {
          maintenanceDueDate: "asc",
        },
        select: {
          id: true,
          uuid: true,
          serialNo1: true,
          assignedStatus: true,
          serialNo2: true,
          createdAt: true,
          updatedAt: true,
          maintenanceDueDate: true,
          nextServiceDate: true,
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
          grInventoryProduct: {
            select: {
              id: true,
              uuid: true,
              warrantyTill: true,
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
          softwareInstalls: {
            where: {
              status: true,
            },
            select: {
              id: true,
              uuid: true,
              value: true,
              softwares: {
                select: {
                  id: true,
                  uuid: true,
                  version: true,
                  name: true,
                },
              },
            },
          },
          AssignProductDetails: {
            select: {
              id: true,
              uuid: true,
              assignedToUser: {
                select: {
                  id: true,
                  name: true,
                  department: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
              assignedToLocation: {
                select: {
                  id: true,
                  uuid: true,
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
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
      });
    } else {
      pendingServices = await prisma.inventoryProductDetail.findMany({
        where: {
          ...searchFilter,
          status: true,
          maintenanceDueDate: {
            lte: new Date(),
          },
          unitId: Number(user.unitId),
          grInventoryProduct: {
            product: {
              category: {
                name: "IT Assets",
              },
            },
          },
          assignedStatus: {
            notIn: [AssignedStatus.E_WASTE, AssignedStatus.WRITE_OFF],
          },
        },

        orderBy: {
          maintenanceDueDate: "asc",
        },
        select: {
          id: true,
          uuid: true,
          serialNo1: true,
          assignedStatus: true,
          serialNo2: true,
          createdAt: true,
          updatedAt: true,
          maintenanceDueDate: true,
          nextServiceDate: true,
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
          grInventoryProduct: {
            select: {
              id: true,
              uuid: true,
              warrantyTill: true,
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
          softwareInstalls: {
            where: {
              status: true,
            },
            select: {
              id: true,
              uuid: true,
              value: true,
              softwares: {
                select: {
                  id: true,
                  uuid: true,
                  version: true,
                  name: true,
                },
              },
            },
          },
          AssignProductDetails: {
            select: {
              id: true,
              uuid: true,
              assignedToUser: {
                select: {
                  id: true,
                  name: true,
                  department: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
              assignedToLocation: {
                select: {
                  id: true,
                  uuid: true,
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
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
      });
    }
    const totalCount = await prisma.inventoryProductDetail.count({
      where: {
        ...searchFilter,
        status: true,
        maintenanceDueDate: {
          lte: new Date(),
        },
      },
    });
    const pagedResponse = createPagedResponse(
      pendingServices,
      page,
      limit,
      totalCount
    );
    return successResponse(
      res,
      200,
      "Pending assets service fetched successfully",
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
