import { successResponse } from "@utils/successResponse";
import { ErrorHandler } from "@utils/ErrorHandler";
import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "../../../prisma/generated/prisma";
const prisma = new PrismaClient();
import { createPagedResponse } from "@src/utils/pagedResponse";

export const reportGet = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get filters from both query params and body (query params take precedence)
    const queryParams = req.query;
    const bodyParams = req.body || {};
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sortOrder = req.query.sortOrder === "asc" ? "asc" : "desc";
    const sortBy = (req.query.sortBy as string) || "createdAt";

    const allowedSortFields = [
      "uuid",
      "serialNo1",
      "assignedStatus",
      "createdAt",
      "updatedAt",
    ];
    const finalSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";
    const {
      AssetID,

      AssetSerial,
      AssetSAPCode,
      installedSoftware,
      POID,
      GRID,
      DateStart,
      DateEnd,
      AssetProduct,
      AssetCategory,
      AssetSubcat,
      AssignedtoUser,
      AssetUNIT,
      AssetLocation,
      AssignedDEPT,
      AssetBrand,
      AssetStatus,
      specField,
      ServiceAwaiting,
      ServiceExpired,
      AssetAge,
      serviceDate,
      serviceWithin,
    } = {
      ...bodyParams, // Start with body params
      ...queryParams, // Override with query params
    };

    // Build the where clause for the query
    const where: any = {};

    // Asset ID filter (inventory product detail ID)
    if (AssetID) {
      where.uuid = AssetID;
    }

    // Asset Serial filter
    if (AssetSerial) {
      where.OR = [
        { serialNo1: { contains: AssetSerial as string } },
        { serialNo2: { contains: AssetSerial as string } },
      ];
    }

    // Asset SAP Code filter (GR ID) - only add if provided
    if (AssetSAPCode) {
      if (!where.grInventoryProduct) {
        where.grInventoryProduct = {};
      }
      where.grInventoryProduct = {
        sapCode: { contains: AssetSAPCode as string },
      };
    }

    // PO ID filter (from GR details) - merge with existing grInventoryProduct conditions
    if (POID) {
      if (!where.grInventoryProduct) {
        where.grInventoryProduct = {};
      }
      if (!where.inventoryProducts.grDetails) {
        where.inventoryProducts.grDetails = {};
      }
      where.inventoryProducts.grDetails.sapId = {
        contains: POID as string,
      };
    }

    // GR ID filter - merge with existing grInventoryProduct conditions
    if (GRID) {
      if (!where.grInventoryProduct) {
        where.grInventoryProduct = {};
      }
      if (!where.inventoryProducts.grDetails) {
        where.inventoryProducts.grDetails = {};
      }
      where.inventoryProducts.grDetails.grId = { contains: GRID as string };
    }

    // Asset UNIT filter - merge with existing grInventoryProduct conditions
    if (AssetUNIT) {
      where.unit = {
        name: { contains: AssetUNIT as string },
      };
    }
    if (AssetLocation) {
      where.OR = [
        {
          AssignProductDetails: {
            some: {
              assignedToLocation: {
                name: { contains: AssetLocation as string },
              },
            },
          },
        },
        {
          location: {
            name: { contains: AssetLocation as string },
          },
        },
      ];
    }

    // Asset Product, Category, Subcategory, Brand filters - merge properly
    if (AssetProduct || AssetCategory || AssetSubcat || AssetBrand) {
      if (!where.grInventoryProduct) {
        where.grInventoryProduct = {};
      }
      if (!where.inventoryProducts.product) {
        where.inventoryProducts.product = {};
      }

      // Asset Product (model) filter
      if (AssetProduct) {
        where.inventoryProducts.product.name = {
          contains: AssetProduct as string,
        };
      }

      // Asset Category filter
      if (AssetCategory) {
        where.inventoryProducts.product.category = {
          name: { contains: AssetCategory as string },
        };
      }

      // Asset Subcategory filter
      if (AssetSubcat) {
        where.inventoryProducts.product.subcategory = {
          name: { contains: AssetSubcat as string },
        };
      }

      // Asset Brand filter
      if (AssetBrand) {
        where.inventoryProducts.product.brand = {
          name: { contains: AssetBrand as string },
        };
      }
    }

    // Date range filter (assignment dates)
    if (DateStart || DateEnd) {
      // for assigned to start date and end date
      // const dateFilter: any = {};
      // if (DateStart) {
      //   dateFilter.gte = new Date(DateStart as string);
      // }
      // if (DateEnd) {
      //   dateFilter.lte = new Date(DateEnd as string);
      // }

      // where.in = {
      //   some: {
      //     OR: [{ startDate: dateFilter }, { endDate: dateFilter }],
      //   },
      // };

      // for based on grdate
      if (DateStart || DateEnd) {
        const dateFilter: any = {};

        if (DateStart) {
          const fromDate = new Date(DateStart as string);
          fromDate.setHours(0, 0, 0, 0); // Start of day
          dateFilter.gte = fromDate;
        }

        if (DateEnd) {
          const toDate = new Date(DateEnd as string);
          toDate.setHours(23, 59, 59, 999); // End of day
          dateFilter.lte = toDate;
        }

        if (!where.grInventoryProduct) where.grInventoryProduct = {};
        if (!where.inventoryProducts.grDetails)
          where.inventoryProducts.grDetails = {};

        where.inventoryProducts.grDetails.grDate = dateFilter;
      }
    }

    // Assigned to User, Location, Department filters - merge properly
    if (AssignedtoUser || AssignedDEPT) {
      if (!where.AssignProductDetails) {
        where.AssignProductDetails = { some: {} };
      }

      const assignmentConditions: any[] = [];

      // Assigned to User filter
      if (AssignedtoUser) {
        assignmentConditions.push({
          assignedToUser: {
            OR: [
              { name: { contains: AssignedtoUser as string } },
              { email: { contains: AssignedtoUser as string } },
              { username: { contains: AssignedtoUser as string } },
            ],
          },
        });
      }

      // Assigned DEPT filter
      if (AssignedDEPT) {
        assignmentConditions.push({
          assignedToUser: {
            department: {
              name: { contains: AssignedDEPT as string },
            },
          },
        });
      }

      // Merge assignment conditions
      if (assignmentConditions.length > 0) {
        where.AssignProductDetails.some.AND = assignmentConditions;
      }
    }

    // Asset Status filter
    if (AssetStatus) {
      where.assignedStatus = AssetStatus as string;
    }

    // Installed Software filter - expects object with id and value
    if (installedSoftware) {
      let softwareFilter;

      if (typeof installedSoftware === "string") {
        // If it's a string, try to parse it as JSON
        try {
          softwareFilter = JSON.parse(installedSoftware);
        } catch {
          // If parsing fails, treat as software name search
          softwareFilter = { name: installedSoftware };
        }
      } else {
        softwareFilter = installedSoftware;
      }

      const softwareConditions: any[] = [];

      // Search by software ID
      if (softwareFilter.id) {
        softwareConditions.push({
          softwareId: parseInt(softwareFilter.id),
        });
      }

      // Search by software name
      if (softwareFilter.name) {
        softwareConditions.push({
          softwares: {
            name: { contains: softwareFilter.name },
          },
        });
      }

      // Search by installation value
      if (softwareFilter.value) {
        softwareConditions.push({
          value: { contains: softwareFilter.value },
        });
      }

      if (softwareConditions.length > 0) {
        where.softwareInstalls = {
          some: {
            OR: softwareConditions,
          },
        };
      }
    }

    // Spec Field filter - expects object with id and value
    if (specField) {
      let specFieldFilter;

      if (typeof specField === "string") {
        // If it's a string, try to parse it as JSON
        try {
          specFieldFilter = JSON.parse(specField);
        } catch {
          // If parsing fails, treat as spec field value search
          specFieldFilter = { value: specField };
        }
      } else {
        specFieldFilter = specField;
      }

      const specFieldConditions: any[] = [];

      // Search by spec field ID
      if (specFieldFilter.id) {
        specFieldConditions.push({
          specFieldId: parseInt(specFieldFilter.id),
        });
      }

      // Search by spec field value
      if (specFieldFilter.value) {
        specFieldConditions.push({
          value: { contains: specFieldFilter.value },
        });
      }

      if (specFieldConditions.length > 0) {
        where.specValues = {
          some: {
            AND:
              specFieldConditions.length === 1
                ? specFieldConditions[0]
                : specFieldConditions,
          },
        };
      }
    }

    // Service Awaiting filter (from service table)
    if (ServiceAwaiting === "true" || ServiceAwaiting === true) {
      where.services = {
        some: {
          OR: [
            { harddiskCheck: "Awaiting" },
            { monitorCheck: "Awaiting" },
            { tcpipCheck: "Awaiting" },
          ],
        },
      };
    }

    // Service Expired filter (from service table)
    if (ServiceExpired === "true" || ServiceExpired === true) {
      if (!where.services) {
        where.services = { some: {} };
      } else if (where.services.some) {
        // Merge with existing service conditions
        const existingCondition = where.services.some;
        where.services.some = {
          AND: [
            existingCondition,
            {
              OR: [
                { harddiskCheck: "Expired" },
                { monitorCheck: "Expired" },
                { tcpipCheck: "Expired" },
              ],
            },
          ],
        };
      } else {
        where.services.some = {
          OR: [
            { harddiskCheck: "Expired" },
            { monitorCheck: "Expired" },
            { tcpipCheck: "Expired" },
          ],
        };
      }
    }

    // Asset Age filter (based on GR date)
    // Example: AssetAge = "0-6", "6-12", "12-24", "48+" etc. in months
    if (AssetAge) {
      const now = new Date();

      let fromDate: Date | undefined;
      let toDate: Date | undefined;

      if (typeof AssetAge === "string") {
        const ageStr = AssetAge.trim();

        if (ageStr.includes("+")) {
          // Format: "48+" ➜ older than 48 months
          const minMonths = parseInt(ageStr.replace("+", "").trim());
          if (!isNaN(minMonths)) {
            // Anything before (now - minMonths)
            toDate = new Date(now);
            toDate.setMonth(toDate.getMonth() - minMonths);
            toDate.setHours(23, 59, 59, 999); // end of day
          }
        } else if (ageStr.includes("-")) {
          // Format: "6-12" ➜ assets between 6 and 12 months old
          const [minStr, maxStr] = ageStr.split("-");
          const min = parseInt(minStr.trim()); // e.g., 6
          const max = parseInt(maxStr.trim()); // e.g., 12

          if (!isNaN(min) && !isNaN(max)) {
            // max months ago → earlier (older)
            fromDate = new Date(now);
            fromDate.setMonth(fromDate.getMonth() - max);
            fromDate.setHours(0, 0, 0, 0); // start of day

            // min months ago → more recent
            toDate = new Date(now);
            toDate.setMonth(toDate.getMonth() - min);
            toDate.setHours(23, 59, 59, 999); // end of day
          }
        }
      }

      if (fromDate || toDate) {
        if (!where.grInventoryProduct) where.grInventoryProduct = {};
        if (!where.inventoryProducts.grDetails)
          where.inventoryProducts.grDetails = {};

        const dateFilter: any = {};
        if (fromDate) dateFilter.gte = fromDate;
        if (toDate) dateFilter.lte = toDate;

        where.inventoryProducts.grDetails.grDate = dateFilter;
      }
    }

    const now = new Date();

    if (serviceDate) {
      const daysToAdd = parseInt(serviceDate, 10);
      const futureDate = new Date(now);
      futureDate.setDate(now.getDate() + daysToAdd);

      // Check maintenanceDueDate or nextServiceDate between now and futureDate
      where.OR = [
        {
          maintenanceDueDate: {
            gte: now,
            lte: futureDate,
          },
        },
        {
          nextServiceDate: {
            gte: now,
            lte: futureDate,
          },
        },
      ];
    }

    if (serviceWithin) {
      const daysToSubtract = parseInt(serviceWithin, 10);
      const pastDate = new Date(now);
      pastDate.setDate(now.getDate() - daysToSubtract);

      // Check if any service record created in the past X days
      where.services = {
        some: {
          createdAt: {
            gte: pastDate,
            lte: now,
          },
        },
      };
    }

    let inventoryProducts = null;
    let totalCount = 0;
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
    if (user.roles.some((role) => role.name === "Super Admin")) {
      // Query the database with all the filters
      inventoryProducts = await prisma.inventoryProductDetail.findMany({
         where: {...where, status: true,},
        select: {
          id: true,
          uuid: true,
          serialNo1: true,
          serialNo2: true,
          assignedStatus: true,
          sapCode: true,
          location: true,

          unit: {
            select: {
              id: true,
              name: true,
            },
          },
          isFree: true,
          isUsed: true,
          lifecycleExDate: true,
          maintenanceDueDate: true,
          nextServiceDate: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          specValues: {
            select: {
              id: true,
              value: true,
              specFieldId: true,
              specField: {
                select: {
                  id: true,
                  name: true,
                  fieldType: true,
                  unit: true,
                },
              },
            },
          },
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
          softwareInstalls: {
            where: {
              status: true,
            },
            select: {
              id: true,
              value: true,
              softwareId: true,
              installedAt: true,
              softwares: {
                select: {
                  id: true,
                  name: true,
                  version: true,
                },
              },
            },
          },
          AssignProductDetails: {
            include: {
              assignedToUser: {
                include: {
                  department: true,
                  location: true,
                },
              },
              assignedToLocation: true,
              issuer: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              approver: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: {
              startDate: "desc",
            },
          },
          qrCode: true,
          services: {
            select: {
              id: true,
              nextServiceDate: true,
              harddiskCheck: true,
              monitorCheck: true,
              tcpipCheck: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
        orderBy: {
          [finalSortBy]: sortOrder,
        },
        skip: (page - 1) * limit,
        take: limit,
      });
      totalCount = await prisma.inventoryProductDetail.count({
         where: {...where, status: true,},
      });
    } else {
      // Query the database with all the filters
      inventoryProducts = await prisma.inventoryProductDetail.findMany({
        where: { ...where, unitId: user.unitId, status: true, },
        select: {
          id: true,
          uuid: true,
          serialNo1: true,
          sapCode: true,
          location: true,
          unitId: true,
          serialNo2: true,
          assignedStatus: true,
          unit: {
            select: {
              id: true,
              name: true,
            },
          },
          isFree: true,
          isUsed: true,
          lifecycleExDate: true,
          maintenanceDueDate: true,
          nextServiceDate: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          specValues: {
            select: {
              id: true,
              value: true,
              specFieldId: true,
              specField: {
                select: {
                  id: true,
                  name: true,
                  fieldType: true,
                  unit: true,
                },
              },
            },
          },
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
          softwareInstalls: {
            where: {
              status: true,
            },
            select: {
              id: true,
              value: true,
              softwareId: true,
              installedAt: true,
              softwares: {
                select: {
                  id: true,
                  name: true,
                  version: true,
                },
              },
            },
          },
          AssignProductDetails: {
            include: {
              assignedToUser: {
                include: {
                  department: true,
                  location: true,
                },
              },
              assignedToLocation: true,
              issuer: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              approver: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: {
              startDate: "desc",
            },
          },
          qrCode: true,
          services: {
            select: {
              id: true,
              nextServiceDate: true,
              harddiskCheck: true,
              monitorCheck: true,
              tcpipCheck: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
        orderBy: {
          [finalSortBy]: sortOrder,
        },
        skip: (page - 1) * limit,
        take: limit,
      });
      totalCount = await prisma.inventoryProductDetail.count({
        where: { ...where, unitId: user.unitId },
      });
    }

    return successResponse(
      res,
      200,
      "Report data fetched successfully",
      createPagedResponse(inventoryProducts, page, limit, totalCount),
      null
    );
  } catch (error) {
    console.error("Error in report:", error);
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 500));
    }
    return next(new ErrorHandler("An unexpected error occurred", 500));
  }
};

export const Reportgetall = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
      },
    });
    const subcategory = await prisma.subcategory.findMany({
      select: {
        id: true,
        name: true,
      },
    });
    const user = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
      },
    });
    const brand = await prisma.brand.findMany({
      select: {
        id: true,
        name: true,
      },
    });
    const product = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
      },
    });
    const department = await prisma.department.findMany({
      select: {
        id: true,
        name: true,
      },
    });
    const specField = await prisma.specField.findMany({
      select: {
        id: true,
        name: true,
        options: {
          select: {
            value: true,
          },
        },
      },
    });
    const unit = await prisma.unit.findMany({
      select: {
        id: true,
        name: true,
      },
    });
    const location = await prisma.location.findMany({
      select: {
        id: true,
        name: true,
      },
    });
    const InstallationSoftware = await prisma.installationSoftware.findMany({
      select: {
        id: true,
        name: true,
        productInstalledSofts: {
          select: {
            id: true,
            value: true,
          },
        },
      },
    });

    return successResponse(
      res,
      200,
      "Data Fetch Successfully",
      {
        categories,
        subcategory,
        user,
        brand,
        product,
        department,
        specField,
        unit,
        location,
        InstallationSoftware,
      },
      null
    );
  } catch (error) {
    console.error("Error in report:", error);
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 500));
    }
    return next(new ErrorHandler("An unexpected error occurred", 500));
  }
};
