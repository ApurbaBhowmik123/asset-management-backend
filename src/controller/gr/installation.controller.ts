import { successResponse } from "@utils/successResponse";
import { ErrorHandler } from "@utils/ErrorHandler";
import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "../../../prisma/generated/prisma/client";
import { createPagedResponse } from "@utils/pagedResponse";
import { sendInstallationEmail } from "@utils/mail";
import { getSafeString } from "@utils/paramHelper";
const prisma = new PrismaClient();
import { formatDate } from "@utils/formatDate";
import { LogAction } from "@src/enum/enum";
import { generateUniqueId } from "@utils/randomNumberGenerator";
import * as dotenv from "dotenv";
import { MailActions } from "@src/enum/enum";
dotenv.config();

export const getInstallationList = async (
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
      "name",
      "uuid",
      "createdAt",
      "updatedAt",
      "assignedStatus",
      "totalAmount",
    ];
    const finalSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    // Ensure user is logged in
    if (!req.user || !(req as any).user.id) {
      return next(
        new ErrorHandler("Unauthorized: Missing user information", 401)
      );
    }

    const userId = Number((req as any).user.id);
    if (isNaN(userId) || userId <= 0) {
      return next(new ErrorHandler("Invalid user ID", 400));
    }

    // Fetch user with roles and unit
    const user = await prisma.user.findFirst({
      where: { id: userId, status: true },
      include: { roles: true },
    });

    if (!user) {
      return next(new ErrorHandler("User not found or inactive", 404));
    }

    const userRoles = user.roles?.map((r) => r.name) || [];
    const userUnitId = user.unitId || null;

    // Base where clause
    const whereClause: any = {
      OR: [
        { serialNo1: { contains: search } },
        { serialNo2: { contains: search } },
      ],
      status: true,
      assignedStatus: "InStock",
      grInventoryProduct: {
        product: {
          category: { name: "IT Assets" },
        },
      },
    };

    // Apply unit restriction if not superadmin
    if (!userRoles.includes("Super Admin") && userUnitId) {
      whereClause.unitId = userUnitId;
    }

    // Fetch paginated data
    const installations = await prisma.inventoryProductDetail.findMany({
      where: { status: true, ...whereClause },
      orderBy: { [finalSortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
      include: {
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
        unit: { select: { id: true, name: true } },
        location: { select: { id: true, name: true } },
        specValues: {
          select: {
            id: true,
            value: true,
            specField: { select: { id: true, name: true } },
          },
        },
        grInventoryProduct: {
          include: {
            grDetails: {
              select: {
                id: true,
                invoiceDate: true,
                invoiceNumber: true,
                grDate: true,
                grId: true,
                sapDate: true,
                sapId: true,
              },
            },
            product: { include: { brand: true, category: true } },
          },
        },
      },
    });

    const totalCount = await prisma.inventoryProductDetail.count({
      where: { status: true, ...whereClause },
    });

    return successResponse(
      res,
      200,
      "Fetched installation list successfully",
      createPagedResponse(installations, page, limit, totalCount),
      null
    );
  } catch (error: unknown) {
    console.error("Error in getInstallationList:", error);
    return next(
      new ErrorHandler(
        error instanceof Error ? error.message : "An unknown error occurred",
        500
      )
    );
  }
};

export const installSoftwaresToProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { softwareIds } = req.body;
    const { id } = req.params;
    const userId = parseInt(req.user?.id ?? "0");

    const now = new Date();
    const inventoryDetail = await prisma.inventoryProductDetail.findUnique({
      where: { id: Number(id) },
      select: {
        softwareInstalls: true,
      },
    });
    if (!inventoryDetail) {
      return next(new ErrorHandler("Inventory detail not found", 404));
    }
    await prisma.productSoftwareInstalls.updateMany({
      where: {
        grInventoryProductDetailId: Number(id),
      },
      data: {
        status: false,
      },
    });
    const installationId = generateUniqueId();
    const data = softwareIds.map((item: { id: number; value: string }) => ({
      grInventoryProductDetailId: Number(id),
      installationId: installationId,
      softwareId: Number(item.id),
      value: item.value,
      installedBy: userId,
      updatedBy: userId,
      installedAt: now,
      createdAt: now,
      updatedAt: now,
    }));

    await (prisma.productSoftwareInstalls.createMany as any)({
      data,
      // skipDuplicates: true,
    });
    await prisma.inventoryProductDetail.update({
      where: { id: Number(id) },
      data: {
        assignedStatus: "InstallationCompleted",
        installationStatus: true,
        updatedBy: userId,
        updatedAt: now,
      },
    });
    const productwithInstalllDetails =
      await prisma.inventoryProductDetail.findUnique({
        where: { id: Number(id) },
        select: {
          assignedStatus: true,
          uuid: true,
          grInventoryProduct: {
            select: {
              grDetails: {
                select: {
                  grId: true,
                  grDate: true,
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
          softwareInstalls: {
            where: {
              status: true,
            },
            select: {
              id: true,
              softwareId: true,
              value: true,
              product: {
                select: {
                  uuid: true,
                  serialNo1: true,
                  grInventoryProduct: {
                    select: {
                      product: {
                        select: {
                          name: true,
                          uuid: true,
                          brand: {
                            select: {
                              name: true,
                            },
                          },
                          category: {
                            select: {
                              name: true,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
              softwares: {
                select: {
                  id: true,
                  name: true,
                  version: true,
                },
              },
            },
          },
        },
      });

    let emailList: string[] = [];
    if (productwithInstalllDetails?.unit?.id) {
      const mailConfig = await prisma.mailConfig.findFirst({
        where: {
          unitId: productwithInstalllDetails.unit.id,
          status: true,
          action: MailActions.SOFTWARE_INSTALLATION,
        },
        select: {
          superAdmin: {
            select: { email: true },
          },
          unitAdmin: {
            select: { email: true },
          },
        },
      });
      if (mailConfig?.superAdmin?.email) {
        emailList.push(mailConfig.superAdmin.email);
      }
      if (mailConfig?.unitAdmin?.email) {
        emailList.push(mailConfig.unitAdmin.email);
      }
    }
    await sendInstallationEmail(
      emailList,
      productwithInstalllDetails?.softwareInstalls[0]?.product
        ?.grInventoryProduct?.product?.uuid || "",
      productwithInstalllDetails?.assignedStatus || "",
      productwithInstalllDetails?.grInventoryProduct?.grDetails?.grId || "",
      productwithInstalllDetails?.grInventoryProduct?.grDetails?.grDate
        ? formatDate(
          productwithInstalllDetails?.grInventoryProduct?.grDetails?.grDate
        )
        : "",
      productwithInstalllDetails?.softwareInstalls[0]?.product?.serialNo1 || "",
      productwithInstalllDetails?.softwareInstalls[0]?.product
        ?.grInventoryProduct?.product?.name || "",
      productwithInstalllDetails?.softwareInstalls[0]?.product
        ?.grInventoryProduct?.product?.brand?.name || "",
      productwithInstalllDetails?.softwareInstalls[0]?.product
        ?.grInventoryProduct?.product?.category?.name || "",
      productwithInstalllDetails?.softwareInstalls || [],
      next
    );
    const log = await prisma.log.create({
      data: {
        action: LogAction.INSTALLATION,
        userId: userId,
        relatedModelType: "prisma.inventoryProductDetail",
        relatedModelId: Number(id),
        details: JSON.stringify({
          productwithInstalllDetails,
        }),
      },
    });
    await prisma.logReport.create({
      data: {
        logId: log.id,
        transactionId: installationId,
        transactionDate: new Date(),
        productId: Number(id),
        transactionType: "SOFTWARE INSTALLATION",
        logReportDetails: `Software(s) installed for Product: ${productwithInstalllDetails?.uuid}`,
        createdBy: userId,
        transactionlink: `${process.env.FRONTEND_URL}/installation-details/${installationId}`,
      },
    });
    return successResponse(
      res,
      201,
      "Software(s) installed successfully",
      productwithInstalllDetails?.softwareInstalls || [],
      null
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 400));
    }
    return next(new ErrorHandler("Failed to install software", 500));
  }
};

export const getInstalledList = async (
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
    const allowedSortFields = ["installationId", "createdAt", "updatedAt"];
    const finalSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    if (!req.user || !(req as any).user.id) {
      return next(
        new ErrorHandler("Unauthorized: Missing user information", 401)
      );
    }

    const userId = Number((req as any).user.id);
    if (isNaN(userId) || userId <= 0) {
      return next(new ErrorHandler("Invalid user ID", 400));
    }

    const user = await prisma.user.findFirst({
      where: { id: userId, status: true },
      include: { roles: true },
    });

    if (!user) {
      return next(new ErrorHandler("User not found or inactive", 404));
    }

    const userRoles = user.roles?.map((r) => r.name) || [];
    const userUnitId = user.unitId || null;

    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { installationId: { contains: search } },
        {
          softwares: {
            some: { name: { contains: search } },
          },
        },
      ];
    }

    if (!userRoles.includes("Super Admin") && userUnitId) {
      whereClause.product = { unitId: userUnitId };
    }

    const installedList = await prisma.productSoftwareInstalls.findMany({
      where: whereClause,
      distinct: ["installationId"],
      include: {
        product: {
          include: {
            unit: { select: { id: true, name: true } },
            grInventoryProduct: {
              include: {
                product: {
                  select: {
                    brand: { select: { id: true, name: true } },
                    category: { select: { id: true, name: true } },
                  },
                },
              },
            },
          },
        },
        softwares: {
          select: { id: true, name: true, version: true, required: true },
        },
        createdUser: { select: { id: true, name: true } },
      },
      orderBy: { [finalSortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Get unique installationId count
    const totalCount = (
      await prisma.productSoftwareInstalls.groupBy({
        by: ["installationId"],
        where: whereClause,
      })
    ).length;

    return successResponse(
      res,
      200,
      "Installed software list retrieved successfully",
      createPagedResponse(installedList, page, limit, totalCount),
      null
    );
  } catch (error: unknown) {
    console.error("Error in getInstalledList:", error);
    return next(
      new ErrorHandler(
        error instanceof Error
          ? error.message
          : "Failed to retrieve installed software list",
        500
      )
    );
  }
};

export const getInstallatedDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { installedId } = req.params;
    const safeInstalledId = getSafeString(installedId);
    const installedDetails = await prisma.productSoftwareInstalls.findMany({
      where: {
        installationId: safeInstalledId,
      },
      include: {
        product: {
          include: {
            unit: {
              select: {
                id: true,
                name: true,
              },
            },
            grInventoryProduct: {
              include: {
                grDetails: {
                  select: {
                    id: true,
                    uuid: true,
                    grDate: true,
                  },
                },
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
        softwares: {
          select: {
            id: true,
            name: true,
            version: true,
            required: true,
            productInstalledSofts: {
              select: {
                value: true,
              },
            },
          },
        },
        createdUser: {
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
      "Installed software details retrieved successfully",
      installedDetails,
      null
    );
  } catch (error) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 400));
    }
    return next(
      new ErrorHandler("Failed to retrieve installed software details", 500)
    );
  }
};
