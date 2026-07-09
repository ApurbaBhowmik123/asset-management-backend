import {
  AssetStatus,
  AssignedStatus,
  AssignmentStatus,
  Roles,
  TicketStatus,
} from "@src/enum/enum";
import { ErrorHandler } from "@src/utils/ErrorHandler";
import { Request, Response, NextFunction } from "express";
import { successResponse } from "@src/utils/successResponse";
import { getInventory } from "../gr/inventory.controller";
import prisma from "../../utils/prisma";

export const getSummaryCardsData = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = parseInt(req.user?.id ?? "0");
    if (isNaN(userId)) {
      return next(new ErrorHandler("Invalid user ID", 400));
    }

    const user = await prisma.user.findUnique({
      where: { id: userId, status: true },
      include: { roles: true },
    });

    if (!user) {
      return next(
        new ErrorHandler("You have no permission to access this resource", 404)
      );
    }

    const isSuperAdmin = user.roles.some((role) => role.name === "Super Admin");
    const isUser = user.roles.some((role) => role.name === Roles.USER);
    const isSupportEngineer = user.roles.some(
      (role) => role.name === Roles.SUPPORT_ENGINEER
    );

    const unitFilter = isSuperAdmin ? {} : { unitId: user.unitId };

    const inventoryInStock = await prisma.inventoryProductDetail.findMany({
      where: {
        status: true,
        ...unitFilter,
        
          assignedStatus: {
            notIn: [
              AssignedStatus.E_WASTE,
              AssignedStatus.BLOCKED,
              AssignedStatus.ASSIGNED,
              AssignedStatus.WRITE_OFF,
              AssignedStatus.SCRAP,
            ],
          },
        
      },
    });

    const Inventory = await prisma.inventoryProductDetail.count({
      where: {
        ...unitFilter,
        status: true,
        assignedStatus: {
          notIn: [AssignedStatus.E_WASTE, AssignedStatus.WRITE_OFF],
        },
      },
    });

    const assignments = await prisma.inventoryProductDetail.findMany({
      where: {
        assignedStatus: AssignedStatus.ASSIGNED,
        ...unitFilter,
      },
    });

    const pendingServices = await prisma.inventoryProductDetail.findMany({
      where: {
        ...unitFilter,
        status: true,
        maintenanceDueDate: {
          lte: new Date(),
        },
      },
    });

    const whereClause: any = {};
    if (isSuperAdmin) {
    } else if (isSupportEngineer) {
      whereClause.OR = [{ supportEngineerId: user.id }];
    } else if (isUser) {
      whereClause.OR = [{ userId: user.id }];
    } else {
      whereClause.createdBy = { unitId: user.unitId };
    }

    const openTickets = await prisma.ticket.findMany({
      where: {
        ...whereClause,
        status: { not: TicketStatus.Closed },
      },
    });

    const ReopenTickets = await prisma.ticket.findMany({
      where: {
        ...whereClause,
        status: TicketStatus.ReOpen,
      },
    });

    const totalTicket = await prisma.ticket.findMany({
      where: {
        ...whereClause,
      },
    });

    const employees = await prisma.user.findMany({
      include: {
        roles: true,
      },
      where: {
        ...(isSuperAdmin ? {} : { unitId: user.unitId }),
      },
    });

    const PendingSetup = await prisma.inventoryProductDetail.findMany({
      where: {
        ...unitFilter,
        status: true,
        assignedStatus: AssignedStatus.InStock,
        installationStatus: false,
        grInventoryProduct: {
          product: {
            category: {
              name: "IT Assets",
            },
          },
        },
      },
    });

    // Hold setup
    const holdSetup = await prisma.inventoryProductDetail.findMany({
      where: {
        ...unitFilter,
        status: true,
        assignedStatus: AssignedStatus.BLOCKED,
      },
    });

    // Ewaste + Write-off
    const e_waste = await prisma.inventoryProductDetail.findMany({
      where: {
        ...unitFilter,
        status: true,
        assignedStatus: {
          in: [AssignedStatus.E_WASTE, AssignedStatus.WRITE_OFF],
        },
      },
    });

    // Pending requests
    const pendingRequest = await prisma.productRequest.findMany({
      where: {
        RequestStatus: "Pending",
      },
    });

    // Dashboard data
    const data = {
      totalInstock: inventoryInStock.length,
      totalInventory: Inventory,
      totalAssignedStock: assignments.length,
      totalPendingServices: pendingServices.length,
      totalopenTickets: openTickets.length,
      totalReopenTickets: ReopenTickets.length,
      totalTickets: totalTicket.length,
      totalPendingSetup: PendingSetup.length,
      totalholdSetup: holdSetup.length,
      totalEmployees: employees.length,
      totalEwaste: e_waste.length,
      totalRequestsPending: pendingRequest.length,
    };

    return successResponse(
      res,
      200,
      "Dashboard summary fetched successfully",
      data,
      null
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 500));
    }
    return next(new ErrorHandler("An unexpected error occurred", 500));
  }
};

export const topTenUsedAndUnusedProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = parseInt(req.user?.id ?? "0");
    if (isNaN(userId)) {
      return next(new ErrorHandler("Invalid user ID", 400));
    }

    const user = await prisma.user.findUnique({
      where: { id: userId, status: true },
      include: { roles: true },
    });

    if (!user) {
      return next(
        new ErrorHandler("You have no permission to access this resource", 404)
      );
    }

    const isSuperAdmin = user.roles.some((role) => role.name === "Super Admin");

    const baseInclude = {
      grInventoryProduct: {
        include: {
          inventoryDetails: {
            select: {
              unitId: true,
            },
          },
          product: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
      },
    };

    const usedWhere: any = { isUsed: true, status: true };
    const unusedWhere: any = { isUsed: false, status: true };

    if (!isSuperAdmin) {
      // Apply unit filter for non-super admins
      usedWhere.grInventoryProduct = {
        inventoryDetails: {
          some: {
            unitId: user.unitId,
          },
        },
      };
      unusedWhere.grInventoryProduct = {
        inventoryDetails: {
          some: {
            unitId: user.unitId,
          },
        },
      };
    }

    const [usedInventoryDetails, unusedInventoryDetails] = await Promise.all([
      prisma.inventoryProductDetail.findMany({
        where: usedWhere,
        include: baseInclude,
      }),

      prisma.inventoryProductDetail.findMany({
        where: unusedWhere,
        include: baseInclude,
      }),
    ]);

    const aggregateProducts = (inventoryDetails: any[]) => {
      const productMap: {
        [key: number]: {
          id: number;
          name: string;
          description: string;
          totalQuantity: number;
          itemsCount: number;
        };
      } = {};

      inventoryDetails.forEach((detail) => {
        const product = detail.grInventoryProduct?.product;
        const grProduct = detail.grInventoryProduct;

        if (!product || !grProduct) return;

        const productId = product.id;
        const quantity = Number(grProduct.quantity) || 0;

        if (productMap[productId]) {
          productMap[productId].totalQuantity += quantity;
          productMap[productId].itemsCount += 1;
        } else {
          productMap[productId] = {
            id: product.id,
            name: product.name,
            description: product.description || "",
            totalQuantity: quantity,
            itemsCount: 1,
          };
        }
      });

      return Object.values(productMap)
        .sort((a, b) => b.totalQuantity - a.totalQuantity)
        .slice(0, 10)
        .map((item) => ({
          id: item.id,
          product: {
            name: item.name,
            description: item.description,
          },
          itemsCount: item.itemsCount,
        }));
    };

    const topUsed = aggregateProducts(usedInventoryDetails);
    const topUnused = aggregateProducts(unusedInventoryDetails);

    const data = {
      topUsed,
      topUnused,
    };

    return successResponse(
      res,
      200,
      "Products fetched successfully",
      data,
      null
    );
  } catch (error: unknown) {
    console.error("Error in topTenUsedAndUnusedProducts:", error);
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 500));
    }
    return next(new ErrorHandler("An unexpected error occurred", 500));
  }
};

export const getLowStockProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
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
    let products = null;
    if (user.roles.some((role) => role.name === "Super Admin")) {
      products = await prisma.product.findMany({
        select: {
          id: true,
          name: true,
          msq: true,
          inventoryEntries: {
            select: {
              inventoryDetails: {
                where: {
                  assignedStatus:
                    AssignedStatus.InStock ||
                    AssignedStatus.InstallationCompleted,
                  status: true,
                },
              },
            },
          },
        },
      });
    } else {
      products = await prisma.product.findMany({
        where: {
          inventoryEntries: {
            some: {
              inventoryDetails: {
                some: {
                  unitId: user.unitId,
                },
              },
            },
          },
        },
        select: {
          id: true,
          name: true,
          msq: true,
          inventoryEntries: {
            select: {
              inventoryDetails: {
                select: {
                  unitId: true,
                },
                where: {
                  assignedStatus:
                    AssignedStatus.InStock ||
                    AssignedStatus.InstallationCompleted,
                  status: true,
                },
              },
            },
          },
        },
      });
    }

    const lowStockProducts = products
      .map((product) => {
        const inStockCount = product.inventoryEntries.reduce(
          (total, entry) => total + entry.inventoryDetails.length,
          0
        );
        const msq = product.msq ? parseInt(product.msq) : 0;

        return {
          id: product.id,
          name: product.name,
          msq,
          inStockCount,
        };
      })

      .filter((product) => product.inStockCount < product.msq)
      .sort((a, b) => a.inStockCount - b.inStockCount)
      .slice(0, 10);

    return successResponse(
      res,
      200,
      "Low stock products fetched successfully",
      lowStockProducts,
      null
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 500));
    }
    return next(new ErrorHandler("An unexpected error occurred", 500));
  }
};

export const getPendingServiceProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
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
          status: true,
          maintenanceDueDate: {
            lte: new Date(),
          },
        },
        select: {
          id: true,
          maintenanceDueDate: true,
          grInventoryProduct: {
            select: {
              inventoryDetails: {
                select: {
                  unitId: true,
                },
              },
              product: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });
    } else {
      pendingServices = await prisma.inventoryProductDetail.findMany({
        where: {
          status: true,
          maintenanceDueDate: {
            lte: new Date(),
          },
          grInventoryProduct: {
            inventoryDetails: {
              some: {
                unitId: user.unitId,
              },
            },
          },
        },
        select: {
          id: true,
          maintenanceDueDate: true,
          grInventoryProduct: {
            select: {
              inventoryDetails: {
                select: {
                  unitId: true,
                },
              },
              product: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });
    }

    const productMap: Record<
      number,
      { productId: number; name: string; count: number }
    > = {};

    pendingServices.forEach((item) => {
      const productId = item.grInventoryProduct?.product?.id;
      const productName =
        item.grInventoryProduct?.product?.name || "Unknown Product";

      if (productId) {
        if (productMap[productId]) {
          productMap[productId].count += 1;
        } else {
          productMap[productId] = {
            productId: productId,
            name: productName,
            count: 1,
          };
        }
      }
    });

    const result = Object.values(productMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const formattedResult = result.map((item) => ({
      name: item.name,
      totalPendingCount: item.count,
    }));

    const finalResponse = {
      status: true,
      message: "Pending service products fetched successfully",
      data: formattedResult,
    };
    return res.status(200).json(finalResponse);
  } catch (error: unknown) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 500));
    }
    return next(new ErrorHandler("An unexpected error occurred", 500));
  }
};

export const getTotalProductSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
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
    let products = null;
    if (user.roles.some((role) => role.name === "Super Admin")) {
      products = await prisma.product.findMany({
        orderBy: {
          createdAt: "desc",
        },
        include: {
          inventoryEntries: {
            include: {
              inventoryDetails: {
                where: { status: true },
                select: {
                  unitId: true,
                  isUsed: true,
                },
              },
            },
          },
        },
      });
    } else {
      products = await prisma.product.findMany({
        where: {
          inventoryEntries: {
            some: {
              inventoryDetails: {
                some: {
                  unitId: user.unitId,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        include: {
          inventoryEntries: {
            include: {
              inventoryDetails: {
                where: { status: true },
                select: {
                  unitId: true,
                  isUsed: true,
                },
              },
            },
          },
        },
      });
    }

    const formattedData = products.map((product) => {
      let total = 0;
      let used = 0;
      let instock = 0;

      product.inventoryEntries.forEach((entry) => {
        const instockDetails = entry.inventoryDetails.filter(
          (detail: any) =>
            detail.assignedStatus === AssignedStatus.InStock ||
            detail.assignedStatus === AssignedStatus.InstallationCompleted
        );

        const usedDetails = entry.inventoryDetails.filter(
          (detail) => detail.isUsed
        );

        total += entry.inventoryDetails.length;
        instock += instockDetails.length;
        used += usedDetails.length;
      });

      return {
        name: product.name,
        Total: total,
        Used: used,
        Instock: instock,
      };
    });

    return successResponse(
      res,
      200,
      "Top products summary fetched successfully",
      formattedData,
      null
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 500));
    }
    return next(new ErrorHandler("An unexpected error occurred", 500));
  }
};

export const getLastMonthTicketsByDay = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = parseInt(req.user?.id ?? "0");
    if (isNaN(userId)) {
      return next(new ErrorHandler("Invalid user ID", 400));
    }

    const user = await prisma.user.findUnique({
      where: { id: userId, status: true },
      include: { roles: true },
    });

    if (!user) {
      return next(
        new ErrorHandler("You have no permission to access this resource", 404)
      );
    }

    const isSuperAdmin = user.roles.some((role) => role.name === "Super Admin");
    const isUser = user.roles.some((role) => role.name === Roles.USER);
    const isSupportEngineer = user.roles.some(
      (role) => role.name === Roles.SUPPORT_ENGINEER
    );

    const whereClause: any = {};
    if (isSuperAdmin) {
    } else if (isSupportEngineer) {
      whereClause.OR = [{ supportEngineerId: user.id }];
    } else if (isUser) {
      whereClause.OR = [{ userId: user.id }];
    } else {
      whereClause.createdBy = {
        unitId: user.unitId,
      };
    }

    const now = new Date();
    const firstDayOfLastMonth = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    );
    const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const daysInLastMonth = lastDayOfLastMonth.getDate();

    const tickets = await prisma.ticket.findMany({
      where: {
        ...whereClause,
        createdAt: {
          gte: firstDayOfLastMonth,
          lte: lastDayOfLastMonth,
        },
      },
      select: {
        id: true,
        createdAt: true,
        status: true,
      },
    });

    const daysData = [];
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    for (let day = 1; day <= daysInLastMonth; day++) {
      const currentDate = new Date(firstDayOfLastMonth);
      currentDate.setDate(day);

      const dayStart = new Date(currentDate);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);

      const dayTickets = tickets.filter(
        (ticket) => ticket.createdAt >= dayStart && ticket.createdAt <= dayEnd
      );

      // Format date as "DD MMM (Day)"
      const formattedDate = `${day.toString().padStart(2, "0")} ${
        monthNames[firstDayOfLastMonth.getMonth()]
      } `;

      daysData.push({
        name: formattedDate,
        Open: dayTickets.filter((t) => t.status != TicketStatus.Closed).length,
        ReOpen: dayTickets.filter((t) => t.status === TicketStatus.ReOpen)
          .length,
        Closed: dayTickets.filter((t) => t.status === TicketStatus.Closed)
          .length,
      });
    }

    return successResponse(
      res,
      200,
      "Last month tickets by day fetched successfully",
      daysData,
      null
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 500));
    }
    return next(new ErrorHandler("An unexpected error occurred", 500));
  }
};

export const getOpenTicketsByPriority = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = parseInt(req.user?.id ?? "0");
    if (isNaN(userId)) {
      return next(new ErrorHandler("Invalid user ID", 400));
    }

    const user = await prisma.user.findUnique({
      where: { id: userId, status: true },
      include: { roles: true },
    });

    if (!user) {
      return next(
        new ErrorHandler("You have no permission to access this resource", 404)
      );
    }

    const isSuperAdmin = user.roles.some((role) => role.name === "Super Admin");
    const isUser = user.roles.some((role) => role.name === Roles.USER);
    const isSupportEngineer = user.roles.some(
      (role) => role.name === Roles.SUPPORT_ENGINEER
    );

    const whereClause: any = {
      NOT: {
        status: TicketStatus.Closed,
      },
    };

    if (isSuperAdmin) {
    } else if (isSupportEngineer) {
      whereClause.OR = [{ supportEngineerId: user.id }];
    } else if (isUser) {
      whereClause.OR = [{ userId: user.id }];
    } else {
      whereClause.createdBy = {
        unitId: user.unitId,
      };
    }

    const tickets = await prisma.ticket.groupBy({
      by: ["priority"],
      where: whereClause,
      _count: {
        id: true,
      },
    });

    const priorityData = [
      {
        name: "High",
        value: tickets.find((t) => t.priority === "High")?._count.id || 0,
      },
      {
        name: "Medium",
        value: tickets.find((t) => t.priority === "Medium")?._count.id || 0,
      },
      {
        name: "Low",
        value: tickets.find((t) => t.priority === "Low")?._count.id || 0,
      },
    ];

    return successResponse(
      res,
      200,
      "Open tickets by priority fetched successfully",
      priorityData,
      null
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 500));
    }
    return next(new ErrorHandler("An unexpected error occurred", 500));
  }
};

export const getReopenTicketsByPriority = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = parseInt(req.user?.id ?? "0");
    if (isNaN(userId)) {
      return next(new ErrorHandler("Invalid user ID", 400));
    }

    const user = await prisma.user.findUnique({
      where: { id: userId, status: true },
      include: { roles: true },
    });

    if (!user) {
      return next(
        new ErrorHandler("You have no permission to access this resource", 404)
      );
    }

    const isSuperAdmin = user.roles.some((role) => role.name === "Super Admin");
    const isUser = user.roles.some((role) => role.name === Roles.USER);
    const isSupportEngineer = user.roles.some(
      (role) => role.name === Roles.SUPPORT_ENGINEER
    );

    const whereClause: any = {
      status: TicketStatus.ReOpen,
    };

    if (isSuperAdmin) {
    } else if (isSupportEngineer) {
      whereClause.OR = [{ supportEngineerId: user.id }];
    } else if (isUser) {
      whereClause.OR = [{ userId: user.id }];
    } else {
      whereClause.createdBy = {
        unitId: user.unitId,
      };
    }

    const tickets = await prisma.ticket.groupBy({
      by: ["priority"],
      where: whereClause,
      _count: {
        id: true,
      },
    });

    const priorityData = [
      {
        name: "High",
        value: tickets.find((t) => t.priority === "High")?._count.id || 0,
      },
      {
        name: "Medium",
        value: tickets.find((t) => t.priority === "Medium")?._count.id || 0,
      },
      {
        name: "Low",
        value: tickets.find((t) => t.priority === "Low")?._count.id || 0,
      },
    ];

    return successResponse(
      res,
      200,
      "Reopen tickets by priority fetched successfully",
      priorityData,
      null
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 500));
    }
    return next(new ErrorHandler("An unexpected error occurred", 500));
  }
};


export const getDashboardAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const depreciationPeriodParam = req.query.depreciationPeriod as string;
    let depreciationYears = 3; // default
    if (depreciationPeriodParam === "today" || depreciationPeriodParam === "0") {
      depreciationYears = 0;
    } else if (depreciationPeriodParam) {
      const parsed = parseInt(depreciationPeriodParam);
      if (!isNaN(parsed)) depreciationYears = parsed;
    }

    const userId = parseInt(req.user?.id ?? "0");
    if (isNaN(userId)) {
      return next(new ErrorHandler("Invalid user ID", 400));
    }

    const user = await prisma.user.findUnique({
      where: { id: userId, status: true },
      include: { roles: true },
    });

    if (!user) {
      return next(new ErrorHandler("You have no permission to access this resource", 404));
    }

    const isSuperAdmin = user.roles.some((role) => role.name === "Super Admin");
    const unitFilter = isSuperAdmin ? {} : { unitId: user.unitId };

    const rawAssets = await prisma.inventoryProductDetail.findMany({
      where: { status: true, ...unitFilter },
      include: {
        grInventoryProduct: {
          include: { 
            category: true,
            product: { include: { category: true } } 
          }
        },
        location: true,
        unit: true
      }
    });

    const productMap = new Map();
    const categoryMap = new Map();
    const statusMap = new Map();
    const locationMap = new Map();

    for (const asset of rawAssets) {
      // 1 & 4. Asset Summary by Category & Top 5 By Category
      const cName = asset.grInventoryProduct?.category?.name || asset.grInventoryProduct?.product?.category?.name || "Unknown Category";
      const price = asset.grInventoryProduct?.ratePerPiece || 0;
      const createdAt = asset.grInventoryProduct?.createdAt || asset.createdAt;
      const ageInMs = new Date().getTime() - new Date(createdAt).getTime();
      const ageInYears = ageInMs / (1000 * 60 * 60 * 24 * 365.25);
      
      const lifespan = 3; // Fixed 3 years lifespan as per requirement
      let effectiveAge = ageInYears; // 'Today' uses actual age
      
      if (depreciationYears > 0) {
        // If dropdown is 1, 2, 3... use it as the effective age for calculation
        effectiveAge = depreciationYears;
      }
      
      let depreciatedPrice = price;
      if (effectiveAge >= lifespan) {
        depreciatedPrice = 0;
      } else if (effectiveAge > 0) {
        depreciatedPrice = price - (price * (effectiveAge / lifespan));
      }
      
      if (!categoryMap.has(cName)) {
        categoryMap.set(cName, { name: cName, count: 0, value: 0, depreciatedValue: 0 });
      }
      const cEntry = categoryMap.get(cName);
      cEntry.count += 1;
      cEntry.value += price;
      cEntry.depreciatedValue += depreciatedPrice;

      // 2. Asset Status
      let st = asset.assignedStatus || "Unknown";
      if (["Untagged", "InstallationCompleted", "PENDING_RETURN"].includes(st)) {
          st = "InStock"; // Group these under Instock for the pie chart to match the Top Card logic
      }
      statusMap.set(st, (statusMap.get(st) || 0) + 1);

      // 3. Assets By Location
      const locName = asset.location?.name || asset.unit?.name || "Unassigned Location";
      if (!locationMap.has(locName)) {
        locationMap.set(locName, { locationName: locName, totalAsset: 0, allocated: 0, instock: 0 });
      }
      const lEntry = locationMap.get(locName);
      lEntry.totalAsset += 1;
      const normSt = st.toLowerCase();
      if (normSt === "assigned" || normSt === "handovered" || normSt === "handover") {
        lEntry.allocated += 1;
      }
      if (normSt === "instock" || normSt === "in-stock" || normSt === "in_stock") {
        lEntry.instock += 1;
      }
    }

    const assetSummaryByCategory = Array.from(categoryMap.values());
    const top5AssetsByValue = Array.from(categoryMap.values()).sort((a, b) => b.value - a.value).slice(0, 5);
    const assetStatus = Array.from(statusMap.entries()).map(([name, value]) => ({ name, value }));
    const assetsByLocation = Array.from(locationMap.values());

    // 5. Recent Activities
    const recentActivities = await prisma.logReport.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        createdByUser: { select: { name: true } },
      }
    });

    const formattedActivities = recentActivities.map(log => ({
      id: log.id,
      transactionType: log.transactionType,
      transactionDate: log.transactionDate,
      details: log.logReportDetails,
      createdBy: log.createdByUser?.name || "System"
    }));

    return successResponse(
      res,
      200,
      "Dashboard Analytics fetched successfully",
      {
        assetSummaryByCategory,
        assetStatus,
        assetsByLocation,
        top5AssetsByValue,
        recentActivities: formattedActivities
      },
      null
    );

  } catch (error) {
    console.error("Error in getDashboardAnalytics:", error);
    return next(new ErrorHandler("Internal Server Error", 500));
  }
};
