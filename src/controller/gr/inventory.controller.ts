import { successResponse } from "@utils/successResponse";
import { ErrorHandler } from "@utils/ErrorHandler";
import e, { Request, Response, NextFunction } from "express";
import { createPagedResponse } from "@utils/pagedResponse";
import { mapStatusParamToEnum } from "@src/helpers/statusMapper";
import { AssignedStatus, AssignmentStatus } from "@src/enum/enum";
import { getSafeString } from "@utils/paramHelper";
import prisma from "../../utils/prisma";


export const getInventory = async (
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

    const searchFilter = search
      ? {
        OR: [
          { uuid: { contains: search } },
          { serialNo1: { contains: search } },
          { serialNo2: { contains: search } },
          { assignedStatus: { equals: search as any } },

          // From related inventoryProducts.product
          {
            grInventoryProduct: {
              product: {
                OR: [
                  { name: { contains: search } },

                  {
                    brand: {
                      name: { contains: search },
                    },
                  },
                  {
                    category: {
                      name: { contains: search },
                    },
                  },
                ],
              },
            },
          },

          // From specValues
          {
            specValues: {
              some: {
                OR: [
                  { value: { contains: search } },
                  {
                    specField: {
                      name: { contains: search },
                    },
                  },
                ],
              },
            },
          },

          // From software installs
          {
            softwareInstalls: {
              some: {
                OR: [
                  { value: { contains: search } },
                  {
                    softwares: {
                      name: { contains: search },
                    },
                  },
                  {
                    softwares: {
                      version: { contains: search },
                    },
                  },
                ],
              },
            },
          },
        ],
      }
      : {};

    const allowedSortFields = [
      "uuid",
      "createdAt",
      "updatedAt",
      "assignedStatus",
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
    let inventory = null;
    let totalCount = 0;

    if (user.roles.some((role) => role.name === "Super Admin")) {
      inventory = await prisma.inventoryProductDetail.findMany({
        where: {
          status: true,
          ...searchFilter,
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
        },
        orderBy: {
          [finalSortBy]: sortOrder,
        },
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
            include: {
              brand: true,
              category: true,
              product: {
                include: {
                  brand: true,
                  category: true,
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
                  version: true,
                },
              },
            },
          },
        },
      });
      totalCount = await prisma.inventoryProductDetail.count({
        where: {
          status: true,
          ...searchFilter,
        },
      });
    } else {
      inventory = await prisma.inventoryProductDetail.findMany({
        where: {
          status: true,
          ...searchFilter,
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
        },
        orderBy: {
          [finalSortBy]: sortOrder,
        },
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
            include: {
              brand: true,
              category: true,
              product: {
                include: {
                  brand: true,
                  category: true,
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
                  version: true,
                },
              },
            },
          },
        },
      });
      totalCount = await prisma.inventoryProductDetail.count({
        where: {
          status: true,
          ...searchFilter,
          unitId: Number(user.unitId),
        },
      });
    }

    const pagedResponse = createPagedResponse(
      inventory,
      page,
      limit,
      totalCount
    );

    return successResponse(
      res,
      200,
      "Inventory fetched successfully",
      pagedResponse,
      null
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 500));
    }
    return next(new ErrorHandler("An unexpected error occurred", 500));
  }
};

export const getInventoryById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const safeId = getSafeString(id);
    const inventory = await prisma.inventoryProductDetail.findUnique({
      where: { id: parseInt(safeId) },
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
          include: {
            grDetails: true,
            product: {
              include: {
                brand: true,
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
                version: true,
              },
            },
          },
        },
      },
    });
    if (!inventory) {
      return next(new ErrorHandler("Inventory not found", 404));
    }
    return successResponse(
      res,
      200,
      "Inventory fetched successfully",
      inventory,
      null
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 500));
    }
    return next(new ErrorHandler("An unexpected error occurred", 500));
  }
};

export const updateGrInventory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const inventoryId = parseInt(getSafeString(req.params.id));
    const userId = req.user && req.user.id ? parseInt(req.user.id) : 0;

    if (isNaN(inventoryId)) {
      return next(new ErrorHandler("Invalid inventory ID", 400));
    }

    const {
      serialNo,
      productId,
      quantity,
      sapId,
      brandId,
      categoryId,
      subCategoryId,
      UnitId,
      vendorId,
    } = req.body;

    const existingInventory = await prisma.gRInventoryProduct.findUnique({
      where: { id: inventoryId },
      include: {
        inventoryDetails: true,
        grDetails: true,
        product: true,
      },
    });

    if (!existingInventory) {
      return next(new ErrorHandler("Inventory not found", 404));
    }

    // Start transaction
    const [updatedInventory] = await prisma.$transaction([
      // Update GRInventoryProduct
      prisma.gRInventoryProduct.update({
        where: { id: inventoryId },
        data: {
          ...(productId && { productId: Number(productId) }),
          ...(quantity && { quantity }),
          updatedBy: userId,
          updatedAt: new Date(),
        },
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
          product: {
            include: {
              brand: true,
            },
          },
        },
      }),

      // Optionally update related GRDetail
      ...(existingInventory.grDetails
        ? [
          prisma.gRDetail.update({
            where: { id: existingInventory.grDetailsId },
            data: {
              ...(sapId && { sapId }),
              ...(UnitId && { unitId: Number(UnitId) }),
              ...(vendorId && { vendorId: Number(vendorId) }),
              updatedBy: userId,
              updatedAt: new Date(),
            },
          }),
        ]
        : []),

      // Corrected Product update with nested relation updates
      ...(existingInventory.product
        ? [
          prisma.product.update({
            where: { id: Number(existingInventory.productId) },
            data: {
              ...(brandId && {
                brand: {
                  connect: { id: Number(brandId) },
                },
              }),
              ...(categoryId && {
                category: {
                  connect: { id: Number(categoryId) },
                },
              }),
              ...(subCategoryId && {
                subcategory: {
                  connect: { id: Number(subCategoryId) },
                },
              }),
              ...(serialNo && {
                serialNo: serialNo,
              }),
            },
          }),
        ]
        : []),
    ]);

    return successResponse(
      res,
      200,
      "Inventory updated successfully",
      updatedInventory,
      null
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 500));
    }
    return next(new ErrorHandler("An unexpected error occurred", 500));
  }
};

export const deleteGrInventory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const inventoryId = parseInt(getSafeString(req.params.id));
    if (isNaN(inventoryId)) {
      return next(new ErrorHandler("Invalid inventory ID", 400));
    }

    const existingInventory = await prisma.gRInventoryProduct.findUnique({
      where: { id: inventoryId },
    });

    if (!existingInventory) {
      return next(new ErrorHandler("Inventory not found", 404));
    }

    await prisma.gRInventoryProduct.delete({
      where: { id: inventoryId },
    });
    return successResponse(
      res,
      200,
      "Inventory deleted successfully",
      null,
      null
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 500));
    }
    return next(new ErrorHandler("An unexpected error occurred", 500));
  }
};

export const getInventoryByStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) ?? "";
    const sortBy = (req.query.sortBy as string) || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? "asc" : "desc";
    const statusParam = req.params.status as string;

    const filterLocation = req.query.location ? parseInt(req.query.location as string) : undefined;
    const filterUnit = req.query.unit ? parseInt(req.query.unit as string) : undefined;
    const filterBrand = req.query.brand ? parseInt(req.query.brand as string) : undefined;
    const filterCategory = req.query.category ? parseInt(req.query.category as string) : undefined;

    const allowedSortFields = [
      "uuid",
      "createdAt",
      "updatedAt",
      "assignedStatus",
    ];
    const finalSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    const assignedStatusEnum = mapStatusParamToEnum(statusParam);

    if (!assignedStatusEnum) {
      return next(new ErrorHandler("Invalid status parameter", 400));
    }

    let whereCondition: any = {
      status: true,
      AND: [],
    };

    if (filterLocation) {
      whereCondition.AND.push({ locationId: filterLocation });
    }
    if (filterUnit) {
      whereCondition.AND.push({ unitId: filterUnit });
    }
    if (filterBrand) {
      whereCondition.AND.push({
        grInventoryProduct: {
          OR: [
            { product: { brandId: filterBrand } },
            { brandId: filterBrand },
          ]
        },
      });
    }
    if (filterCategory) {
      whereCondition.AND.push({
        grInventoryProduct: {
          OR: [
            { product: { categoryId: filterCategory } },
            { categoryId: filterCategory },
          ]
        },
      });
    }
    if (search.trim()) {
      const searchFilter = {
        OR: [
          { uuid: { contains: search } },
          { serialNo1: { contains: search } },
          { serialNo2: { contains: search } },
          { assignedStatus: { equals: search as any } },
          {
            grInventoryProduct: {
              OR: [
                {
                  product: {
                    OR: [
                      { name: { contains: search } },
                      { brand: { name: { contains: search } } },
                      { category: { name: { contains: search } } },
                    ],
                  },
                },
                { brand: { name: { contains: search } } },
                { category: { name: { contains: search } } },
              ]
            },
          },
          {
            specValues: {
              some: {
                OR: [
                  { value: { contains: search } },
                  {
                    specField: {
                      name: { contains: search },
                    },
                  },
                ],
              },
            },
          },
          {
            softwareInstalls: {
              some: {
                OR: [
                  { value: { contains: search } },
                  {
                    softwares: {
                      name: { contains: search },
                    },
                  },
                  {
                    softwares: {
                      version: { contains: search },
                    },
                  },
                ],
              },
            },
          },
        ],
      };
      whereCondition.AND.push(searchFilter);
    }
    if (assignedStatusEnum === AssignedStatus.InStock) {
      whereCondition.OR = [
        {
          assignedStatus: {
            notIn: [AssignedStatus.E_WASTE, AssignedStatus.BLOCKED, AssignedStatus.ASSIGNED, AssignedStatus.WRITE_OFF],
          },
        },
      ];
    } else if (assignedStatusEnum === AssignedStatus.BLOCKED) {
      whereCondition.OR = [
        {
          assignedStatus: {
            in: [AssignedStatus.BLOCKED],
          },
        },
      ];
    } else if (assignedStatusEnum === AssignedStatus.E_WASTE) {
      whereCondition.OR = [
        {
          assignedStatus: {
            in: ["E-WASTE", "WRITE-OFF"],
          },
        },
      ];
    } else {
      whereCondition.assignedStatus = assignedStatusEnum;
    }
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

    let inventory = null;
    let totalCount = 0;
    if (user.roles.some((role) => role.name === "Super Admin")) {
      inventory = await prisma.inventoryProductDetail.findMany({
        where: { status: true, ...whereCondition },
        orderBy: {
          [finalSortBy]: sortOrder,
        },
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
          unit: {
            select: {
              id: true,
              name: true,
            },
          },
          location: {
            select: {
              id: true,
              name: true,
            },
          },
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
          AssignProductDetails: {
            where: {
              status: {
                notIn: [AssignmentStatus.Returned, AssignmentStatus.Revoked],
              },
            },
            select: {
              id: true,
              assignedId: true,
              assignedToUser: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  department: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                  designation: true,
                },
              },
            },
            orderBy: {
              createdAt: "desc",
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
              brand: true,
              category: true,
              product: {
                include: {
                  brand: true,
                  category: true,
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
                  version: true,
                },
              },
            },
          },
        },
      });
      totalCount = await prisma.inventoryProductDetail.count({
        where: { status: true, ...whereCondition },
      });
    } else {
      inventory = await prisma.inventoryProductDetail.findMany({
        where: { ...whereCondition, unit: { id: user.unitId }, status: true },
        orderBy: {
          [finalSortBy]: sortOrder,
        },
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
          unit: {
            select: {
              id: true,
              name: true,
            },
          },
          location: {
            select: {
              id: true,
              name: true,
            },
          },
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
          AssignProductDetails: {
            where: {
              status: {
                notIn: [AssignmentStatus.Returned, AssignmentStatus.Revoked],
              },
            },
            select: {
              id: true,
              assignedId: true,
              assignedToUser: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  department: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                  designation: true,
                },
              },
            },
            orderBy: {
              createdAt: "desc",
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
              brand: true,
              category: true,
              product: {
                include: {
                  brand: true,
                  category: true,
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
                  version: true,
                },
              },
            },
          },
        },
      });
      totalCount = await prisma.inventoryProductDetail.count({
        where: { ...whereCondition, unitId: user.unitId, status: true },
      });
    }

    const pagedResponse = createPagedResponse(
      inventory,
      page,
      limit,
      totalCount
    );

    return successResponse(
      res,
      200,
      "Inventory fetched successfully",
      pagedResponse,
      null
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 500));
    }
    return next(new ErrorHandler("An unexpected error occurred", 500));
  }
};

export const allAsset = async (
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
    const statusQuery = req.query.status as string;
    const isUsed = req.query.isUsed as string;
    const { startDate, endDate } = req.query;
    const installationStatus = req.query.installationStatus as string;
    const softwareFieldFilters = req.body.softwareFieldFilters;
    const specFieldFilters = req.body.specFieldFilters;
    const assetId = req.query.assetId as string;
    const unit = req.query.unit as string;
    const location = req.query.location as string;
    const sapCode = req.query.sapCode as string;
    const assignedtoUsername = req.query.username as string;
    const assignedtoEmail = req.query.email as string;
    const assignedtoDepartment = req.query.department as string;
    const subcategory = req.query.assetType as string;
    const serialNo1 = req.query.serialNumber as string;
    const description = req.query.description as string;
    const brand = req.query.make as string;
    const productName = req.query.model as string;
    const grId = req.query.grId as string;
    const sapId = req.query.poNo as string;
    const grNo = req.query.grNo as string;
    const invoiceNumber = req.query.invoiceNo as string;
    const povalue = req.query.poValue as string;
    const warrantyAmc = req.query.warrantyAmc as string;
    const warrantyExpiry = req.query.warrantyExpiryDate as string;
    const lastAuditDate = req.query.lastAuditDate as string;
    const maintenanceDueDate = req.query.maintenanceDueDate as string;
    const lifecycleExDate = req.query.lifecycleExDate as string;
    const invoiceDate = req.query.invoiceDate as string;
    const grDate = req.query.grDate as string;
    const poDate = req.query.poDate as string;
    const category = req.query.productCategory as string;
    const acquisitionDate = req.query.acquisitionDate as string;
    const allowedSortFields = [
      "uuid",
      "createdAt",
      "updatedAt",
      "assignedStatus",
    ];
    const finalSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    // Build where clause conditionally
    const whereClause: any = {
      status: true,
      assignedStatus: {
        notIn: [AssignedStatus.E_WASTE, AssignedStatus.WRITE_OFF],
      },
    };

    if (search.trim()) {
      whereClause.OR = [
        {
          OR: [
            { uuid: { contains: search } },
            { serialNo1: { contains: search } },
            { serialNo2: { contains: search } },
            { assignedStatus: { equals: search as any } },
            {
              AssignProductDetails: {
                some: {
                  assignedToUser: {
                    OR: [
                      {
                        name: {
                          contains: search,
                        },
                      },
                      {
                        email: {
                          contains: search,
                        },
                      },
                    ],
                  },
                  status: {
                    notIn: [
                      AssignmentStatus.Returned,
                      AssignmentStatus.Revoked,
                    ],
                  },
                },
              },
            },
            {
              unit: { name: { contains: search } },
            },
            { location: { name: { contains: search } } },

            // From related inventoryProducts.product
            {
              grInventoryProduct: {
                product: {
                  OR: [
                    { name: { contains: search } },

                    {
                      brand: {
                        name: { contains: search },
                      },
                    },
                    {
                      category: {
                        name: { contains: search },
                      },
                    },
                  ],
                },
              },
            },

            // From specValues
            {
              specValues: {
                some: {
                  OR: [
                    { value: { contains: search } },
                    {
                      specField: {
                        name: { contains: search },
                      },
                    },
                  ],
                },
              },
            },

            // From software installs
            {
              softwareInstalls: {
                some: {
                  OR: [
                    { value: { contains: search } },
                    {
                      softwares: {
                        name: { contains: search },
                      },
                    },
                    {
                      softwares: {
                        version: { contains: search },
                      },
                    },
                  ],
                },
              },
            },
          ],
        },
      ];
    }
    if (statusQuery) {
      const assignedStatusEnum = mapStatusParamToEnum(statusQuery);
      if (!assignedStatusEnum) {
        return next(new ErrorHandler("Invalid status parameter", 400));
      }
      if (assignedStatusEnum === AssignedStatus.InStock) {
        whereClause.OR = [
          {
            assignedStatus: {
              notIn: [AssignedStatus.E_WASTE, AssignedStatus.BLOCKED, AssignedStatus.ASSIGNED, AssignedStatus.WRITE_OFF],
            },
          },
        ];
      } else if (assignedStatusEnum === AssignedStatus.BLOCKED) {
        whereClause.OR = [
          {
            assignedStatus: {
              in: [AssignedStatus.BLOCKED],
            },
          },
        ];
      } else if (assignedStatusEnum === AssignedStatus.E_WASTE) {
        whereClause.OR = [
          {
            assignedStatus: {
              in: ["E-WASTE", "WRITE-OFF"],
            },
          },
        ];
      } else if (assignedStatusEnum === AssignedStatus.ASSIGNED) {
        whereClause.assignedStatus = AssignedStatus.ASSIGNED;
      }
    }
    if (isUsed) {
      if (isUsed === "true") {
        whereClause.isUsed = true;
      }
      if (isUsed === "false") {
        whereClause.isUsed = false;
      }
    }
    if (endDate || startDate) {
      const dateFilter: any = {};

      if (startDate) {
        const fromDate = new Date(startDate as string);
        fromDate.setHours(0, 0, 0, 0); // Start of day
        dateFilter.gte = fromDate;
      }

      if (endDate) {
        const toDate = new Date(endDate as string);
        toDate.setHours(23, 59, 59, 999); // End of day
        dateFilter.lte = toDate;
      }

      if (!whereClause.grInventoryProduct) whereClause.grInventoryProduct = {};
      if (!whereClause.inventoryProducts.grDetails)
        whereClause.inventoryProducts.grDetails = {};

      whereClause.inventoryProducts.grDetails.grDate = dateFilter;
    }
    if (installationStatus) {
      if (installationStatus === "false") {
        whereClause.installationStatus = false;
        whereClause.grInventoryProduct = {
          product: {
            category: {
              name: "IT Assets",
            },
          },
        };
      }
      if (installationStatus === "true") {
        whereClause.installationStatus = true;
      }
    }
    // Installed Software filter - expects object with id and value
    if (softwareFieldFilters && Array.isArray(softwareFieldFilters)) {
      const softwareConditions: any[] = [];

      for (const filter of softwareFieldFilters) {
        const subConditions: any[] = [];

        if (filter.id) {
          subConditions.push({
            softwareId: parseInt(filter.id),
          });
        }

        if (filter.name) {
          subConditions.push({
            value: { contains: filter.name },
          });
        }

        if (subConditions.length > 0) {
          // Push each filter as its own 'some' condition
          softwareConditions.push({
            softwareInstalls: {
              some: {
                AND: subConditions,
              },
            },
          });
        }
      }

      if (softwareConditions.length > 0) {
        // All software filters must match (i.e., every software install condition must be met)
        whereClause.AND = whereClause.AND || [];
        whereClause.AND.push(...softwareConditions);
      }
    }

    // Fix for specFieldFilters
    if (specFieldFilters && Array.isArray(specFieldFilters)) {
      const specFieldConditions: any[] = [];

      for (const filter of specFieldFilters) {
        const subConditions: any[] = [];

        if (filter.id) {
          subConditions.push({
            specFieldId: parseInt(filter.id),
          });
        }

        if (filter.value) {
          subConditions.push({
            value: { contains: filter.value },
          });
        }

        if (subConditions.length > 0) {
          specFieldConditions.push({
            specValues: {
              some: {
                AND: subConditions,
              },
            },
          });
        }
      }

      if (specFieldConditions.length > 0) {
        // Ensure asset has ALL specified specValues present
        whereClause.AND = whereClause.AND || [];
        whereClause.AND.push(...specFieldConditions);
      }
    }

    if (assetId) {
      whereClause.uuid = { contains: assetId };
    }
    if (unit) {
      whereClause.unit = { name: { contains: unit } };
    }
    if (location) {
      whereClause.location = { name: { contains: location } };
    }
    if (sapCode) {
      whereClause.sapCode = { contains: sapCode };
    }
    if (assignedtoUsername || assignedtoEmail || assignedtoDepartment) {
      whereClause.AssignProductDetails = {
        some: {
          status: {
            notIn: [AssignmentStatus.Returned, AssignmentStatus.Revoked],
          },
          assignedToUser: {
            ...(assignedtoUsername && {
              name: { contains: assignedtoUsername },
            }),
            ...(assignedtoEmail && { email: { contains: assignedtoEmail } }),
            ...(assignedtoDepartment && {
              department: {
                name: { equals: assignedtoDepartment },
              },
            }),
          },
        },
      };
    }
    if (subcategory) {
      whereClause.grInventoryProduct = {
        ...whereClause.grInventoryProduct,
        product: {
          ...whereClause.grInventoryProduct?.product,
          category: {
            name: { contains: subcategory },
          },
        },
      };
    }
    if (serialNo1) {
      whereClause.serialNo1 = { contains: serialNo1 };
    }
    if (description) {
      whereClause.grInventoryProduct = {
        ...whereClause.grInventoryProduct,
        description: { contains: description },
      };
    }
    if (brand) {
      whereClause.grInventoryProduct = {
        ...whereClause.grInventoryProduct,
        product: {
          ...whereClause.grInventoryProduct?.product,
          brand: {
            name: { contains: brand },
          },
        },
      };
    }
    if (productName) {
      whereClause.grInventoryProduct = {
        ...whereClause.grInventoryProduct,
        product: {
          ...whereClause.grInventoryProduct?.product,
          name: { contains: productName },
        },
      };
    }
    if (grId) {
      whereClause.grInventoryProduct = {
        ...whereClause.grInventoryProduct,
        grId: { contains: grId },
      };
    }
    if (grNo) {
      whereClause.grInventoryProduct = {
        ...whereClause.grInventoryProduct,
        grDetails: {
          grId: { contains: grNo },
        },
      };
    }
    if (sapId) {
      whereClause.grInventoryProduct = {
        ...whereClause.grInventoryProduct,
        grDetails: {
          sapId: { contains: sapId },
        },
      };
    }
    if (invoiceNumber) {
      whereClause.grInventoryProduct = {
        ...whereClause.grInventoryProduct,
        grDetails: {
          invoiceNumber: { contains: invoiceNumber },
        },
      };
    }
    if (povalue) {
      const povalueNumber = parseFloat(povalue);
      if (!isNaN(povalueNumber)) {
        whereClause.grInventoryProduct = {
          ...whereClause.grInventoryProduct,
          totalAmount: { equals: povalueNumber },
        };
      }
    }
    if (warrantyExpiry || warrantyAmc) {
      const warrantyDate = new Date(warrantyExpiry ?? warrantyAmc);
      if (!isNaN(warrantyDate.getTime())) {
        whereClause.grInventoryProduct = {
          ...whereClause.grInventoryProduct,
          warrantyTill: { equals: warrantyDate },
        };
      }
    }
    if (lastAuditDate) {
      const lastAuditStart = new Date(lastAuditDate);
      lastAuditStart.setHours(0, 0, 0, 0);
      const lastAuditEnd = new Date(lastAuditDate);
      lastAuditEnd.setHours(23, 59, 59, 999);
      whereClause.updatedAt = { gte: lastAuditStart, lte: lastAuditEnd };
    }
    if (maintenanceDueDate) {
      const maintenanceDate = new Date(maintenanceDueDate);
      whereClause.maintenanceDueDate = { equals: maintenanceDate };
    }
    if (lifecycleExDate) {
      const lifecycleDate = new Date(lifecycleExDate);
      whereClause.lifecycleExDate = { equals: lifecycleDate };
    }
    if (invoiceDate || poDate || grDate) {
      whereClause.grInventoryProduct = {
        ...whereClause.grInventoryProduct,
        grDetails: {
          ...whereClause.grInventoryProduct?.grDetails,
          ...(invoiceDate && {
            invoiceDate: { equals: new Date(invoiceDate) },
          }),
          ...(poDate && {
            sapDate: { equals: new Date(poDate) },
          }),
          ...(grDate && {
            grDate: { equals: new Date(grDate) },
          }),
        },
      };
    }
    if (category) {
      whereClause.grInventoryProduct = {
        ...whereClause.grInventoryProduct,
        product: {
          ...whereClause.grInventoryProduct?.product,
          category: {
            name: { contains: category },
          },
        },
      };
    }
    if (acquisitionDate) {
      const acqDateStart = new Date(acquisitionDate);
      acqDateStart.setHours(0, 0, 0, 0);
      const acqDateEnd = new Date(acquisitionDate);
      acqDateEnd.setHours(23, 59, 59, 999);
      whereClause.grInventoryProduct = {
        ...whereClause.grInventoryProduct,
        createdAt: { gte: acqDateStart, lte: acqDateEnd },
      };
    }

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
    let inventory = null;
    let totalCount = 0;
    if (user.roles.some((role) => role.name === "Super Admin")) {
      inventory = await prisma.inventoryProductDetail.findMany({
        where: { ...whereClause, status: true },
        orderBy: {
          [finalSortBy]: sortOrder,
        },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          createdUser: {
            select: {
              name: true,
            },
          },
          unit: {
            select: {
              name: true,
              id: true,
            },
          },
          location: {
            select: {
              id: true,
              name: true,
            },
          },
          updatedUser: {
            select: {
              name: true,
            },
          },
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
          AssignProductDetails: {
            where: {
              status: {
                notIn: [AssignmentStatus.Returned, AssignmentStatus.Revoked],
              },
            },
            select: {
              id: true,
              assignedToUser: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  department: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                  designation: true,
                },
              },
            },
          },
          grInventoryProduct: {
            include: {
              brand: true,
              category: true,
              product: {
                include: {
                  brand: true,
                  category: true,
                },
              },
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
                  version: true,
                },
              },
            },
          },
          services: {
            select: {
              servicingCost: true,
            },
          },
        },
      });
      totalCount = await prisma.inventoryProductDetail.count({
        where: { ...whereClause, status: true },
      });
    } else {
      inventory = await prisma.inventoryProductDetail.findMany({
        where: { ...whereClause, unit: { id: user.unitId }, status: true },
        orderBy: {
          [finalSortBy]: sortOrder,
        },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          createdUser: {
            select: {
              name: true,
              id: true,
            },
          },
          unit: {
            select: {
              name: true,
              id: true,
            },
          },
          location: {
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
          AssignProductDetails: {
            where: {
              status: {
                notIn: [AssignmentStatus.Returned, AssignmentStatus.Revoked],
              },
            },
            select: {
              id: true,
              assignedToUser: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  department: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                  designation: true,
                },
              },
            },
          },
          grInventoryProduct: {
            include: {
              brand: true,
              category: true,
              product: {
                include: {
                  brand: true,
                  category: true,
                },
              },
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
                  version: true,
                },
              },
            },
          },
          services: {
            select: {
              servicingCost: true,
            },
          },
        },
      });
      totalCount = await prisma.inventoryProductDetail.count({
        where: { ...whereClause, unit: { id: user.unitId }, status: true },
      });
    }
    inventory = inventory.map((item) => {
      const ratePerPiece = item.grInventoryProduct?.ratePerPiece || 0;
      const servicingCostTotal = item.services?.reduce(
        (sum, service) => sum + (service.servicingCost || 0),
        0
      );

      return {
        ...item,
        totalCost: ratePerPiece + servicingCostTotal,
      };
    });

    const pagedResponse = createPagedResponse(
      inventory,
      page,
      limit,
      totalCount
    );

    return successResponse(
      res,
      200,
      "Inventory fetched successfully",
      pagedResponse,
      null
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 500));
    }
    return next(new ErrorHandler("An unexpected error occurred", 500));
  }
};

export const getInventorySummary = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const filterLocation = req.query.location ? parseInt(req.query.location as string) : undefined;
    const filterUnit = req.query.unit ? parseInt(req.query.unit as string) : undefined;
    const filterBrand = req.query.brand ? parseInt(req.query.brand as string) : undefined;
    const filterCategory = req.query.category ? parseInt(req.query.category as string) : undefined;

    const whereClause: any = {
      status: true,
      assignedStatus: {
        notIn: [AssignedStatus.E_WASTE, AssignedStatus.BLOCKED, AssignedStatus.ASSIGNED, AssignedStatus.WRITE_OFF],
      },
      AND: [],
    };

    if (filterLocation) {
      whereClause.AND.push({ locationId: filterLocation });
    }
    if (filterUnit) {
      whereClause.AND.push({ unitId: filterUnit });
    }
    if (filterBrand) {
      whereClause.AND.push({
        grInventoryProduct: {
          product: {
            brandId: filterBrand,
          },
        },
      });
    }
    if (filterCategory) {
      whereClause.AND.push({
        grInventoryProduct: {
          product: {
            categoryId: filterCategory,
          },
        },
      });
    }

    const assets = await prisma.inventoryProductDetail.findMany({
      where: whereClause,
      include: {
        grInventoryProduct: {
          include: {
            product: {
              include: {
                brand: true,
                category: true,
              },
            },
          },
        },
      },
    });

    const summaryMap = new Map<string, { brand: string; product: string; quantity: number }>();

    for (const asset of assets) {
      const prod = asset.grInventoryProduct?.product;
      if (!prod) continue;
      const brandName = prod.brand?.name ?? "Unknown Brand";
      const productName = prod.name ?? "Unknown Product";
      const key = `${brandName} - ${productName}`;

      const existing = summaryMap.get(key);
      if (existing) {
        existing.quantity += 1;
      } else {
        summaryMap.set(key, {
          brand: brandName,
          product: productName,
          quantity: 1,
        });
      }
    }

    const summaryList = Array.from(summaryMap.values());

    return successResponse(
      res,
      200,
      "Inventory summary retrieved successfully",
      summaryList,
      null
    );
  } catch (error: unknown) {
    console.error(error);
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 500));
    }
    return next(new ErrorHandler("An unexpected error occurred", 500));
  }
};
