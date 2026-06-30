import { successResponse } from "@utils/successResponse";
import { Request, Response, NextFunction } from "express";
import { ErrorHandler } from "@utils/ErrorHandler";
import { AssignedStatus, AssetTransfer, LogAction } from "@src/enum/enum";
import { createLogReport } from "@src/utils/logReport";
import { jsongenerateQRCode } from "@src/utils/jsonqrcodeGenerator";
import { getSafeString } from "@utils/paramHelper";
import prisma from "../../utils/prisma";


export const acceptTransfer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { transferId: rawTransferId } = req.params;
    const transferId = getSafeString(rawTransferId);
    const { approverId, issuerId, approveDate } = req.body;
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
          select: {
            id: true,
            uuid: true,
            serialNo1: true,
            serialNo2: true,
            locationId: true,
            unitId: true,
            isFree: true,
            createdBy: true,
            updatedBy: true,
            previousAssignedStatus: true,
            assignedStatus: true,
            grInventoryProduct: {
              select: {
                grDetails: {
                  select: {
                    id: true,
                    uuid: true,
                    invoiceDate: true,
                  },
                },
              },
            },
          },
        });
      if (inventoryProductDetail)
        await prisma.inventoryProductDetail.update({
          where: { id: inventoryProductDetail.id },
          data: {
            assignedStatus:
              inventoryProductDetail.previousAssignedStatus ||
              AssignedStatus.InStock,
            unitId: transfer.destinationUnitId,
            locationId: transfer.destinationLocationId,
            previousAssignedStatus: inventoryProductDetail.assignedStatus,
          },
        });
      const qrDetails = await prisma.gRDetail.findUnique({
        where: {
          id: inventoryProductDetail?.grInventoryProduct?.grDetails?.id,
        },
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
      const unit = await prisma.unit.findUnique({
        where: { id: Number(transfer.destinationUnitId) },
        select: {
          id: true,
          name: true,
          identificationNumber: true,
        },
      });
      const location = await prisma.location.findUnique({
        where: { id: Number(transfer.destinationLocationId) },
        select: {
          id: true,
          name: true,
        },
      });
      if (unit && location) {
        const qrUrl = await jsongenerateQRCode({
          inventoryProductDetailId: inventoryProductDetail?.uuid ?? "",
          grId:
            inventoryProductDetail?.grInventoryProduct?.grDetails?.uuid ?? "",
          serialNo1: inventoryProductDetail?.serialNo1 ?? "",
          qrDetails: qrDetails,
          unitName: unit ? unit.name : "",
          identificationNumber: unit.identificationNumber ?? "",
          locationName: location ? location.name : "",
        });

        await prisma.inventoryProductQr.update({
          where: {
            inventoryProductDetailId: inventoryProductDetail?.id,
          },
          data: {
            qrCodeUrl: qrUrl,
          },
        });
      }

      const log = await prisma.log.create({
        data: {
          action: LogAction.ACCEPT_TRANSFER,
          userId: userId,
          relatedModelId: transfer.inventoryProductDetailId,
          relatedModelType: "prisma.inventoryProductDetail",
          details: JSON.stringify({
            transferId: transfer.id,
            status: AssetTransfer.APPROVED,
          }),
        },
      });

      await createLogReport(
        transfer.transferId,
        transfer.inventoryProductDetailId,
        "Product Transfer Accepted",
        transfer.createdAt,
        "Approved Product Transfer",
        userId,
        log.id,
        `${process.env.FRONTEND_URL}/transfer/transfer/${transferId}`,
        "Product Transfer Accepted"
      );
    }
    const acceptTransfer = await prisma.productTranserAccept.create({
      data: {
        approverId: Number(approverId),
        issuerId: Number(issuerId),
        approveDate: new Date(approveDate),
      },
    });

    const updatedTransfers = await prisma.productTransfer.updateMany({
      where: { transferId: transferId },
      data: {
        status: AssetTransfer.APPROVED,
        productTransferAcceptId: acceptTransfer.id,
      },
    });
    return successResponse(
      res,
      200,
      "Transfer accepted successfully",
      { acceptTransfer, updatedTransfers },
      null
    );
  } catch (error) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 500));
    }
    return next(new ErrorHandler("An unexpected error occurred", 500));
  }
};
