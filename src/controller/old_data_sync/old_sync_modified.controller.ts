import type * as ExcelJSType from "exceljs";
import { successResponse } from "@utils/successResponse";
import { Request, Response, NextFunction } from "express";
import { ErrorHandler } from "../../utils/ErrorHandler";
import prisma from "../../utils/prisma";
import { generateNextCode } from "@src/utils/codeGenerator";
import { generateUniqueId } from "@utils/randomNumberGenerator";
import { AssignedStatus, LogAction } from "@src/enum/enum";
import { jsongenerateQRCode } from "@src/utils/jsonqrcodeGenerator";
import { createLogReport } from "@utils/logReport";

interface AssetData {
  "User Name": string;
  "Asset Type": string;
  "Serial Number": string;
  Description: string;
  "Asset Tag": string;
  "Used By(Email)": string;
  "SAP Code": number;
  "Acquisition Date (PO)": string;
  Department: string;
  Location: string;
  "Assigned On": string;
  Make: string;
  Model: string;
  "Serial Number.1": string;
  OS: string;
  "OS Version": string;
  "OS Service Pack": string;
  Memory: string;
  "Disk Space(GB)": string;
  "CPU Speed(GHz)": string;
  "CPU Core Count": string;
  "MAC Address": string;
  Bitlocker: string;
  Hostname: string;
  "IP Address": string;
  "Asset State": string;
  "PO Value": number;
  "PO Number": string;
  "Warranty/AMC": string;
  "Warranty Expiry Date": string;
  Domain: string;
  "Last Audit Date": string;
  AV: string;
  Proxy: string;
  Unit: string;
}

interface ImportResult {
  success: boolean;
  message: string;
  data?: {
    productId: number;
    grDetailId: number;
    inventoryProductId: number;
    inventoryDetailId: number;
    assignmentId?: number;
  };
  error?: string;
}

const getFirstPresentValue = (
  row: Record<string, unknown>,
  keys: string[]
): unknown => {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }
  return undefined;
};

const setMappedValue = (
  row: Record<string, unknown>,
  targetKey: string,
  sourceKeys: string[],
  fallback?: unknown
) => {
  if (row[targetKey] !== undefined && row[targetKey] !== null && String(row[targetKey]).trim() !== "") {
    return;
  }

  const value = getFirstPresentValue(row, sourceKeys);
  row[targetKey] = value !== undefined ? value : fallback;
};

const normalizeUploadedAssetRow = (asset: Record<string, unknown>) => {
  const row = { ...asset };

  setMappedValue(row, "Model", ["Model Name", "Model Number", "Product"], "Unknown");
  setMappedValue(row, "Make", ["Brand"], "Unknown");
  setMappedValue(row, "Asset Type", ["Category"], "Unknown");
  setMappedValue(row, "Serial Number", ["Serial No 1", "Serial No"], "");
  setMappedValue(row, "Serial Number.1", ["Serial No 2", "Serial Number 2"], "");
  setMappedValue(row, "SAP Code", ["Sap Code", "SAP code"], "");
  setMappedValue(row, "PO Number", ["Invoice Number", "Invoice Nu", "Invoice No", "PO Number"], "INV-DEFAULT");
  setMappedValue(row, "PO Value", ["Rate Per Piece", "Rate Per P", "Rate"], 0);
  setMappedValue(row, "Warranty Expiry Date", ["Warranty Till", "Warranty Till (YYYY-MM-DD)", "Warranty", "Warranty T"], "");
  setMappedValue(row, "Lifecycle Expiry Date", ["Lifecycle Expiry", "Lifecycle Expiry (YYYY-MM-DD)", "Lifecycle", "Lifecycle E"], "");
  setMappedValue(row, "Maintenance Due Date", ["Maintenance Due Date", "Maintenance Due (YYYY-MM-DD)", "Maintenance", "Maintenan"], "");
  setMappedValue(row, "Important Link", ["Important Link", "Important", "Link"], "");
  
  // Set default acquisition date if missing to bypass validation errors for their template
  if (!row["Acquisition Date (PO)"]) {
    row["Acquisition Date (PO)"] = row["Invoice Date"] || new Date().toISOString().split('T')[0];
  }

  return row;
};

export class AssetImportService {
  private readonly specFieldMap: Record<string, number> = {
    "CPU Core Count": 4,
    "CPU Speed(GHz)": 3,
    "Disk Space(GB)": 2,
    // "Graphics Card": 7,
    // Memory: 1,
    // Processor: 5,
    RAM: 5,
    // "SATA SSD": 8,
    "Disk Type": 1,
  };

  //local
  // private readonly specFieldMap: Record<string, number> = {
  //   "CPU Core Count": 28,
  //   "CPU Speed(GHz)": 28,
  //   "Disk Space": 28,
  //   "Graphics Card": 28,
  //   Memory: 28,
  //   Processor: 28,
  //   RAM: 28,
  //   "SATA SSD": 28,
  // };
  private readonly softwareFieldMap: Record<string, number> = {
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

  //local
  // private readonly softwareFieldMap: Record<string, number> = {
  //   AV: 8,
  //   Proxy: 8,
  //   "IP Address": 8,
  //   Domain: 8,
  //   "Host Name": 8,
  //   "Bit Locker": 8,
  //   "MAC Address": 8,
  //   "OS Service Pack": 8,
  //   "OS Version": 8,
  //   OS: 8,
  // };

  private async createOrFindProduct(
    data: AssetData,
    userId: number
  ): Promise<number> {
    const modelName = data.Model?.trim() || '';

    // Check if product exists (case insensitive)
    const existingProduct = await prisma.product.findFirst({
      where: {
        name: {
          equals: modelName,
        },
      },
    });

    if (existingProduct) {
      return existingProduct.id;
    }

    // Create brand if not exists
    const brandId = await this.createOrFindBrand(data.Make, userId);

    // Get IT Assets category
    let itAssetsCategory = await prisma.category.findFirst({
      where: {
        name: {
          equals: "IT Assets",
        },
      },
    });

    if (!itAssetsCategory) {
      const catUuid = await generateNextCode(prisma.category, "uuid", "CAT-");
      itAssetsCategory = await prisma.category.create({
        data: {
          name: "IT Assets",
          uuid: catUuid,
          createdBy: userId,
          updatedBy: userId
        }
      });
    }

    // Create or find subcategory


    // Create new product
    const uuid = await generateNextCode(prisma.product, "uuid", "PROD-");
    const product = await prisma.product.create({
      data: {
        uuid,
        brandId,
        categoryId: itAssetsCategory.id,
        name: modelName,
        description: data.Description,
        serialNo: data["Serial Number"],
        createdBy: userId,
        updatedBy: userId,
      },
    });

    return product.id;
  }

  private async createOrFindBrand(
    brandName: string,
    userId: number
  ): Promise<number> {
    const existing = await prisma.brand.findFirst({
      where: {
        name: {
          equals: brandName.trim(),
        },
      },
    });

    if (existing) return existing.id;
    const uuid = await generateNextCode(prisma.brand, "uuid", "BR-");
    const brand = await prisma.brand.create({
      data: {
        uuid,
        name: brandName.trim(),
        createdBy: userId,
        updatedBy: userId,
      },
    });

    return brand.id;
  }

  private async createOrFindSubcategory(
    subcategoryName: string,
    categoryId: number,
    userId: number
  ): Promise<number> {
    const existing = await prisma.subcategory.findFirst({
      where: {
        name: {
          equals: subcategoryName.trim(),
        },
      },
    });

    if (existing) return existing.id;
    const uuid = await generateNextCode(prisma.subcategory, "uuid", "SUBCAT-");

    const subcategory = await prisma.subcategory.create({
      data: {
        uuid,
        categoryId,
        name: subcategoryName.trim(),
        createdBy: userId,
        updatedBy: userId,
      },
    });

    return subcategory.id;
  }

  // Step 2: Create or find GR Detail
  private async createOrFindGRDetail(
    data: AssetData,
    userId: number
  ): Promise<number> {
    const poValue = data["PO Number"].toString();

    const existing = await prisma.gRDetail.findFirst({
      where: { sapId: poValue },
    });

    if (existing) {
      if (!existing.grId) {
        const fallbackGrId = existing.uuid || `GR-${existing.id}`;
        await prisma.gRDetail.update({
          where: { id: existing.id },
          data: { grId: fallbackGrId },
        });
      }
      return existing.id;
    }
    const location = await this.createOrFindLocation(data, userId);
    const acquisitionDate =
      this.parseDate(data["Acquisition Date (PO)"]) || new Date();
    const generatedUuid = await generateNextCode(prisma.gRDetail, "uuid", "GR-");
    const rawData = data as unknown as Record<string, unknown>;
    const fallbackGrId = String(
      ["GR Number", "GR No", "GR ID", "GR Id"]
        .map((key) => rawData[key])
        .find((value) => value !== undefined && value !== null && String(value).trim()) ||
      generatedUuid
    );
    const invoiceNumber = String(
      ["Invoice Number", "Invoice No"]
        .map((key) => rawData[key])
        .find((value) => value !== undefined && value !== null && String(value).trim()) || ""
    );
    const grDetail = await prisma.gRDetail.create({
      data: {
        uuid: generatedUuid,
        sapId: data["PO Number"],
        sapDate: acquisitionDate,
        grDate: acquisitionDate,
        grId: fallbackGrId,
        invoiceNumber: invoiceNumber || null,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    return grDetail.id;
  }

  // Step 3: Create GR Inventory Product
  private async createGRInventoryProduct(
    grDetailsId: number,
    productId: number,
    data: AssetData,
    userId: number
  ): Promise<number> {
    const rawData = data as unknown as Record<string, unknown>;
    const quantity = Number(rawData.Quantity || rawData.Qty || 1) || 1;
    const ratePerPiece = data["PO Value"] || 0;
    const totalAmount = Number(ratePerPiece) * quantity;
    const warrantyDate = this.parseDate(
      String(
        rawData["Warranty Expiry Date"] ||
        rawData["Warranty Till"] ||
        rawData["Warranty Till (YYYY-MM-DD)"] ||
        rawData["Warranty/AMC"] ||
        rawData["Warranty Date"] ||
        rawData["Warranty Expiry"] ||
        ""
      )
    );
    const uuid = await generateNextCode(
      prisma.gRInventoryProduct,
      "uuid",
      "GRINV-"
    );
    const now = new Date();

    const acquisitionDate = this.parseDate(data["Acquisition Date (PO)"]);
    const maintenanceDueDate =
      this.parseDate(rawData["Maintenance Due Date"]) ||
      this.parseDate(rawData["Maintenance Due (YYYY-MM-DD)"]) ||
      this.addMonths(acquisitionDate || now, 3);
    const lifecycleExDate =
      this.parseDate(rawData["Lifecycle Expiry Date"]) ||
      this.parseDate(rawData["Lifecycle Expiry (YYYY-MM-DD)"]) ||
      this.addMonths(acquisitionDate || now, 48);
    const grInventoryProduct = await prisma.gRInventoryProduct.create({
      data: {
        uuid,
        grDetailsId,
        productId,
        quantity,
        ratePerPiece: Number(ratePerPiece),
        freeQty: 0,
        totalAmount,
        warrantyTill: warrantyDate ? new Date(warrantyDate) : null,
        maintenanceDueDate: new Date(maintenanceDueDate),
        lifecycleExDate: new Date(lifecycleExDate),
        createdBy: userId,
        updatedBy: userId,
      },
    });

    return grInventoryProduct.id;
  }

  // Step 4: Create Inventory Product Detail
  private getDetailValue(
    data: AssetData | Record<string, unknown>,
    detailIndex: number,
    candidateKeys: string[]
  ): string | null {
    const rawData = data as Record<string, unknown>;

    // 1. Check for specific indexed column names based on detailIndex
    // e.g. for candidate "Serial No 1", it becomes "Serial No {detailIndex + 1}"
    const targetSuffix = String(detailIndex + 1);
    
    for (const key of candidateKeys) {
      // For the first item, prioritize the exact candidate key if it's present
      if (detailIndex === 0 && rawData[key] !== undefined && rawData[key] !== null && String(rawData[key]).trim() !== "") {
          return String(rawData[key]).trim();
      }

      // Strip existing trailing numbers to form the base key, then append the target index
      const baseKey = key.replace(/\s*\d+$/, "").trim();
      const possibleIndexedKeys = [
        `${baseKey} ${targetSuffix}`,
        `${baseKey}${targetSuffix}`,
        `${baseKey}_${targetSuffix}`
      ];

      // Also allow the base key itself without a suffix for the first item
      if (detailIndex === 0) {
          possibleIndexedKeys.push(baseKey);
      }

      for (const indexedKey of possibleIndexedKeys) {
        const value = rawData[indexedKey];
        if (value !== undefined && value !== null && String(value).trim() !== "") {
          return String(value).trim();
        }
      }
    }

    // 2. Fallback to extracting from comma/semicolon/pipe separated values
    const parsedValues: string[] = [];

    for (const key of candidateKeys) {
      const value = rawData[key];
      if (typeof value === "string") {
        const parts = value
          .split(/[;,|]/)
          .map((part) => part.trim())
          .filter(Boolean);
        if (parts.length > 0) {
          parsedValues.push(...parts);
          break;
        }
      } else if (typeof value === "number") {
        parsedValues.push(String(value));
        break;
      } else if (value instanceof Date) {
        parsedValues.push(value.toISOString());
        break;
      }
    }

    if (parsedValues.length === 0) return null;
    return parsedValues[Math.min(detailIndex, parsedValues.length - 1)] || null;
  }

  private async createInventoryProductDetail(
    grInventoryProductId: number,
    data: AssetData,
    userId: number,
    grDetailId: number,
    unitId?: number,
    location?: any,
    detailIndex: number = 0
  ): Promise<number> {
    const isUsed =
      data["Asset State"]?.toLowerCase().includes("in use") || false;
    let unit = null;
    if (unitId) {
      unit = await prisma.unit.findUnique({
        where: { id: Number(unitId) },
        select: {
          name: true,
          abbriviatedName: true,
          identificationNumber: true,
        },
      });
    }
    const unitav =
      unit?.abbriviatedName ?? unit?.name.slice(0, 3).toUpperCase() ?? "N/A";
    const locationav =
      location?.abbriviatedName ??
      location?.name.slice(0, 3).toUpperCase() ??
      "N/A";
    const subcategory = await prisma.subcategory.findFirst({
      where: {
        id: Number(),
      },
    });
    const subcategoryav =
      subcategory?.abbriviatedName ??
      subcategory?.name.slice(0, 3).toUpperCase() ??
      "N/A";
    const uuid = await generateNextCode(
      prisma.inventoryProductDetail,
      "uuid",
      `${unitav}-${locationav}-${subcategoryav}-`,
      4
    );
    const rawAssetTag = String(data["Asset Tag"] || "").trim();
    const rawData = data as unknown as Record<string, unknown>;
    const inventoryDetailUuid =
      rawAssetTag && detailIndex === 0
        ? rawAssetTag
        : rawAssetTag
          ? `${rawAssetTag}-${detailIndex + 1}`
          : uuid;
    const now = new Date();

    const acquisitionDate = this.parseDate(data["Acquisition Date (PO)"]);
    const maintenanceDueDate =
      this.parseDate(rawData["Maintenance Due Date"]) ||
      this.parseDate(rawData["Maintenance Due (YYYY-MM-DD)"]) ||
      this.addMonths(acquisitionDate || now, 3);
    const lifecycleExDate =
      this.parseDate(rawData["Lifecycle Expiry Date"]) ||
      this.parseDate(rawData["Lifecycle Expiry (YYYY-MM-DD)"]) ||
      this.addMonths(acquisitionDate || now, 48);
    const inventoryDetail = await prisma.inventoryProductDetail.create({
      data: {
        uuid: inventoryDetailUuid,
        grInventoryProductId,
        serialNo1: this.getDetailValue(data, detailIndex, ["Serial Number", "Serial No 1", "Serial No"]) || null,
        serialNo2: this.getDetailValue(data, detailIndex, ["Secondary Serial Number", "MAC Address", "Alt Serial No"]) || null,
        sapCode: this.getDetailValue(data, detailIndex, ["SAP Code", "SAP Code.1", "SAP Code 2", "Sap Code"]) || null,
        modelName: this.getDetailValue(data, detailIndex, ["Model", "Model Name", "Model Name 1", "Model Number", "Product"]) || null,
        isUsed,
        assignedStatus: "Untagged",
        installationStatus: true,
        createdBy: userId,
        locationId: location ? location.id : null,
        updatedBy: userId,
        maintenanceDueDate: new Date(maintenanceDueDate),
        lifecycleExDate: new Date(lifecycleExDate),
        unitId: unitId || undefined,
      },
    });
    const qrDetails = await prisma.gRDetail.findUnique({
      where: { id: grDetailId },
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

    const inventoryProduct = await prisma.gRInventoryProduct.findUnique({
      where: { id: grInventoryProductId },
    });

    const grDetail = await prisma.gRDetail.findUnique({
      where: { id: grDetailId },
    });
    if (grDetail && inventoryProduct) {
      const qrUrl = await jsongenerateQRCode({
        inventoryProductDetailId: inventoryProduct.uuid,
        grId: grDetail.uuid,
        serialNo1: inventoryDetail?.serialNo1 ?? "SN-101",
        qrDetails: qrDetails,
        unitName: unit ? unit.name : "kolkata",
        identificationNumber: unit ? unit.identificationNumber : "001",
        locationName: location?.name ?? "",
      });
      await prisma.inventoryProductQr.create({
        data: {
          inventoryProductDetailId: inventoryDetail.id,
          qrCodeUrl: qrUrl,
        },
      });
      if (inventoryProduct) {
        await prisma.logReport.create({
          data: {
            transactionDate: grDetail.createdAt,
            productId: inventoryDetail.id,
            transactionType: "GR CREATED",
            transactionlink: `${process.env.FRONTEND_URL}/grentry/listgr/viewgr/${grDetail.uuid}`,
            logReportDetails: `GR Created for Product: ${inventoryDetail.uuid}`,
            createdBy: userId,
            transactionId: grDetail.uuid,
            productStatus: "Product Added to Inventory",
            cost: inventoryProduct.ratePerPiece,
          },
        });
      }
    }

    return inventoryDetail.id;
  }

  // Create Product Spec Values
  private async createProductSpecValues(
    inventoryDetailId: number,
    data: AssetData,
    userId: number
  ): Promise<void> {
    const rawData = data as unknown as Record<string, unknown>;
    const specMappings: Record<string, string | undefined> = {
      "CPU Core Count": data["CPU Core Count"],
      "CPU Speed(GHz)": data["CPU Speed(GHz)"],
      "Disk Space(GB)": data["Disk Space(GB)"],
      Memory: data["Memory"],
      RAM: typeof rawData.RAM === "string" ? rawData.RAM : undefined,
      Processor: typeof rawData.Processor === "string" ? rawData.Processor : undefined,
      SSD: typeof rawData.SSD === "string" ? rawData.SSD : undefined,
      "Graphics Card": typeof rawData["Graphics Card"] === "string" ? String(rawData["Graphics Card"]) : undefined,
    };

    const validEntries = Object.entries(specMappings).filter(
      ([_, value]) => typeof value === "string" && value.trim()
    );
    const specPromises: any[] = [];
    for (const [field, value] of validEntries) {
      let specField = await prisma.specField.findFirst({
        where: { name: { equals: field } },
      });

      if (!specField) {
        const specUuid = await generateNextCode(prisma.specField, "uuid", "SPEC-");
        specField = await prisma.specField.create({
          data: {
            uuid: specUuid,
            name: field,
            fieldType: "TEXT",
            createdBy: userId,
            updatedBy: userId,
          },
        });
      }

      const uuid = generateUniqueId();
      const specvalue = await prisma.gRProductSpecValue.create({
        data: {
          uuid,
          grInventoryProductDetailId: inventoryDetailId,
          specFieldId: specField.id,
          value: value!.trim(),
          createdBy: userId,
          updatedBy: userId,
        },
      });
      specPromises.push(specvalue);
    }

    await Promise.all(specPromises);
  }

  // Install Software
  private async installSoftware(
    inventoryDetailId: number,
    data: AssetData,
    userId: number
  ): Promise<void> {
    const softwareMappings: Record<string, string> = {
      AV: data["AV"],
      Proxy: data["Proxy"],
      "IP Address": data["IP Address"],
      Domain: data["Domain"],
      "Host Name": data["Hostname"],
      "Bit Locker": data["Bitlocker"],
      "MAC Address": data["MAC Address"],
      "OS Service Pack": data["OS Service Pack"],
      "OS Version": data["OS Version"],
      OS: data["OS"],
    };

    const installationId = generateUniqueId();
    const installedRecords = [];

    for (const [software, value] of Object.entries(softwareMappings)) {
      if (!value || !value.trim()) continue;

      const softwareId = this.softwareFieldMap[software];
      if (!softwareId) continue;

      const record = await prisma.productSoftwareInstalls.create({
        data: {
          uuid: generateUniqueId(),
          grInventoryProductDetailId: inventoryDetailId,
          softwareId,
          installationId,
          value: value.trim(),
          installedBy: userId,
          updatedBy: userId,
        },
      });

      installedRecords.push(record);
    }

    // Fetch product to get uuid for logging
    const product = await prisma.inventoryProductDetail.findUnique({
      where: { id: inventoryDetailId },
    });

    // Create log
    const log = await prisma.log.create({
      data: {
        action: LogAction.INSTALLATION,
        userId: userId,
        relatedModelType: "prisma.inventoryProductDetail",
        relatedModelId: inventoryDetailId,
        details: JSON.stringify(installedRecords),
      },
    });

    // Create log report
    await prisma.logReport.create({
      data: {
        logId: log.id,
        transactionId: installationId,
        transactionDate: new Date(),
        productId: inventoryDetailId,
        transactionType: "SOFTWARE INSTALLATION",
        logReportDetails: `Software(s) installed for Product: ${product?.uuid}`,
        createdBy: userId,
        transactionlink: `${process.env.FRONTEND_URL}/installation-details/${installationId}`,
      },
    });
  }

  // Create Product Assignment

  private async createProductAssignment(
    inventoryDetailId: number,
    data: AssetData,
    userId: number
  ): Promise<number | null> {
    const rawEmail = data["Used By(Email)"];

    // If email is embedded in a rich object (e.g., Excel, Notion export), extract the `text`
    const userEmail =
      typeof rawEmail === "object" &&
        rawEmail !== null &&
        "text" in rawEmail &&
        typeof (rawEmail as { text?: unknown }).text === "string"
        ? (rawEmail as { text: string }).text.trim().toLowerCase()
        : String(rawEmail || "")
          .trim()
          .toLowerCase();

    if (!userEmail) return null;

    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: userEmail,
        },
      },
    });

    if (!user) {
      console.warn(`User not found for email: ${userEmail}`);
      return null;
    }

    const startDate = this.parseDate(data["Assigned On"]) || new Date();
    const uuid = await generateNextCode(
      prisma.productAssignment,
      "uuid",
      "ASSIGN-"
    );
    const assignedId = generateUniqueId();
    const assignment = await prisma.productAssignment.create({
      data: {
        uuid,
        inventoryProductDetailId: inventoryDetailId,
        assignedToUserId: user.id,
        issuerId: userId,
        startDate,
        status: "Active",
        assignedId,
      },
    });
    const log = await prisma.log.create({
      data: {
        action: LogAction.ASSIGN,
        userId: userId,
        relatedModelType: "prisma.productAssignment",
        relatedModelId: assignment?.id ?? null,
        details: JSON.stringify({
          assignment,
        }),
      },
    });
    const assignmentCreatedBy = await prisma.user.findUnique({
      where: { id: userId },
    });

    const logDetails = `Assigned Product to ${user?.name || "N/A"} issued By ${assignmentCreatedBy?.name || "N/A"
      }`;
    const updatedInventory = await prisma.inventoryProductDetail.update({
      where: { id: inventoryDetailId },
      data: {
        isUsed: true,
      },
    });
    await createLogReport(
      assignment.uuid,
      inventoryDetailId,
      logDetails,
      assignment.createdAt,
      "Product Assignment",
      userId,
      log.id,
      `${process.env.FRONTEND_URL}/assetmanagement/assigndetails/${assignedId}`,
      "Assigned"
    );
    return assignment.id;
  }
  //Have to create log

  // Utility function to parse dates
  private addMonths(dateValue: Date, months: number): Date {
    const date = new Date(dateValue);
    date.setMonth(date.getMonth() + months);
    return date;
  }

  private parseDate(dateString: unknown): Date | null {
    if (!dateString) return null;
    if (dateString instanceof Date) {
      return isNaN(dateString.getTime()) ? null : dateString;
    }

    const normalizedDate = String(dateString).trim();
    if (!normalizedDate) return null;

    try {
      // Handle DD/MM/YYYY format
      const parts = normalizedDate.split("/");
      if (parts.length === 3) {
        const [day, month, year] = parts;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }

      // Fallback to default Date parsing
      const date = new Date(normalizedDate);
      return isNaN(date.getTime()) ? null : date;
    } catch (error) {
      console.warn(`Invalid date format: ${normalizedDate}`);
      return null;
    }
  }
  private async createOrFindLocation(
    data: AssetData,
    userId: number
  ): Promise<any | null> {
    const locationName = data["Location"];
    if (!locationName || !locationName.trim()) return null;

    // Find location by name
    const location = await prisma.location.findFirst({
      where: {
        name: {
          equals: locationName.trim(),
        },
      },
      select: {
        id: true,
        name: true,
        abbriviatedName: true,
        unitlocation: {
          select: {
            unit: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (location) {
      return location;
    }

    // Create new location if not found
    const newLocation = await prisma.location.create({
      data: {
        name: locationName.trim(),
        createdBy: userId,
        updatedBy: userId,
      },
    });
    return newLocation;
  }

  private async createOrFindUnit(
    data: AssetData,
    userId: number
  ): Promise<any | null> {
    const unitName = data["Unit"];
    if (!unitName || !unitName.trim()) return null;

    // Find unit by name
    const unit = await prisma.unit.findFirst({
      where: {
        name: {
          equals: unitName.trim(),
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (unit) {
      return unit;
    }
    const uuid = await generateNextCode(prisma.unit, "uuid", "UNIT-");
    // Create new unit if not found
    const newUnit = await prisma.unit.create({
      data: {
        name: unitName.trim(),
        uuid,
        createdBy: userId,
        updatedBy: userId,
      },
    });
    return newUnit;
  }

  // Main import function
  async importAsset(data: AssetData, userId: number): Promise<ImportResult> {
    try {
      // Check for duplicate asset tag early
      const assetTag = data["Asset Tag"];
      if (assetTag) {
        const existingAsset = await prisma.inventoryProductDetail.findUnique({
          where: { uuid: assetTag }
        });
        if (existingAsset) {
          return {
            success: false,
            message: `Asset tag ${assetTag} already exists in the system (Duplicate skipped).`,
          };
        }
      }

      // Step 1: Create or find product
      const productId = await this.createOrFindProduct(data, userId);

      // Step 2: Create or find GR Detail
      const grDetailId = await this.createOrFindGRDetail(data, userId);

      // Step 3: Create GR Inventory Product
      const inventoryProductId = await this.createGRInventoryProduct(
        grDetailId,
        productId,
        data,
        userId
      );
      const location = await this.createOrFindLocation(data, userId);
      const unit = await this.createOrFindUnit(data, userId);
      let itAssetsCategory = await prisma.category.findFirst({
        where: {
          name: {
            equals: "IT Assets",
          },
        },
      });

      if (!itAssetsCategory) {
        const catUuid = await generateNextCode(prisma.category, "uuid", "CAT-");
        itAssetsCategory = await prisma.category.create({
          data: {
            name: "IT Assets",
            uuid: catUuid,
            createdBy: userId,
            updatedBy: userId
          }
        });
      }

      // Step 4: Create Inventory Product Detail(s) based on the uploaded quantity
      const inventoryProductRecord = await prisma.gRInventoryProduct.findUnique({
        where: { id: inventoryProductId },
        select: { quantity: true },
      });
      const quantityToCreate = Math.max(1, Number(inventoryProductRecord?.quantity ?? 1));
      const createdInventoryDetailIds: number[] = [];

      for (let detailIndex = 0; detailIndex < quantityToCreate; detailIndex++) {
        const inventoryDetailId = await this.createInventoryProductDetail(
          inventoryProductId,
          data,
          userId,
          grDetailId,
          unit.id,
          location,
          detailIndex
        );
        createdInventoryDetailIds.push(inventoryDetailId);

        await this.createProductSpecValues(inventoryDetailId, data, userId);

        const hasSoftwareDetails = Object.entries({
          AV: data["AV"],
          Proxy: data["Proxy"],
          "IP Address": data["IP Address"],
          Domain: data["Domain"],
          "Host Name": data["Hostname"],
          "Bit Locker": data["Bitlocker"],
          "MAC Address": data["MAC Address"],
          "OS Service Pack": data["OS Service Pack"],
          "OS Version": data["OS Version"],
          OS: data["OS"],
        }).some(([, value]) => typeof value === "string" && value.trim());

        if (hasSoftwareDetails) {
          await this.installSoftware(inventoryDetailId, data, userId);
        }

        await this.createProductAssignment(inventoryDetailId, data, userId);
      }

      return {
        success: true,
        message: `Asset imported successfully for ${data.Model} Asset tag ${data["Asset Tag"]}`,
        data: {
          productId,
          grDetailId,
          inventoryProductId,
          inventoryDetailId: createdInventoryDetailIds[0],
          assignmentId: undefined,
        },
      };
    } catch (error) {
      console.error("Error importing asset:", error);
      return {
        success: false,
        message: `Failed to import asset: ${data.Model} Asset tag ${data["Asset Tag"]}`,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Bulk import function
  async bulkImportAssets(req: Request, res: Response) {
    const results: ImportResult[] = [];
    const { data: assetsData } = req.body;
    const userId = parseInt((req as Request & { user?: { id?: string } })?.user?.id ?? "0");
    for (let asset of assetsData) {
      asset = normalizeUploadedAssetRow(asset);

      try {
        const result = await this.importAsset(asset, userId);
        results.push(result);

        if (result.success) {
          console.log(`Successfully imported: ${asset.Model}`);
        } else {
          console.error(`Failed to import: ${asset.Model} - ${result.error}`);
        }
      } catch (error) {
        console.error(
          `Error processing asset: ${asset.Model} Asset tag ${asset["Asset Tag"]}`,
          error
        );
        results.push({
          success: false,
          message: `Error processing asset: ${asset.Model} Asset tag ${asset["Asset Tag"]}`,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return successResponse(res, 200, "Bulk import", results, null);
  }

  // Clean up and close connections
  async disconnect(): Promise<void> {
    await prisma.$disconnect();
  }
}

export const oldDataSync = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.file || !req.file.buffer) {
      return next(new ErrorHandler("No file uploaded", 400));
    }

    const ExcelJSModule = require("exceljs");
    const workbook = new ExcelJSModule.Workbook();
    // @ts-ignore
    await workbook.xlsx.load(Buffer.from(req.file.buffer as Uint8Array));

    const worksheet = workbook.worksheets[0];
    const rows: any[] = [];

    worksheet.eachRow({ includeEmpty: false }, (row: any) => {
      const values = Array.isArray(row.values) ? row.values.slice(1) : [];
      rows.push(values);
    });

    const [headers, ...dataRows] = rows;
    const formatted = dataRows.map(
      (row: any[], index: number) =>
        normalizeUploadedAssetRow(headers.reduce(
          (obj: any, header: string, headerIndex: number) => {
            const value = row[headerIndex] ?? null;
            // Handle rich text objects (like hyperlinks from Excel)
            if (
              typeof value === "object" &&
              value !== null &&
              "text" in value
            ) {
              obj[header] = (value as { text: string }).text;
            } else {
              obj[header] = value;
            }
            return obj;
          },
          { rowIndex: index + 2 }
        )) // +2 because: +1 for header row, +1 for 1-based indexing
    );

    // Get existing assets from database
    const existingAssets = await prisma.inventoryProductDetail.findMany({
      select: {
        uuid: true,
        serialNo1: true,
      },
    });

    const existingAssetTags = new Set(
      existingAssets
        .map((a) => a.uuid?.toString()?.trim().toLowerCase())
        .filter(Boolean)
    );
    const existingSerialNumbers = new Set(
      existingAssets
        .map((a) => a.serialNo1?.toString()?.trim().toLowerCase())
        .filter(Boolean)
    );

    // Tracking variables
    const duplicateAssetTagData: Array<{
      row: number;
      value: string;
      type: "database" | "file";
    }> = [];
    const duplicateAssetSerialNumberData: Array<{
      row: number;
      value: string;
      type: "database" | "file";
    }> = [];
    const missingAcquisitionDateIndexes: number[] = [];
    const missingAssignedOnIndexes: number[] = [];
    const missingAssignedUserEmailIndexes: number[] = [];
    const missingPONumberIndexes: number[] = [];
    const missingProductNameIndexes: number[] = [];
    const missingSerialNumberIndexes: number[] = [];
    const missingUnitIndexes: number[] = [];
    const missingLocationIndexes: number[] = [];
    const missingBrandIndexes: number[] = [];
    const missingAssetTypeIndexes: number[] = [];

    // Maps to track duplicates within the uploaded file with first occurrence
    const fileAssetTags = new Map<string, number>();
    const fileSerialNumbers = new Map<string, number>();

    for (let i = 0; i < formatted.length; i++) {
      const item = formatted[i];
      const rowIndex = Number(item.rowIndex);

      // Get and normalize values
      const assetTag = item['Asset Tag']?.toString()?.trim();
      const serialNumber = item['Serial Number']?.toString()?.trim();
      const acquisitionDate = item["Acquisition Date (PO)"];
      const assignedOn = item["Assigned On"];
      const poNumber = item["PO Number"];
      const productName = item["Model"];
      const unitName = item["Unit"];
      const location = item["Location"];
      const brand = item["Make"];
      const assetType = item["Asset Type"];

      // Extract email properly
      const rawEmail = item["Used By(Email)"];
      let userEmail = "";

      if (
        typeof rawEmail === "object" &&
        rawEmail !== null &&
        "text" in rawEmail
      ) {
        userEmail =
          (rawEmail as { text: string }).text
            ?.toString()
            .trim()
            .toLowerCase() || "";
      } else if (rawEmail) {
        userEmail = rawEmail.toString().trim().toLowerCase();
      }

      // Skip completely empty rows
      if (!assetTag && !serialNumber && !userEmail && !acquisitionDate) {
        continue;
      }

      // Check for missing PO Number (required for all rows)
      if (!poNumber) {
        missingPONumberIndexes.push(rowIndex);
      }
      if (!serialNumber) {
        missingSerialNumberIndexes.push(rowIndex);
      }
      if (!unitName) {
        missingUnitIndexes.push(rowIndex);
      }
      if (!location) {
        missingLocationIndexes.push(rowIndex);
      }
      if (!brand) {
        missingBrandIndexes.push(rowIndex);
      }
      if (!assetType) {
        missingAssetTypeIndexes.push(rowIndex);
      }

      // Check Asset Tag duplicates
      if (assetTag) {
        const normalizedAssetTag = assetTag.toLowerCase();

        // Check against existing database records
        if (existingAssetTags.has(normalizedAssetTag)) {
          duplicateAssetTagData.push({
            row: rowIndex,
            value: assetTag, // Original case value
            type: "database",
          });
        }
        // Check against other rows in the same file
        else if (fileAssetTags.has(normalizedAssetTag)) {
          // Add current duplicate
          duplicateAssetTagData.push({
            row: rowIndex,
            value: assetTag,
            type: "file",
          });
          // Also add the first occurrence if not already added
          const firstOccurrenceRow = fileAssetTags.get(normalizedAssetTag)!;
          if (
            !duplicateAssetTagData.some(
              (d) => d.row === firstOccurrenceRow && d.type === "file"
            )
          ) {
            duplicateAssetTagData.push({
              row: firstOccurrenceRow,
              value: assetTag, // Use the same value for consistency
              type: "file",
            });
          }
        } else {
          fileAssetTags.set(normalizedAssetTag, rowIndex);
        }
      }

      // Check Serial Number duplicates
      if (serialNumber) {
        const normalizedSerialNumber = serialNumber.toLowerCase();

        // Check against existing database records
        if (existingSerialNumbers.has(normalizedSerialNumber)) {
          duplicateAssetSerialNumberData.push({
            row: rowIndex,
            value: serialNumber, // Original case value
            type: "database",
          });
        }
        // Check against other rows in the same file
        else if (fileSerialNumbers.has(normalizedSerialNumber)) {
          // Add current duplicate
          duplicateAssetSerialNumberData.push({
            row: rowIndex,
            value: serialNumber,
            type: "file",
          });
          // Also add the first occurrence if not already added
          const firstOccurrenceRow = fileSerialNumbers.get(
            normalizedSerialNumber
          )!;
          if (
            !duplicateAssetSerialNumberData.some(
              (d) => d.row === firstOccurrenceRow && d.type === "file"
            )
          ) {
            duplicateAssetSerialNumberData.push({
              row: firstOccurrenceRow,
              value: serialNumber, // Use the same value for consistency
              type: "file",
            });
          }
        } else {
          fileSerialNumbers.set(normalizedSerialNumber, rowIndex);
        }
      }

      // Check for missing acquisition date
      if (!acquisitionDate) {
        missingAcquisitionDateIndexes.push(rowIndex);
      }

      // Check for missing product name
      if (!productName) {
        missingProductNameIndexes.push(rowIndex);
      }

      // Check assigned user and assigned date
      if (
        userEmail &&
        userEmail !== "common printer" &&
        userEmail !== "common user"
      ) {
        // Check if user exists in database
        const user = await prisma.user.findFirst({
          where: {
            email: {
              equals: userEmail,
            },
          },
        });

        if (!user) {
          missingAssignedUserEmailIndexes.push(rowIndex);
        } else if (!assignedOn) {
          // User exists but no assigned date
          missingAssignedOnIndexes.push(rowIndex);
        }
      }
    }

    // Remove rowIndex from formatted data before sending response
    const cleanedFormatted = formatted.map((item) => {
      const { rowIndex, ...cleanItem } = item;
      return cleanItem;
    });

    const validationSummary = {
      duplicateAssetTag: {
        count: duplicateAssetTagData.length,
        data: duplicateAssetTagData,
      },
      duplicateAssetSerialNumber: {
        count: duplicateAssetSerialNumberData.length,
        data: duplicateAssetSerialNumberData,
      },
      missingAcquisitionDate: {
        count: missingAcquisitionDateIndexes.length,
        rows: missingAcquisitionDateIndexes,
      },
      missingAssignedOn: {
        count: missingAssignedOnIndexes.length,
        rows: missingAssignedOnIndexes,
      },
      missingAssignedUserEmail: {
        count: missingAssignedUserEmailIndexes.length,
        rows: missingAssignedUserEmailIndexes,
      },
      missingPONumber: {
        count: missingPONumberIndexes.length,
        rows: missingPONumberIndexes,
      },
      missingProductName: {
        count: missingProductNameIndexes.length,
        rows: missingProductNameIndexes,
      },
      missingSerialNumber: {
        count: missingSerialNumberIndexes.length,
        rows: missingSerialNumberIndexes,
      },
      missingUnit: {
        count: missingUnitIndexes.length,
        rows: missingUnitIndexes,
      },
      missingLocation: {
        count: missingLocationIndexes.length,
        rows: missingLocationIndexes,
      },
      missingBrand: {
        count: missingBrandIndexes.length,
        rows: missingBrandIndexes,
      },
      missingAssetType: {
        count: missingAssetTypeIndexes.length,
        rows: missingAssetTypeIndexes,
      },
    };

    successResponse(
      res,
      200,
      "Data validation completed",
      {
        formatted: cleanedFormatted,
        validation: validationSummary,
        // Legacy format for backward compatibility
        duplicateAssetTag: duplicateAssetTagData.length,
        duplicateAssetSerialNumber: duplicateAssetSerialNumberData.length,
        missingAcquisitionDate: missingAcquisitionDateIndexes.length,
        missingAssignedOn: missingAssignedOnIndexes.length,
        missingAssignedUserEmail: missingAssignedUserEmailIndexes.length,
        missingPONumber: missingPONumberIndexes.length,
        missingProductName: missingProductNameIndexes.length,
        missingSerialNumber: missingSerialNumberIndexes.length,
        missingUnit: missingUnitIndexes.length,
        missingLocation: missingLocationIndexes.length,
        missingBrand: missingBrandIndexes.length,
        missingAssetType: missingAssetTypeIndexes.length,
      },
      null
    );
  } catch (error: unknown) {
    console.error("Error in oldDataSync:", error);
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 500));
    }
    return next(new ErrorHandler("An unexpected error occurred", 500));
  }
};

export const downloadSampleExcel = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const sampleData = [
      {
        "User Name": "John Doe",
        "Asset Type": "Laptop",
        "Serial Number": "SN123456",
        Description: "Dell Latitude 5420",
        "Asset Tag": "TAG001",
        "Used By(Email)": "john.doe@example.com",
        "SAP Code": 123456,
        "Acquisition Date (PO)": "2022-01-01",
        Department: "IT",
        Location: "New York",
        "Assigned On": "2022-02-01",
        Make: "Dell",
        Model: "Latitude 5420",
        "Serial Number.1": "SN123456",
        OS: "Windows",
        "OS Version": "10",
        "OS Service Pack": "SP1",
        Memory: "16GB",
        "Disk Space(GB)": "512",
        "CPU Speed(GHz)": "2.4",
        "CPU Core Count": "4",
        "MAC Address": "00-14-22-01-23-45",
        Bitlocker: "Enabled",
        Hostname: "LAPTOP-1234",
        "IP Address": "192.168.1.100",
        "Asset State": "In Use",
        "PO Value": 1200,
        "PO Number": "PO987654",
        "Warranty/AMC": "Warranty",
        "Warranty Expiry Date": "2025-01-01",
        Domain: "company.local",
        "Last Audit Date": "2023-12-31",
        AV: "Windows Defender",
        Proxy: "proxy.company.com",
        Unit: "Unit A",
      },
    ];

    const ExcelJSModule = require("exceljs");
    const workbook = new ExcelJSModule.Workbook();
    const worksheet = workbook.addWorksheet("Sample Data");
    const columns = Object.keys(sampleData[0]).map((key) => ({
      header: key,
      key: key,
      width: 25,
    }));

    worksheet.columns = columns;
    sampleData.forEach((item) => {
      worksheet.addRow(item);
    });
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: worksheet.columns.length },
    };
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=sample_bulk_upload.xlsx"
    );
    await workbook.xlsx.write(res);
    res.end();
  } catch (error: unknown) {
    console.error("Error in downloadSampleExcel:", error);
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 500));
    }
    return next(new ErrorHandler("An unexpected error occurred", 500));
  }
};
