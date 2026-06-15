import QRCode from "qrcode";
import path from "path";
import fs from "fs-extra";
import * as dotenv from "dotenv";
dotenv.config();

interface QRData {
  inventoryProductDetailId: string;
  grId: string;
}

export const generateQRCode = async (data: QRData): Promise<string> => {
  try {
    const frontendUrl: string =
      process.env.PRODUCT_DETAIL_FRONTEND_URL ||
      "http://localhost:3000/product-detail";

    const qrDir = path.join(__dirname, "../..", "uploads", "gr-product-qr");
    await fs.ensureDir(qrDir); // create directory if it doesn't exist

    const qrDataUrl = `${frontendUrl}/${data.inventoryProductDetailId}`;
    const safeFilename = `qr-${data.grId}-${Date.now()}.png`;
    const filePath = path.join(qrDir, safeFilename);

    await QRCode.toFile(filePath, qrDataUrl, {
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
      width: 300,
    });

    const publicUrl = `${process.env.APP_URL}/uploads/gr-product-qr/${safeFilename}`;
    return publicUrl;
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw new Error("Failed to generate QR code");
  }
};
