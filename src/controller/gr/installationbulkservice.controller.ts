import { ErrorHandler } from "@utils/ErrorHandler";
import { Request, Response, NextFunction } from "express";
import ExcelJS from "exceljs";
import { successResponse } from "@src/utils/successResponse";
import { PrismaClient } from "../../../prisma/generated/prisma";
const prisma = new PrismaClient();
import { generateUniqueId } from "@utils/randomNumberGenerator";
import { formatDate } from "@utils/formatDate";
import { sendInstallationEmail } from "@utils/mail";
import { LogAction } from "@src/enum/enum";
import { MailActions } from "@src/enum/enum";

const softwareFieldMap: { [key: string]: number } = {
  AV: 1,
  Proxy: 2,
  "IP Address": 3,
  Domain: 4,
  "Host Name": 5,
  "Bit Locker": 6,
  "MAC Address": 7,
  "OS Service Pack": 8,
  "OS Version": 9,
  OS: 10,
};

// only for local testing
// const softwareFieldMap: { [key: string]: number } = {
//   AV: 1,
//   Proxy: 7,
//   "IP Address": 7,
//   Domain: 7,
//   "Host Name": 7,
//   "Bit Locker": 7,
//   "MAC Address": 7,
//   "OS Service Pack": 8,
//   "OS Version": 7,
//   OS: 8,
// };
export const downloadSampleInstallationXL = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sample Data");

    // Define headers
    worksheet.columns = [
      { header: "ASSET ID", key: "ASSET ID", width: 20 },
      { header: "AV", key: "AV", width: 30 },
      { header: "Proxy", key: "Proxy", width: 30 },
      { header: "IP Address", key: "IP Address", width: 30 },
      { header: "Domain", key: "Domain", width: 30 },
      { header: "Host Name", key: "Host Name", width: 30 },
      { header: "Bit Locker", key: "Bit Locker", width: 30 },
      { header: "MAC Address", key: "MAC Address", width: 30 },
      { header: "OS Service Pack", key: "OS Service Pack", width: 30 },
      { header: "OS Version", key: "OS Version", width: 30 },
      { header: "OS", key: "OS", width: 30 },
    ];

    const whereClause: any = {
      status: true,
      assignedStatus: "InStock",
      grInventoryProduct: {
        product: {
          category: { name: "IT Assets" },
        },
      },
    };
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

    // Apply unit restriction if not superadmin
    if (!userRoles.includes("Super Admin") && userUnitId) {
      whereClause.unitId = userUnitId;
    }

    // Fetch paginated data
    const installations = await prisma.inventoryProductDetail.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },

      include: {
        createdUser: true,
        updatedUser: true,
        location: { select: { id: true, name: true } },
        unit: { select: { id: true, name: true } },
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
    const data = installations.map((item) => ({
      "ASSET ID": item.uuid,
      AV: "",
      Proxy: "",
      "IP Address": "",
      Domain: "",
      "Host Name": "",
      "Bit Locker": "",
      "MAC Address": "",
      "OS Service Pack": "",
      "OS Version": "",
      OS: "",
    }));

    // Add rows
    data.forEach((row) => {
      worksheet.addRow(row);
    });

    // Set headers for download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=sample_installation.xlsx"
    );

    // Write to response stream
    await workbook.xlsx.write(res);
    res.end();
  } catch (error: unknown) {
    return next(
      new ErrorHandler(
        error instanceof Error ? error.message : "An unknown error occurred",
        500
      )
    );
  }
};

export const readXlsx = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.file || !req.file.buffer) {
      return next(new ErrorHandler("No file uploaded", 400));
    }

    const workbook = new ExcelJS.Workbook();
    // @ts-ignore
    await workbook.xlsx.load(Buffer.from(req.file.buffer as Uint8Array));

    const worksheet = workbook.worksheets[0];
    const rows: any[] = [];

    worksheet.eachRow({ includeEmpty: false }, (row) => {
      const values = Array.isArray(row.values) ? row.values.slice(1) : [];
      rows.push(values);
    });

    const [headers, ...dataRows] = rows;
    const formatted = dataRows.map((row: any[]) =>
      headers.reduce((obj: any, header: string, index: number) => {
        obj[header] = row[index] ?? null;
        return obj;
      }, {})
    );

    successResponse(res, 200, "Received Data", formatted, null);
  } catch (error: any) {
    next(new ErrorHandler(error.message || "Failed to parse Excel", 500));
  }
};

export const installSoftWareToProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { data } = req.body;
    const userId = parseInt(req.user?.id ?? "0");

    const now = new Date();
    for (const item of data) {
      const inventoryProduct = await prisma.inventoryProductDetail.findUnique({
        where: {
          uuid: item["ASSET ID"],
        },
      });
      if (inventoryProduct) {
        await prisma.productSoftwareInstalls.updateMany({
          where: {
            grInventoryProductDetailId: Number(inventoryProduct.id),
          },
          data: {
            status: false,
          },
        });
        const installationId = generateUniqueId();

        const softwareInstallData = [];

        for (const [fieldName, softwareId] of Object.entries(
          softwareFieldMap
        )) {
          const value = item[fieldName];
          if (
            value !== null &&
            value !== undefined &&
            String(value).trim() !== ""
          ) {
            softwareInstallData.push({
              grInventoryProductDetailId: inventoryProduct.id,
              softwareId,
              value: String(value),
              installationId,
              installedAt: now,
              installedBy: userId,
              updatedBy: userId,
            });
          }
        }

        if (softwareInstallData.length > 0) {
          await prisma.productSoftwareInstalls.createMany({
            data: softwareInstallData,
          });
        }

        await prisma.inventoryProductDetail.update({
          where: { id: Number(inventoryProduct.id) },
          data: {
            assignedStatus: "InstallationCompleted",
            installationStatus: true,
            updatedBy: userId,
            updatedAt: now,
          },
        });
        const productwithInstalllDetails =
          await prisma.inventoryProductDetail.findUnique({
            where: { id: Number(inventoryProduct.id) },
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
                productwithInstalllDetails?.grInventoryProduct?.grDetails
                  ?.grDate
              )
            : "",
          productwithInstalllDetails?.softwareInstalls[0]?.product?.serialNo1 ||
            "",
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
            relatedModelId: Number(inventoryProduct.id),
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
            productId: Number(inventoryProduct.id),
            transactionType: "SOFTWARE INSTALLATION",
            logReportDetails: `Software(s) installed for Product: ${productwithInstalllDetails?.uuid}`,
            createdBy: userId,
            transactionlink: `${process.env.FRONTEND_URL}/installation-details/${installationId}`,
          },
        });
      }
    }
    return successResponse(
      res,
      200,
      "Software installation completed successfully",
      null,
      null
    );
  } catch (error: unknown) {
    return next(
      new ErrorHandler(
        error instanceof Error ? error.message : "An unknown error occurred",
        500
      )
    );
  }
};
