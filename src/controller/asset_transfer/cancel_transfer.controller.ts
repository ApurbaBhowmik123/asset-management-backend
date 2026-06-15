import { successResponse } from "@utils/successResponse";
import { ErrorHandler } from "@utils/ErrorHandler";
import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "../../../prisma/generated/prisma";
import { AssignedStatus, AssetTransfer, LogAction } from "@src/enum/enum";
import { createLogReport } from "@utils/logReport";
import { getSafeString } from "@utils/paramHelper";
import * as dotenv from "dotenv";
dotenv.config();

const prisma = new PrismaClient();

export const cancelTransfer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { transferId: rawTransferId } = req.params;
    const transferId = getSafeString(rawTransferId);
    const userId = parseInt(req?.user?.id ?? "0");

    const transfers = await prisma.productTransfer.findMany({
      where: { transferId: transferId },
    });

    if (transfers.length === 0) {
      return next(new ErrorHandler("Transfer not found", 404));
    }

    for (const transfer of transfers) {
      const inventoryProductDetail =
        await prisma.inventoryProductDetail.findUnique({
          where: { id: transfer.inventoryProductDetailId },
        });
      if (inventoryProductDetail)
        await prisma.inventoryProductDetail.update({
          where: { id: inventoryProductDetail.id },
          data: {
            assignedStatus:
              inventoryProductDetail.previousAssignedStatus ||
              AssignedStatus.InStock,
            previousAssignedStatus: inventoryProductDetail.assignedStatus,
          },
        });

      const log = await prisma.log.create({
        data: {
          action: LogAction.CANCEL_TRANSFER,
          userId: userId,
          relatedModelId: transfer.inventoryProductDetailId,
          relatedModelType: "prisma.inventoryProductDetail",
          details: JSON.stringify({
            transferId: transfer.id,
            status: AssetTransfer.CANCELLED,
          }),
        },
      });
      await createLogReport(
        transfer.transferId,
        transfer.inventoryProductDetailId,
        "Product Transfer Cancelled",
        transfer.createdAt,
        "Cancel Product Transfer",
        userId,
        log.id,
        `${process.env.FRONTEND_URL}/transfer/transfer/${transferId}`,
        "Product Transfer Cancelled"
      );
    }
    const updatedTransfers = await prisma.productTransfer.updateMany({
      where: { transferId: transferId },
      data: {
        status: AssetTransfer.CANCELLED,
      },
    });

    successResponse(
      res,
      200,
      "Transfer cancelled successfully",
      updatedTransfers,
      null
    );
  } catch (error) {
    if (error instanceof ErrorHandler) {
      return next(new ErrorHandler(error.message, 500));
    } else {
      return next(new ErrorHandler("Internal Server Error", 500));
    }
  }
};
