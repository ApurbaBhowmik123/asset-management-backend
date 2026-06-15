import QRCode from "qrcode";
import path from "path";
import fs from "fs-extra";
import * as dotenv from "dotenv";
import { formatDate } from "./formatDate";
dotenv.config();

interface QRData {
  inventoryProductDetailId: string;
  grId: string;
  serialNo1: string;
  qrDetails: any;
  unitName: string;
  identificationNumber?: string | undefined | null;
  locationName?: string | undefined | null;
}

export const jsongenerateQRCode = async (data: QRData): Promise<string> => {
  try {
    const qrDir = path.resolve("uploads/gr-product-json-qr");
    await fs.ensureDir(qrDir);

    const qrAllDetails = data.qrDetails;
    console.log("qrAllDetails", qrAllDetails);

    // take first product from array
    const firstProduct = qrAllDetails.inventoryProducts?.[0]?.product;

    if (!firstProduct) {
      throw new Error(
        "No product details found in qrAllDetails.inventoryProducts"
      );
    }

    // JSON for QR
    const qrDataJson = {
      CoCd: data.identificationNumber,
      serialNumber: data.serialNo1,
      // GRDate: formatDate(qrAllDetails.grDate),
      assetDescription: firstProduct.subcategory?.name || "",
      ModelName: firstProduct.name || "",
      LocationName: data.locationName || "",
      CompanyName: data.unitName,
      Asset: data.inventoryProductDetailId,
      CapDate: formatDate(qrAllDetails.invoiceDate),
    };

    // save QR code
    const safeFilename = `qr-${data.grId}-${Date.now()}.png`;
    const filePath = path.join(qrDir, safeFilename);

    await QRCode.toFile(filePath, JSON.stringify(qrDataJson), {
      color: { dark: "#000000", light: "#ffffff" },
      width: 300,
    });

    const publicUrl = `${process.env.APP_URL}/uploads/gr-product-json-qr/${safeFilename}`;
    console.log("QR saved at:", filePath);

    return publicUrl;
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw new Error("Failed to generate QR code");
  }
};
