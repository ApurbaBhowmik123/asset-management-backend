const fs = require('fs');
const filePath = 'F:/asset_management/ams-backend/src/controller/asset_management/unassign.controller.ts';
let code = fs.readFileSync(filePath, 'utf8');

const replacement = `export const unassignAsset = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      inventoryProductIds,
      assignmentIds,
      approvedBy,
      approvedDate,
      remarks,
      conditions,
    } = req.body;
    const userId = parseInt(req?.user?.id ?? "0");
    if (
      !Array.isArray(inventoryProductIds) ||
      inventoryProductIds.length === 0
    ) {
      return next(
        new ErrorHandler("Invalid or empty inventory product IDs", 400)
      );
    }
    
    let documentUrl = "";
    if (req.file) {
      const { uploadFiles } = require("@src/helpers/uploadFiles");
      const uploadedFiles = await uploadFiles("unassign-docs", req.file);
      if (uploadedFiles.length > 0) {
        documentUrl = process.env.APP_URL ? \`\${process.env.APP_URL}\${uploadedFiles[0]}\` : uploadedFiles[0];
      }
    }

    await prisma.productAssignment.updateMany({
      where: {
        inventoryProductDetailId: { in: inventoryProductIds },
        assignedId: { in: assignmentIds },
      },
      data: {
        status: AssignmentStatus.PendingReturn,
      },
    });
    await prisma.inventoryProductDetail.updateMany({
      where: { id: { in: inventoryProductIds } },
      data: { assignedStatus: AssignedStatus.PENDING_RETURN },
    });
    const updatedAssignments = await prisma.productAssignment.findMany({
      where: {
        inventoryProductDetailId: { in: inventoryProductIds },
        assignedId: { in: assignmentIds },
      },
    });
    const updatedInventoryDetails =
      await prisma.inventoryProductDetail.findMany({
        where: {
          id: { in: inventoryProductIds },
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
      
    for (let i = 0; i < inventoryProductIds.length; i++) {
      const inventoryProductId = inventoryProductIds[i];
      const condition = Array.isArray(conditions) ? conditions[i] : null;

      const productUnassignment = await prisma.productUnAssignment.create({
        data: {
          uuid: await generateNextCode(
            prisma.productUnAssignment,
            "uuid",
            "mg-assn-"
          ),
          inventoryProductDetailId: inventoryProductId,
          approvedById: Number(approvedBy),
          unassignmentDate: new Date(approvedDate),
          remarks: remarks,
          condition: condition,
          documentUrl: documentUrl || null,
          createdById: userId,
        },
      });
      const inventoryProduct = await prisma.inventoryProductDetail.findUnique({
        where: { id: inventoryProductId },
      });
      if (inventoryProduct) {
        const log = await prisma.log.create({
          data: {
            action: "Unassigned Asset",
            userId: userId,
            details: JSON.stringify({
              productUnassignmentId: productUnassignment.id,
              condition: condition
            }),
          },
        });
        let logDetails = "Product Unassignment";
        const approver = await prisma.user.findUnique({
          where: { id: Number(approvedBy) },
          select: { id: true, name: true },
        });
        if (updatedAssignments[0]?.assignedToLocationId) {
          const location = await prisma.location.findUnique({
            where: { id: updatedAssignments[0].assignedToLocationId },
            select: { id: true, name: true },
          });
          logDetails = \`\${inventoryProduct.uuid} Unassigned from location: \${location?.name} Approved By \${approver?.name} Remarks:- \${remarks}\`;
        } else {
          if (updatedAssignments[0]?.assignedToUserId) {
            const user = await prisma.user.findUnique({
              where: { id: updatedAssignments[0].assignedToUserId },
              select: { id: true, name: true },
            });
            logDetails = \`\${inventoryProduct.uuid} Unassigned from user: \${user?.name} Approved By \${approver?.name} Remarks:- \${remarks}\`;
          }
        }
        createLogReport(
          inventoryProduct.uuid,
          inventoryProductId,
          logDetails,
          productUnassignment.createdAt,
          "unassigned",
          userId,
          log.id,
          null,
          "Unassigning Asset"
        );
      }
    }

    return successResponse(
      res,
      200,
      "Asset unassigned successfully",
      { updatedAssignments, updatedInventoryDetails },
      null
    );
  } catch (error) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 500));
    }
    return next(new ErrorHandler("Internal Server Error", 500));
  }
};`;

const startIndex = code.indexOf('export const unassignAsset = async (');
if (startIndex !== -1) {
  code = code.substring(0, startIndex) + replacement;
  fs.writeFileSync(filePath, code);
  console.log("unassign.controller.ts updated successfully");
} else {
  console.log("Could not find unassignAsset function");
}
