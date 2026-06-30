import { successResponse } from "@utils/successResponse";
import { ErrorHandler } from "@utils/ErrorHandler";
import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "../../../prisma/generated/prisma/client";
import { getSafeString } from "@utils/paramHelper";
import { LogAction } from "@src/enum/enum";
import { createPagedResponse } from "@src/utils/pagedResponse";
import { createLogReport } from "@utils/logReport";
import { generateNextCode } from "@utils/codeGenerator";
import * as dotenv from "dotenv";
import prisma from "../../utils/prisma";
dotenv.config();

export const service = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = parseInt(req.user?.id ?? "0");
    const { softwareIds, serviceDetails, specValues } = req.body;
    const inventoryProductDetailId = parseInt(
      getSafeString(req.params.inventoryProductDetailId)
    );
    const now = new Date();
    const inventoryProductDetail =
      await prisma.inventoryProductDetail.findUnique({
        where: { id: inventoryProductDetailId },
        select: {
          id: true,
          grInventoryProduct: {
            select: {
              maintenanceFrequency: true,
            },
          },
        },
      });

    if (!inventoryProductDetail) {
      return next(new ErrorHandler("Inventory product  not found", 404));
    }

    const rawFreq =
      inventoryProductDetail.grInventoryProduct.maintenanceFrequency;
    const maintenanceFrequency = Number(rawFreq);

    const nextServiceDate =
      !isNaN(maintenanceFrequency) && maintenanceFrequency > 0
        ? new Date(
          new Date(now).setMonth(now.getMonth() + maintenanceFrequency)
        )
        : new Date(
          new Date(now).setMonth(now.getMonth() + 3) // Default to 3 months if frequency is invalid
        );
    if (Array.isArray(softwareIds)) {
      await prisma.productSoftwareInstalls.updateMany({
        where: {
          grInventoryProductDetailId: Number(inventoryProductDetailId),
        },
        data: {
          status: false,
        },
      });
      const data = softwareIds.map((item: { id: number; value: string }) => ({
        grInventoryProductDetailId: Number(inventoryProductDetailId),
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
    }
    if (Array.isArray(specValues)) {
      await prisma.gRProductSpecValue.deleteMany({
        where: {
          grInventoryProductDetailId: Number(inventoryProductDetailId),
        },
      });
      const specData = specValues.map(
        (item: { id: number; value: string }) => ({
          grInventoryProductDetailId: Number(inventoryProductDetailId),
          specFieldId: Number(item.id),
          value: item.value,
          createdBy: userId,
          updatedBy: userId,
          createdAt: now,
          updatedAt: now,
        })
      );
      await prisma.gRProductSpecValue.createMany({
        data: specData,
        // skipDuplicates: true,
      });
    }
    const productSoftware = await prisma.inventoryProductDetail.findUnique({
      where: { id: inventoryProductDetailId },
      select: {
        id: true,
        uuid: true,
        softwareInstalls: {
          where: {
            status: true,
          },
          select: {
            id: true,
            value: true,
            softwares: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
    const productSpecification = await prisma.gRProductSpecValue.findMany({
      where: { grInventoryProductDetailId: inventoryProductDetailId },
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
    });
    const uuid = await generateNextCode(prisma.service, "uuid", "SVC");
    const services = await prisma.service.create({
      data: {
        uuid,
        inventoryProductDetailId: inventoryProductDetailId,
        nextServiceDate: nextServiceDate ? new Date(nextServiceDate) : null,
        latestVersionOfOsUpdate: serviceDetails.latestVersionOfOsUpdate,
        harddiskCheck: serviceDetails.harddiskCheck,
        monitorCheck: serviceDetails.monitorCheck,
        tcpipCheck: serviceDetails.tcpipCheck,
        azurejoinandDomainCheck: serviceDetails.azurejoinandDomainCheck,
        adPolicyCheck: serviceDetails.adPolicyCheck,
        zscalerandDnsCheck: serviceDetails.zscalerandDnsCheck,
        deviceManagerCheck: serviceDetails.deviceManagerCheck,
        hDDPerformanceCheck: serviceDetails.hDDPerformanceCheck,
        systemDriverStatusCheck: serviceDetails.systemDriverStatusCheck,
        memorySpeedCheck: serviceDetails.memorySpeedCheck,
        laptopBatteryCheck: serviceDetails.laptopBatteryCheck,
        zscalerProxyVerUpgrade: serviceDetails.zscalerProxyVerUpgrade,
        applicationLicenseCheck: serviceDetails.applicationLicenseCheck,
        applicationOffice: serviceDetails.applicationOffice,
        antivirusStatusCheck: serviceDetails.antivirusStatusCheck,
        antiVirusPolicyCheck: serviceDetails.antiVirusPolicyCheck,
        systemScanAndLogCheck: serviceDetails.systemScanAndLogCheck,
        wsusPatchRelease: serviceDetails.wsusPatchRelease,
        intuneApplicationCheck: serviceDetails.intuneApplicationCheck,
        unWantedapplicationTobeRemoved:
          serviceDetails.unWantedapplicationTobeRemoved,
        tempRefetchPrefetchtobeDeleted:
          serviceDetails.tempRefetchPrefetchtobeDeleted,
        startupToBeConfigured: serviceDetails.startupToBeConfigured,
        bitLockerCheck: serviceDetails.bitLockerCheck,
        backupSolutionCheck: serviceDetails.backupSolutionCheck,
        mouseKeyboardStatus: serviceDetails.mouseKeyboardStatus,
        createdBy: userId,
        updatedBy: userId,
        servicingCost: serviceDetails.servicingCost,
        servicingRemarks: serviceDetails.servicingRemarks,
        installationDetails: productSoftware
          ? JSON.stringify(productSoftware)
          : undefined,
        specificationsDetails: productSpecification
          ? JSON.stringify(productSpecification)
          : undefined,
        createdAt: now,
        updatedAt: now,
      },
    });
    await prisma.inventoryProductDetail.update({
      where: { id: Number(inventoryProductDetailId) },
      data: {
        updatedBy: userId,
        updatedAt: now,
        nextServiceDate: nextServiceDate ? new Date(nextServiceDate) : null,
        maintenanceDueDate: nextServiceDate ? new Date(nextServiceDate) : null,
      },
    });
    const updatedInventoryProductDetail =
      await prisma.inventoryProductDetail.findUnique({
        where: { id: inventoryProductDetailId },
        select: {
          id: true,
          uuid: true,
          serialNo1: true,
          nextServiceDate: true,
          maintenanceDueDate: true,
          assignedStatus: true,
          softwareInstalls: {
            where: {
              status: true,
            },
            select: {
              id: true,
              value: true,
              softwares: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });
    const log = await prisma.log.create({
      data: {
        action: LogAction.ASSET_SERVICE,
        userId: userId,
        relatedModelType: "prisma.inventoryProductDetail",
        relatedModelId: inventoryProductDetailId,
        details: JSON.stringify({
          updatedInventoryProductDetail,
          services,
        }),
      },
    });

    await createLogReport(
      services.uuid,
      inventoryProductDetailId,
      `Service Update for Inventory Product ${updatedInventoryProductDetail?.uuid} Servicing Cost ${serviceDetails.servicingCost} and remarks ${serviceDetails.servicingRemarks}`,
      services.createdAt,
      "Updated Service",
      userId,
      log.id,
      `${process.env.FRONTEND_URL}/completed-service-process/details/${services.uuid}`,
      updatedInventoryProductDetail?.assignedStatus,
      services?.servicingCost ?? 0
    );
    successResponse(
      res,
      200,
      "Service details updated successfully",
      {
        services,
        inventoryProductDetail: updatedInventoryProductDetail,
      },
      null
    );
  } catch (error) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 400));
    }
    return next(new ErrorHandler("An unknown error occurred", 500));
  }
};

export const getServiceDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const uuid = getSafeString(req.params.id);
    const service = await prisma.service.findFirst({
      where: { uuid },
      include: {
        inventoryProductDetail: {
          select: {
            id: true,
            uuid: true,
            serialNo1: true,
            nextServiceDate: true,
            maintenanceDueDate: true,
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
            softwareInstalls: {
              where: {
                status: true,
              },
              select: {
                id: true,
                value: true,
                softwares: {
                  select: {
                    id: true,
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

            grInventoryProduct: {
              select: {
                id: true,
                uuid: true,
                grDetails: {
                  select: {
                    grDate: true,
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
                  },
                },
              },
            },
          },
        },
        createdUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    if (!service) {
      return next(new ErrorHandler("Service not found", 404));
    }
    successResponse(
      res,
      200,
      "Service details fetched successfully",
      service,
      null
    );
  } catch (error) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 400));
    }
    return next(new ErrorHandler("An unknown error occurred", 500));
  }
};

export const getServices = async (
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
      "nextServiceDate",
      "maintenanceDueDate",
      "createdAt",
      "updatedAt",
    ];
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
    const searchFilter = search
      ? {
        OR: [
          {
            inventoryProductDetail: {
              serialNo1: {
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
              AssignProductDetails: {
                some: {
                  assignedToUser: {
                    name: {
                      contains: search,
                    },
                  },
                },
              },
            },
          },
          {
            inventoryProductDetail: {
              AssignProductDetails: {
                some: {
                  assignedToLocation: {
                    name: {
                      contains: search,
                    },
                  },
                },
              },
            },
          },
        ],
      }
      : {};
    let service = null;
    let totalCount = 0;
    if (user.roles.some((role) => role.name === "Super Admin")) {
      service = await prisma.service.findMany({
        where: searchFilter,
        include: {
          inventoryProductDetail: {
            select: {
              id: true,
              uuid: true,
              serialNo1: true,
              nextServiceDate: true,
              maintenanceDueDate: true,
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
              softwareInstalls: {
                where: {
                  status: true,
                },
                select: {
                  id: true,
                  value: true,
                  softwares: {
                    select: {
                      id: true,
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
              grInventoryProduct: {
                select: {
                  id: true,
                  uuid: true,
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
        take: limit,
        skip: (page - 1) * limit,
        orderBy: {
          [finalSortBy]: sortOrder,
        },
      });
      totalCount = await prisma.service.count({
        where: searchFilter,
      });
    } else {
      service = await prisma.service.findMany({
        where: {
          ...searchFilter,
          inventoryProductDetail: {
            unitId: user.unitId,
          },
        },
        include: {
          inventoryProductDetail: {
            select: {
              id: true,
              uuid: true,
              serialNo1: true,
              nextServiceDate: true,
              maintenanceDueDate: true,
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
              softwareInstalls: {
                where: {
                  status: true,
                },
                select: {
                  id: true,
                  value: true,
                  softwares: {
                    select: {
                      id: true,
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
              grInventoryProduct: {
                select: {
                  id: true,
                  uuid: true,
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
        take: limit,
        skip: (page - 1) * limit,
        orderBy: {
          [finalSortBy]: sortOrder,
        },
      });
      totalCount = await prisma.service.count({
        where: {
          ...searchFilter,
          inventoryProductDetail: { unitId: user.unitId },
        },
      });
    }

    successResponse(
      res,
      200,
      "Service details fetched successfully",
      createPagedResponse(service, page, limit, totalCount),
      null
    );
  } catch (error) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 400));
    }
    return next(new ErrorHandler("An unknown error occurred", 500));
  }
};
