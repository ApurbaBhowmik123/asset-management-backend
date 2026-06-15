import { successResponse } from "@utils/successResponse";
import { ErrorHandler } from "@utils/ErrorHandler";
import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "../../../prisma/generated/prisma";
import { createPagedResponse } from "@src/utils/pagedResponse";
import { AssignedStatus } from "@src/enum/enum";

const prisma = new PrismaClient();

export const upcomingService = async (
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
    let upcomingServices = null;
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
    let totalCount = 0;
    if (user.roles.some((role) => role.name === "Super Admin")) {
      upcomingServices = await prisma.inventoryProductDetail.findMany({
        where: {
          ...searchFilter,
          status: true,
          maintenanceDueDate: {
            gte: new Date(),
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
      totalCount = await prisma.inventoryProductDetail.count({
        where: {
          ...searchFilter,
          status: true,
          maintenanceDueDate: {
            gte: new Date(),
          },
          grInventoryProduct: {
            product: {
              category: {
                name: "IT Assets",
              },
            },
          },
        },
      });
    } else {
      upcomingServices = await prisma.inventoryProductDetail.findMany({
        where: {
          ...searchFilter,
          status: true,
          maintenanceDueDate: {
            gte: new Date(),
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
          unitId: true,
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
      totalCount = await prisma.inventoryProductDetail.count({
        where: {
          ...searchFilter,
          status: true,
          maintenanceDueDate: {
            gte: new Date(),
          },
          unitId: Number(user.unitId),
          grInventoryProduct: {
            product: {
              category: {
                name: "IT Assets",
              },
            },
          },
        },
      });
    }
    return successResponse(
      res,
      200,
      "Upcoming services fetched successfully",
      createPagedResponse(upcomingServices, page, limit, totalCount),
      null
    );
  } catch (error) {
    console.error("Error in upcomingService:", error);
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 500));
    }
    return next(new ErrorHandler("An unexpected error occurred", 500));
  }
};

export const upcomingServiceDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const upcomingService = await prisma.inventoryProductDetail.findUnique({
      where: { id: Number(id), status: true },
      select: {
        id: true,
        uuid: true,
        serialNo1: true,
        serialNo2: true,
        assignedStatus: true,
        createdAt: true,
        updatedAt: true,
        maintenanceDueDate: true,
        nextServiceDate: true,
        services: true,
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
    });
    if (!upcomingService) {
      return next(new ErrorHandler("Upcoming service not found", 404));
    }
    return successResponse(
      res,
      200,
      "Upcoming service fetched successfully",
      upcomingService,
      null
    );
  } catch (error) {
    console.error("Error in upcomingServiceDetails:", error);
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 500));
    }
    return next(new ErrorHandler("An unexpected error occurred", 500));
  }
};
