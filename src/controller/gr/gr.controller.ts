import { successResponse } from "@utils/successResponse";
import { Request, Response, NextFunction } from "express";
import { ErrorHandler } from "@utils/ErrorHandler";
import { PrismaClient } from "../../../prisma/generated/prisma";
import { createPagedResponse } from "@utils/pagedResponse";
import { generateNextCode } from "@utils/codeGenerator";
import { uploadFiles } from "@src/helpers/uploadFiles";
import { generateQRCode } from "@utils/qrCodeGenerator";
import { sendGrEmail } from "@utils/mail";
import { formatDate } from "@utils/formatDate";
import { LogAction } from "@src/enum/enum";
import { createLogReport } from "@utils/logReport";
import * as dotenv from "dotenv";
import { jsongenerateQRCode } from "@src/utils/jsonqrcodeGenerator";
import { foundSuperAdminUnitAdmin } from "@src/utils/foundSuperAdminUnitAdmin";
import { MailActions } from "@src/enum/enum";
import { getSafeString, getSafeStringOrUndefined } from "@utils/paramHelper";

dotenv.config();

const prisma = new PrismaClient();

export const createGr = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      sapId,
      sapDate,
      invoiceNumber,
      invoiceDate,
      grId,
      grDate,
      vendorId,
      locationId,
      unitId,
      description,
      products = [],
    } = req.body;

    const userId = parseInt(req.user?.id ?? "0");

    // Validate quantity against MSQ
    for (const prod of products) {
      const dbProduct = await prisma.product.findUnique({
        where: { id: Number(prod.productId) },
        select: { name: true, msq: true },
      });
      if (!dbProduct) {
        return next(new ErrorHandler(`Product with ID ${prod.productId} not found`, 404));
      }
      if (dbProduct.msq) {
        const msqVal = parseInt(dbProduct.msq);
        if (!isNaN(msqVal) && Number(prod.quantity) > msqVal) {
          return next(
            new ErrorHandler(
              `Quantity for product "${dbProduct.name}" (${prod.quantity}) cannot exceed its Minimum Stock Quantity limit of ${msqVal}`,
              400
            )
          );
        }
      }
    }
    const uuid = await generateNextCode(prisma.gRDetail, "uuid", "GR-");
    const location = await prisma.location.findFirst({
      where: {
        id: Number(locationId),
      },
      select: {
        id: true,
        abbriviatedName: true,
        name: true,
      },
    });
    const locationAbbr =
      location?.abbriviatedName ??
      location?.name.slice(0, 3).toUpperCase() ??
      "N/A";
    const unit = await prisma.unit.findFirst({
      where: {
        id: Number(unitId),
      },
      select: {
        id: true,
        abbriviatedName: true,
        name: true,
        identificationNumber: true,
      },
    });
    const unitAbbr =
      unit?.abbriviatedName ?? unit?.name.slice(0, 3).toUpperCase() ?? "N/A";

    const invoiceFile =
      req.files && !Array.isArray(req.files) && "invoiceFile" in req.files
        ? (req.files["invoiceFile"] as Express.Multer.File[])
        : [];

    const [invoiceFilename] = invoiceFile
      ? await uploadFiles("invoiceFile", invoiceFile)
      : [null];
    console.log("invoiceFilename", invoiceFilename);
    const invoiceFileUrl = invoiceFilename
      ? `${process.env.APP_URL}${invoiceFilename}`
      : null;
    const grDetail = await prisma.gRDetail.create({
      data: {
        uuid,
        sapId: sapId ?? null,
        sapDate: sapDate ? new Date(sapDate) : null,
        invoiceNumber,
        invoiceDate: invoiceDate ? new Date(invoiceDate) : null,
        grId: grId ?? null,
        grDate: grDate ? new Date(grDate) : null,
        vendorId: Number(vendorId),
        invoiceFile: invoiceFileUrl,
        description,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    const warrantyFiles =
      req.files && !Array.isArray(req.files) && "warrantyFiles" in req.files
        ? (req.files["warrantyFiles"] as Express.Multer.File[])
        : [];

    console.log("warrentyFiles", warrantyFiles);

    const invoiceFiles =
      req.files && !Array.isArray(req.files) && "invoiceFiles" in req.files
        ? (req.files["invoiceFiles"] as Express.Multer.File[])
        : [];
    console.log("invoiceFiles", invoiceFiles);

    for (let i = 0; i < products.length; i++) {
      const product = products[i];

      const currentWarrantyFile = warrantyFiles[i];
      const currentInvoiceFile = invoiceFiles[i];

      const [warrantyFilename] = currentWarrantyFile
        ? await uploadFiles("warrantyFiles", currentWarrantyFile)
        : [null];

      const [invoiceFilename] = currentInvoiceFile
        ? await uploadFiles("invoiceFiles", currentInvoiceFile)
        : [null];
      const subcategoryId = product.subcategoryId ? Number(product.subcategoryId) : null;
      let specAbbr = "N/A";
      if (subcategoryId) {
        const subcategory = await prisma.subcategory.findFirst({
          where: { id: subcategoryId },
          select: {
            id: true,
            abbriviatedName: true,
            name: true,
          },
        });
        specAbbr =
          subcategory?.abbriviatedName ??
          subcategory?.name.slice(0, 3).toUpperCase() ??
          "N/A";
      } else {
        const dbProductForCat = await prisma.product.findUnique({
          where: { id: Number(product.productId) },
          select: {
            category: true,
          }
        });
        const category = dbProductForCat?.category;
        specAbbr =
          category?.abbriviatedName ??
          category?.name.slice(0, 3).toUpperCase() ??
          "N/A";
      }

      const grInventoryProduct = await prisma.gRInventoryProduct.create({
        data: {
          grDetailsId: grDetail.id,
          productId: Number(product.productId),
          quantity: product.quantity,
          ratePerPiece: product.ratePerPiece,
          freeQty: product.freeQty || 0,
          description: product.description,
          maintenanceFrequency: product.maintenanceFrequency,
          maintenanceDueDate: product.maintenanceDueDate
            ? new Date(product.maintenanceDueDate)
            : null,
          lifecycleExDate: product.lifecycleExDate
            ? new Date(product.lifecycleExDate)
            : null,
          warrantyTill: product.warrantyTill
            ? new Date(product.warrantyTill)
            : null,
          warrantyFile: warrantyFilename ? `${process.env.APP_URL}${warrantyFilename}` : null,
          totalAmount: product.ratePerPiece * product.quantity,
          importantLink: product.importantLink,
          invoiceFile: invoiceFilename ? `${process.env.APP_URL}${invoiceFilename}` : null,
          createdBy: userId,
          updatedBy: userId,
        },
      });

      const allSerials = [
        ...(product.serials || []),
        ...(product.freeSerials || []).map((s: any) => ({
          ...s,
          isFree: true,
        })),
      ];

      for (const serial of allSerials) {
        const AssetId = await generateNextCode(
          prisma.inventoryProductDetail,
          "uuid",
          `${locationAbbr}-${specAbbr}-`,
          4
        );
        const grDetails = await prisma.inventoryProductDetail.create({
          data: {
            grInventoryProductId: grInventoryProduct.id,
            uuid: AssetId,
            serialNo1: serial.serialNo1,
            maintenanceDueDate: product.maintenanceDueDate
              ? new Date(product.maintenanceDueDate)
              : null,
            lifecycleExDate: product.lifecycleExDate
              ? new Date(product.lifecycleExDate)
              : null,
            serialNo2: serial.serialNo2,
            locationId: locationId ? Number(locationId) : null,
            unitId: Number(unitId),
            isFree: serial.isFree || false,
            assignedStatus: "Untagged",
            createdBy: userId,
            updatedBy: userId,
          },
        });
        await prisma.logReport.create({
          data: {
            transactionDate: grDetail.createdAt,
            productId: grDetails.id,
            transactionType: "GR CREATED",
            transactionlink: `${process.env.FRONTEND_URL}/grentry/listgr/viewgr/${grDetail.uuid}`,
            logReportDetails: `GR Created for Product: ${grDetails.uuid}`,
            createdBy: userId,
            transactionId: grDetail.uuid,
            productStatus: "Product Added to Inventory",
            cost: grInventoryProduct.ratePerPiece,
          },
        });
        for (const spec of product.specs || []) {
          // Skip free-form attributes that have no valid specFieldId
          const sfId = spec.specFieldId ? parseInt(String(spec.specFieldId)) : NaN;
          if (isNaN(sfId)) continue;
          await prisma.gRProductSpecValue.create({
            data: {
              grInventoryProductDetailId: grDetails.id,
              specFieldId: sfId,
              value: spec.value,
              createdBy: userId,
              updatedBy: userId,
            },
          });
        }
        const qrDetails = await prisma.gRDetail.findUnique({
          where: { id: grDetail.id },
          select: {
            uuid: true,
            sapId: true,
            sapDate: true,
            grId: true,
            grDate: true,
            invoiceDate: true,
            inventoryProducts: {
              select: {
                quantity: true,
                ratePerPiece: true,
                freeQty: true,
                totalAmount: true,
                inventoryDetails: {
                  select: {
                    uuid: true,
                    serialNo1: true,
                    location: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
                product: {
                  select: {
                    name: true,
                    
                  },
                },
              },
            },
          },
        });
        if (unit) {
          const qrUrl = await jsongenerateQRCode({
            inventoryProductDetailId: grDetails.uuid,
            grId: grDetail.uuid,
            serialNo1: grDetails.serialNo1 ?? "SN-101",
            qrDetails: qrDetails,
            unitName: unit ? unit.name : "kolkata",
            identificationNumber: unit.identificationNumber ?? "001",
            locationName: qrDetails
              ? qrDetails.inventoryProducts?.[0]?.inventoryDetails?.[0]
                ?.location?.name || ""
              : "",
          });

          await prisma.inventoryProductQr.create({
            data: {
              inventoryProductDetailId: grDetails.id,
              qrCodeUrl: qrUrl,
            },
          });
        }
      }
    }
    const grDetails = await prisma.gRDetail.findUnique({
      where: { id: grDetail.id },
      select: {
        uuid: true,
        sapId: true,
        sapDate: true,
        grId: true,
        grDate: true,
        invoiceDate: true,
        inventoryProducts: {
          select: {
            quantity: true,
            ratePerPiece: true,
            freeQty: true,
            totalAmount: true,
            product: {
              select: {
                name: true,
                
              },
            },
          },
        },
      },
    });
    if (!grDetails) {
      return next(new ErrorHandler("Failed to create Gr", 404));
    }

    const emailList = await foundSuperAdminUnitAdmin(Number(unitId));

    await sendGrEmail(
      emailList,
      grDetails.uuid,
      invoiceNumber,
      grDetails?.invoiceDate ? formatDate(grDetails.invoiceDate) : "",
      grDetails?.grDate ? formatDate(grDetails.grDate) : "",
      grDetails?.grId ?? uuid,
      grDetails?.sapId ?? "SAP-",
      grDetails.inventoryProducts,
      next
    );
    const log = await prisma.log.create({
      data: {
        action: LogAction.GR_CREATE,
        userId: userId,
        relatedModelType: "prisma.gRDetail",
        relatedModelId: grDetail.id,
      },
    });
    await prisma.logReport.updateMany({
      where: {
        transactionId: grDetail.uuid,
        transactionType: "GR CREATED",
      },
      data: {
        logId: log.id,
      },
    });
    return successResponse(res, 201, "GR Created Successfully", grDetail, null);
  } catch (error: unknown) {
    console.error(error);
    return next(new ErrorHandler("Internal Server Error", 500));
  }
};

export const getGr = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const tagged = req.query.tagged === "false" ? false : true;
    const sortBy = (req.query.sortBy as string) || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? "asc" : "desc";
    const vendorId = req.query.vendor ? parseInt(req.query.vendor as string) : undefined;
    const locationId = req.query.location ? parseInt(req.query.location as string) : undefined;
    const brandId = req.query.brand ? parseInt(req.query.brand as string) : undefined;

    const allowedSortFields = ["sapId", "sapDate", "grDate", "createdAt", "updatedAt"];
    const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
    
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

    const isSuperAdmin = user.roles.some((role: any) => role.name === "Super Admin");

    const baseWhere: any = {
      status: true,
      isTagged: tagged,
    };

    if (search) {
      baseWhere.OR = [
        { sapId: { contains: search } },
        { grId: { contains: search } },
        { vendor: { name: { contains: search } } },
      ];
    }

    if (vendorId) {
      baseWhere.vendorId = vendorId;
    }

    const unitFilter = !isSuperAdmin && user.unitId ? Number(user.unitId) : undefined;

    if (locationId || brandId || unitFilter) {
      baseWhere.inventoryProducts = { some: {} };
      
      if (brandId) {
        baseWhere.inventoryProducts.some.product = { brandId: brandId };
      }

      if (locationId || unitFilter) {
        baseWhere.inventoryProducts.some.inventoryDetails = { some: {} };
        if (locationId) {
          baseWhere.inventoryProducts.some.inventoryDetails.some.locationId = locationId;
        }
        if (unitFilter) {
          baseWhere.inventoryProducts.some.inventoryDetails.some.unitId = unitFilter;
        }
      }
    }

    const commonSelect = {
      id: true,
      uuid: true,
      sapId: true,
      sapDate: true,
      grId: true,
      grDate: true,
      invoiceNumber: true,
      invoiceDate: true,
      vendor: true,
      status: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      createdBy: true,
      updatedBy: true,
      createdUser: true,
      updatedUser: true,
      inventoryProducts: {
        select: {
          quantity: true,
          ratePerPiece: true,
          freeQty: true,
          totalAmount: true,
          product: {
            select: { name: true },
          },
        },
      },
    };

    const grdata = await prisma.gRDetail.findMany({
      select: commonSelect,
      orderBy: { [finalSortBy]: sortOrder },
      where: baseWhere,
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalCount = await prisma.gRDetail.count({
      where: baseWhere,
    });

    const result = createPagedResponse(grdata, page, limit, totalCount);
    return successResponse(res, 200, "Successfully fetched gr entries", result, null);
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};

const cleanUrl = (url: string | null) => {
  if (!url) return null;
  return url.replace(/([^:]\/)\/+/g, "$1");
};

export const getGrById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const grId = getSafeStringOrUndefined(req.params.grId);

    const grDetail = await prisma.gRDetail.findUnique({
      where: { uuid: grId },
      select: {
        id: true,
        uuid: true,
        sapId: true,
        grId: true,
        sapDate: true,
        invoiceNumber: true,
        invoiceDate: true,
        grDate: true,
        vendor: true,
        createdUser: true,
        updatedUser: true,
        invoiceFile: true,
        createdAt: true,
        updatedAt: true,
        inventoryProducts: {
          include: {
            product: {
              include: {
                category: true,
                              },
            },

            inventoryDetails: {
              where: {
                status: true,
              },
              include: {
                qrCode: true,
                unit: true,
                location: true,

                specValues: {
                  include: {
                    specField: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!grDetail) {
      return next(new ErrorHandler("GR not found", 404));
    }

    const cleanedGrDetail = {
      ...grDetail,
      invoiceFile: cleanUrl(grDetail.invoiceFile),
      inventoryProducts: grDetail.inventoryProducts.map((ip) => ({
        ...ip,
        invoiceFile: cleanUrl(ip.invoiceFile),
        warrantyFile: cleanUrl(ip.warrantyFile),
        inventoryDetails: ip.inventoryDetails.map((id) => ({
          ...id,
          qrCode: id.qrCode
            ? {
                ...id.qrCode,
                qrCodeUrl: cleanUrl(id.qrCode.qrCodeUrl),
              }
            : null,
        })),
      })),
    };

    return successResponse(
      res,
      200,
      "GR retrieved successfully",
      cleanedGrDetail,
      null
    );
  } catch (error: unknown) {
    console.error(error);
    if (error instanceof ErrorHandler) {
      return next(new ErrorHandler(error.message, 500));
    } else {
      return next(new ErrorHandler("Internal Server Error", 500));
    }
  }
};

export const updateGRStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const grId = parseInt(getSafeString(req.params.grId));

    if (isNaN(grId)) {
      return next(new ErrorHandler("Invalid GR ID", 400));
    }
    const gr = await prisma.gRDetail.findUnique({
      where: { id: grId },
    });
    if (!gr) {
      return next(new ErrorHandler("GR not found", 404));
    }

    const updatedGr = await prisma.gRDetail.update({
      where: { id: grId },
      data: { status: !gr.status },
    });

    return successResponse(
      res,
      200,
      "GR status updated successfully",
      updatedGr,
      null
    );
  } catch (error: unknown) {
    console.error(error);
    if (error instanceof ErrorHandler) {
      return next(new ErrorHandler(error.message, 500));
    } else {
      return next(new ErrorHandler("Internal Server Error", 500));
    }
  }
};

export const updateGr = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      sapId,
      sapDate,
      invoiceNumber,
      invoiceDate,
      grId,
      grDate,
      vendorId,
      description,
    } = req.body;
    const grUuid = String(req.params.grId);
    const userId = parseInt(req.user?.id ?? "0");

    const existingGR = await prisma.gRDetail.findUnique({
      where: { uuid: grUuid },
    });

    if (!existingGR) {
      return next(new ErrorHandler("GR Entry not found", 404));
    }

    const updatedGr = await prisma.gRDetail.update({
      where: { id: existingGR.id },
      data: {
        sapId: sapId !== undefined ? sapId : existingGR.sapId,
        sapDate: sapDate ? new Date(sapDate) : existingGR.sapDate,
        invoiceNumber: invoiceNumber !== undefined ? invoiceNumber : existingGR.invoiceNumber,
        invoiceDate: invoiceDate ? new Date(invoiceDate) : existingGR.invoiceDate,
        grId: grId !== undefined ? grId : existingGR.grId,
        grDate: grDate ? new Date(grDate) : existingGR.grDate,
        vendorId: vendorId ? Number(vendorId) : existingGR.vendorId,
        description: description !== undefined ? description : existingGR.description,
        updatedBy: userId,
      },
    });

    return successResponse(res, 200, "GR updated successfully", updatedGr, null);
  } catch (error: unknown) {
    console.error(error);
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 500));
    } else {
      return next(new ErrorHandler("Internal Server Error", 500));
    }
  }
};

export const deleteGr = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const grId = parseInt(getSafeString(req.params?.grId));
  if (isNaN(grId)) {
    return next(new ErrorHandler("Invalid GR ID", 400));
  }
  try {
    const grDetail = await prisma.gRDetail.findUnique({
      where: { id: grId },
    });

    if (!grDetail) {
      return next(new ErrorHandler("GR not found", 404));
    }

    await prisma.gRDetail.delete({
      where: { id: grId },
    });

    return successResponse(res, 200, "GR deleted successfully", null, null);
  } catch (error: unknown) {
    console.error(error);
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 500));
    } else {
      return next(new ErrorHandler("Internal Server Error", 500));
    }
  }
};

export const addSapCode = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const inventoryProductDetailId = parseInt(getSafeString(
    req.params.inventoryProductDetailId
  ));
  const { sapCode } = req.body;
  const userId = parseInt(req.user?.id ?? "0");

  try {
    const updatedInventoryProductDetail =
      await prisma.inventoryProductDetail.update({
        where: { id: inventoryProductDetailId },
        data: {
          sapCode,
          sapCodeAddedBy: userId,
          sapCodeAddedAt: new Date(),
        },
      });
    const log = await prisma.log.create({
      data: {
        action: LogAction.SAP_CODE_ADDED,
        userId,
        relatedModelId: inventoryProductDetailId,
        relatedModelType: "prisma.inventoryProductDetail",
        details: JSON.stringify({
          sapCode,
          sapCodeAddedBy: userId,
          sapCodeAddedAt: new Date(),
        }),
      },
    });

    await createLogReport(
      updatedInventoryProductDetail.uuid,
      inventoryProductDetailId,
      `SAP Code: ${sapCode}`,
      updatedInventoryProductDetail.createdAt,
      "SAP CODE ADDED",
      userId,
      log.id,
      `${process.env.FRONTEND_URL}/product-details/${updatedInventoryProductDetail.uuid}`,
      "SAP CODE ADDED"
    );

    return successResponse(
      res,
      200,
      "SAP Code added successfully",
      updatedInventoryProductDetail,
      null
    );
  } catch (error: unknown) {
    console.error(error);
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 500));
    } else {
      return next(new ErrorHandler("Internal Server Error", 500));
    }
  }
};

export const tagGr = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const grId = String(req.params.grId);
    const userId = parseInt(req.user?.id ?? "0");

    const existingGR = await prisma.gRDetail.findUnique({
      where: { uuid: grId },
      include: {
        inventoryProducts: {
          include: {
            inventoryDetails: true,
          },
        },
      },
    });

    if (!existingGR) {
      return next(new ErrorHandler("GR Entry not found", 404));
    }

    if (existingGR.isTagged) {
      return next(new ErrorHandler("GR is already tagged", 400));
    }

    await prisma.$transaction(async (tx) => {
      await tx.gRDetail.update({
        where: { id: existingGR.id },
        data: {
          isTagged: true,
          updatedBy: userId,
        },
      });

      const detailIds: number[] = [];
      for (const ip of existingGR.inventoryProducts) {
        for (const det of ip.inventoryDetails) {
          detailIds.push(det.id);
        }
      }

      if (detailIds.length > 0) {
        await tx.inventoryProductDetail.updateMany({
          where: {
            id: { in: detailIds },
            assignedStatus: "Untagged",
          },
          data: {
            assignedStatus: "InStock",
            updatedBy: userId,
          },
        });
      }
    });

    return successResponse(res, 200, "GR Tagged successfully and inventory activated", null, null);
  } catch (error: unknown) {
    console.error(error);
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 500));
    } else {
      return next(new ErrorHandler("Internal Server Error", 500));
    }
  }
};


export const getGrSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const search = req.query.search as string;
    const tagged = req.query.tagged === "false" ? false : true;
    const vendorId = req.query.vendor ? parseInt(req.query.vendor as string) : undefined;
    const locationId = req.query.location ? parseInt(req.query.location as string) : undefined;
    const brandId = req.query.brand ? parseInt(req.query.brand as string) : undefined;

    const userId = parseInt(req.user?.id ?? "0");
    const user = await prisma.user.findUnique({
      where: { id: userId, status: true },
      include: { roles: true },
    });
    if (!user) {
      return next(new ErrorHandler("You have no permission to access this resource", 404));
    }

    const isSuperAdmin = user.roles.some((role: any) => role.name === "Super Admin");
    const unitFilter = !isSuperAdmin && user.unitId ? Number(user.unitId) : undefined;

    const baseWhere: any = {
      status: true,
      isTagged: tagged,
    };

    if (search) {
      baseWhere.OR = [
        { sapId: { contains: search } },
        { grId: { contains: search } },
        { vendor: { name: { contains: search } } },
      ];
    }
    if (vendorId) baseWhere.vendorId = vendorId;

    if (locationId || brandId || unitFilter) {
      baseWhere.inventoryProducts = { some: {} };
      if (brandId) baseWhere.inventoryProducts.some.product = { brandId };
      if (locationId || unitFilter) {
        baseWhere.inventoryProducts.some.inventoryDetails = { some: {} };
        if (locationId) baseWhere.inventoryProducts.some.inventoryDetails.some.locationId = locationId;
        if (unitFilter) baseWhere.inventoryProducts.some.inventoryDetails.some.unitId = unitFilter;
      }
    }

    // Fetch the actual GRs with their products
    const grData = await prisma.gRDetail.findMany({
      where: baseWhere,
      select: {
        inventoryProducts: {
          select: {
            quantity: true,
            product: {
              select: {
                name: true,
                brand: { select: { name: true } }
              }
            }
          }
        }
      }
    });

    const summaryMap = new Map<string, { brand: string; product: string; quantity: number }>();

    for (const gr of grData) {
      for (const invProd of gr.inventoryProducts) {
        const prod = invProd.product;
        if (!prod) continue;
        const brandName = prod.brand?.name ?? "Unknown Brand";
        const productName = prod.name ?? "Unknown Product";
        const key = `${brandName} - ${productName}`;

        const existing = summaryMap.get(key);
        if (existing) {
          existing.quantity += invProd.quantity;
        } else {
          summaryMap.set(key, {
            brand: brandName,
            product: productName,
            quantity: invProd.quantity,
          });
        }
      }
    }

    const summaryList = Array.from(summaryMap.values());
    return successResponse(res, 200, "GR summary retrieved successfully", summaryList, null);

  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};
