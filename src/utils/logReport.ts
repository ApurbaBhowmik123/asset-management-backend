import prisma from "../utils/prisma";

export const createLogReport = async (
  transactionId: string,
  productId: number,
  logIdDetails: string,
  transactionDate: Date,
  transactionType: string,
  userID: number,
  logId: number | null = null,
  transactionlink: string | null = null,
  product_status: string | null = null,
  cost: number | undefined = 0
) => {
  try {
    await prisma.logReport.create({
      data: {
        transactionDate: transactionDate,
        productId: productId,
        transactionType: transactionType,
        transactionlink: transactionlink,
        logReportDetails: logIdDetails,
        createdBy: userID,
        transactionId: transactionId,
        logId: logId,
        productStatus: product_status,
        cost: cost,
      },
    });
    return true;
  } catch (error) {
    console.error("Error creating log report:", error);
    return false;
  }
};
