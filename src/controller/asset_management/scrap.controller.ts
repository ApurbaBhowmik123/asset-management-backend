import { Request, Response, NextFunction } from "express";
import { AssignedStatus } from "@src/enum/enum";
import { getSafeString } from "@utils/paramHelper";
import { createLogReport } from "@utils/logReport";
import { ErrorHandler } from "@utils/ErrorHandler";
import prisma from "../../utils/prisma";


export const scrapAsset = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(getSafeString(req.params.id));
    const { userId, remarks } = req.body;

    if (!id || isNaN(id)) {
      return next(new ErrorHandler("Invalid inventory product detail ID", 400));
    }

    const inventoryProduct = await prisma.inventoryProductDetail.findUnique({
      where: { id },
      include: {
        unit: true,
      },
    });

    if (!inventoryProduct) {
      return next(new ErrorHandler("Asset not found", 404));
    }

    if (inventoryProduct.assignedStatus !== AssignedStatus.InStock) {
      return next(
        new ErrorHandler(
          "Asset is not in stock. Only unused assets can be scrapped.",
          400
        )
      );
    }

    // Update status to SCRAP
    const updatedAsset = await prisma.inventoryProductDetail.update({
      where: { id },
      data: {
        assignedStatus: AssignedStatus.SCRAP,
      },
    });

    // Create log report
    await createLogReport(
      updatedAsset.uuid,
      updatedAsset.id,
      "Asset Scrapped",
      new Date(),
      "Product Scrapped",
      Number(userId) || 1,
      null,
      null,
      remarks || "Scrapped"
    );

    return res.status(200).json({
      status: true,
      message: "Asset scrapped successfully",
      data: updatedAsset,
    });
  } catch (error) {
    console.error("Error in scrapAsset:", error);
    return next(
      error instanceof Error
        ? new ErrorHandler(error.message, 500)
        : new ErrorHandler("An unexpected error occurred", 500)
    );
  }
};
