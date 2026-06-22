import { successResponse } from "@utils/successResponse";
import { ErrorHandler } from "@utils/ErrorHandler";
import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "../../../prisma/generated/prisma";
import { uploadFiles } from "@src/helpers/uploadFiles";
import { sendHandoverEmail } from "@utils/mail";
import { MailActions, AssignedStatus } from "@src/enum/enum";
import * as dotenv from "dotenv";
import { formatDate } from "@src/utils/formatDate";
import { AssignmentStatus } from "@src/enum/enum";
import { getSafeStringOrUndefined } from "@utils/paramHelper";
import { createLogReport } from "@src/utils/logReport";
dotenv.config();

const prisma = new PrismaClient();

export const returnHandoverAsset = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { inventoryIds } = req.body;
    const assigmentId = getSafeStringOrUndefined(req.params.id);
    const assignedDetails = await prisma.productAssignment.findFirst({
      where: { assignedId: assigmentId },
    });
    if (!assignedDetails) {
      return next(new ErrorHandler("Assignment not found", 404));
    }
    const issuerId = parseInt(req?.user?.id ?? "0");
    let signatureFileURL = "";
    const signaturedFile = req.file;
    if (signaturedFile) {
      const uploadedFiles = await uploadFiles(
        "return-signatures",
        signaturedFile
      );
      if (uploadedFiles.length > 0) {
        signatureFileURL = `${process.env.APP_URL}${uploadedFiles[0]}`;
      } else {
        return next(new ErrorHandler("Failed to upload signature file", 500));
      }
    }
    const handoverDetails = await prisma.productHandover.create({
      data: {
        issuerId,
        signatureFile: signatureFileURL,
        userId: assignedDetails.issuerId, // Or who is returning it
      },
    });
    const updatedAssignments = await prisma.productAssignment.updateMany({
      where: {
        assignedId: assigmentId,
        inventoryProductDetailId: { in: inventoryIds },
      },
      data: {
        status: AssignmentStatus.Returned,
        productHandoverId: handoverDetails.id,
      },
    });

    const inventoryDetails = await prisma.inventoryProductDetail.findMany({
      where: {
        id: { in: inventoryIds },
      },
      include: {
        grInventoryProduct: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    const itAssetIds = [];
    const otherIds = [];

    for (const detail of inventoryDetails) {
      const categoryName = detail.grInventoryProduct?.product?.category?.name;
      if (categoryName === "IT Assets") {
        itAssetIds.push(detail.id);
      } else {
        otherIds.push(detail.id);
      }
    }

    if (itAssetIds.length > 0) {
      await prisma.inventoryProductDetail.updateMany({
        where: { id: { in: itAssetIds } },
        data: { assignedStatus: AssignedStatus.InstallationCompleted },
      });
    }

    if (otherIds.length > 0) {
      await prisma.inventoryProductDetail.updateMany({
        where: { id: { in: otherIds } },
        data: { assignedStatus: AssignedStatus.InStock },
      });
    }

    // Logging
    for (const inventoryId of inventoryIds) {
      await createLogReport(
        assignedDetails.uuid,
        inventoryId,
        "Asset Return Handover Completed",
        new Date(),
        "unassigned handover complete",
        issuerId,
        null,
        `${process.env.FRONTEND_URL}/assetmanagement/unassign-list`,
        "InStock"
      );
    }

    return successResponse(
      res,
      200,
      "Asset return handover successful",
      {
        handoverDetails,
        updatedAssignments,
        inventoryDetails,
      },
      null
    );
  } catch (error) {
    console.error("Error returning asset:", error);
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 500));
    }
    return next(new ErrorHandler("An unexpected error occurred", 500));
  }
};
