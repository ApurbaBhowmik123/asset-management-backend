const fs = require('fs');

const controllerPath = 'F:/asset_management/ams-backend/src/controller/report/report.controller.ts';
let controllerCode = fs.readFileSync(controllerPath, 'utf8');

// We need to replace the getAssetWarrantyList method completely.
const startIndex = controllerCode.indexOf('export const getAssetWarrantyList');
if (startIndex !== -1) {
    const newControllerMethod = `export const getAssetWarrantyList = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const filter = req.query.filter as string; // 'upcoming' or 'expired'
    
    // Base filter: must have a warrantyTill date
    let warrantyFilter: any = {
      not: null,
    };

    const now = new Date();

    if (filter === 'upcoming') {
      const futureDate = new Date();
      futureDate.setDate(now.getDate() + 15);
      warrantyFilter = {
        gte: now,
        lte: futureDate,
      };
    } else if (filter === 'expired') {
      warrantyFilter = {
        lt: now,
      };
    }

    const items = await prisma.inventoryProductDetail.findMany({
      where: {
        grInventoryProduct: {
          warrantyTill: warrantyFilter
        }
      },
      include: {
        grInventoryProduct: {
          include: {
            product: {
              include: {
                category: true,
                brand: true,
              }
            }
          }
        },
        unit: true,
        AssignProductDetails: {
          where: {
            status: "Active" // Only active assignments
          },
          include: {
            assignedToUser: true
          }
        }
      },
      orderBy: {
        grInventoryProduct: {
          warrantyTill: 'asc'
        }
      }
    });

    const formattedData = items.map(item => {
      const grProduct = item.grInventoryProduct;
      const product = grProduct?.product;
      const assignment = item.AssignProductDetails?.[0];

      return {
        id: item.id,
        uuid: item.uuid,
        serialNo1: item.serialNo1,
        serialNo2: item.serialNo2,
        productName: product?.name || 'Unknown',
        category: product?.category?.name || 'N/A',
        brand: product?.brand?.name || 'N/A',
        location: item.unit?.name || 'N/A',
        warrantyTill: grProduct?.warrantyTill,
        warrantyFile: grProduct?.warrantyFile,
        assignedUser: assignment?.assignedToUser?.name || 'Unassigned',
      };
    });

    return successResponse(
      res,
      200,
      "Asset warranty list fetched successfully",
      { data: formattedData },
      null
    );
  } catch (error) {
    console.error("Error in getAssetWarrantyList:", error);
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 500));
    }
    return next(new ErrorHandler("An unexpected error occurred", 500));
  }
};
`;
    controllerCode = controllerCode.substring(0, startIndex) + newControllerMethod;
    fs.writeFileSync(controllerPath, controllerCode);
    console.log("Updated report.controller.ts for expired/upcoming filters");
}
