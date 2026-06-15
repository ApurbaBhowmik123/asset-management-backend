import { successResponse } from "@utils/successResponse";
import { ErrorHandler } from "@utils/ErrorHandler";
import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "../../../prisma/generated/prisma";
import { uploadFiles } from "@src/helpers/uploadFiles";
import { sendHandoverEmail } from "@utils/mail";
import { MailActions } from "@src/enum/enum";
import * as dotenv from "dotenv";
import { formatDate } from "@src/utils/formatDate";
import { AssignmentStatus } from "@src/enum/enum";
import { getSafeStringOrUndefined } from "@utils/paramHelper";
dotenv.config();

const prisma = new PrismaClient();

export const handoverAsset = async (
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
        "handover-signatures",
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
        userId: assignedDetails.issuerId,
      },
    });
    const updatedAssignments = await prisma.productAssignment.updateMany({
      where: {
        assignedId: assigmentId,
        inventoryProductDetailId: { in: inventoryIds },
      },
      data: {
        status: AssignmentStatus.Handovered,
        productHandoverId: handoverDetails.id,
      },
    });
    const inventoryDetails = await prisma.inventoryProductDetail.findMany({
      where: {
        id: { in: inventoryIds },
      },
      select: {
        id: true,
        uuid: true,
        serialNo1: true,
        grInventoryProduct: {
          select: {
            product: {
              select: {
                id: true,
                uuid: true,
                name: true,
                
                brand: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    const productAssignmentDetails = await prisma.productAssignment.findMany({
      where: {
        assignedId: assigmentId,
        inventoryProductDetailId: { in: inventoryIds },
      },
      select: {
        id: true,
        startDate: true,
        assignedToUser: {
          select: {
            name: true,
            username: true,
            designation: true,
            mobile: true,
            email: true,
            location: {
              select: {
                name: true,
              },
            },
            unit: {
              select: {
                id: true,
                name: true,
              },
            },
            department: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    }) as any;
    if (!productAssignmentDetails || productAssignmentDetails.length === 0) {
      return next(new ErrorHandler("No product assignment details found", 404));
    }
    let emailList: string[] = [];
    if (productAssignmentDetails[0]?.assignedToUser?.unit?.id) {
      const mailConfig = await prisma.mailConfig.findFirst({
        where: {
          unitId: productAssignmentDetails[0]?.assignedToUser?.unit?.id,
          action: MailActions.ASSIGNMENT_HANDOVERED
        },
        select: {
          unitAdmin: {
            select: {
              email: true
            }
          },
          superAdmin: {
            select: {
              email: true
            }
          }
        }
      });
      if (mailConfig?.unitAdmin?.email) {
        emailList.push(mailConfig?.unitAdmin?.email);
      }
      if (mailConfig?.superAdmin?.email) {
        emailList.push(mailConfig?.superAdmin?.email);
      }
    }

    sendHandoverEmail(
      emailList,
      productAssignmentDetails[0]?.assignedToUser?.name ?? "",
      productAssignmentDetails[0]?.assignedToUser?.username ?? "",
      productAssignmentDetails[0]?.assignedToUser?.designation ?? "",
      productAssignmentDetails[0]?.assignedToUser?.mobile ?? "",
      productAssignmentDetails[0]?.assignedToUser?.location?.name ?? "",
      productAssignmentDetails[0]?.assignedToUser?.email ?? "",
      productAssignmentDetails[0]?.assignedToUser?.unit?.name ?? "",
      productAssignmentDetails[0]?.assignedToUser?.department?.name ?? "",
      productAssignmentDetails[0]?.startDate
        ? formatDate(productAssignmentDetails[0]?.startDate)
        : "",
      "Holding",
      "https://example.com/signature.png",
      inventoryDetails,
      next
    );
    return successResponse(
      res,
      200,
      "Asset handover successful",
      {
        handoverDetails,
        updatedAssignments,
        inventoryDetails,
      },
      null
    );
  } catch (error) {
    console.error("Error assigning asset:", error);
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 500));
    }
    return next(new ErrorHandler("An unexpected error occurred", 500));
  }
};
