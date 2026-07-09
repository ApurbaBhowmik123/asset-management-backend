const fs = require('fs');

// 1. Update report.controller.ts
const controllerPath = 'F:/asset_management/ams-backend/src/controller/report/report.controller.ts';
let controllerCode = fs.readFileSync(controllerPath, 'utf8');

const newControllerMethod = `
export const getAssetWarrantyList = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const upcomingDays = parseInt(req.query.upcomingDays as string) || 0;
    
    // Base filter: must have a warrantyTill date
    let warrantyFilter: any = {
      not: null,
    };

    if (upcomingDays > 0) {
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(now.getDate() + upcomingDays);
      warrantyFilter = {
        gte: now,
        lte: futureDate,
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
                subcategory: true,
                brand: true,
              }
            }
          }
        },
        unit: true,
        department: true,
        productAssignments: {
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
      const assignment = item.productAssignments?.[0];

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

if (!controllerCode.includes('export const getAssetWarrantyList')) {
    controllerCode += newControllerMethod;
    fs.writeFileSync(controllerPath, controllerCode);
    console.log("Updated report.controller.ts");
}

// 2. Update report.route.ts
const routePath = 'F:/asset_management/ams-backend/src/routes/report/report.route.ts';
let routeCode = fs.readFileSync(routePath, 'utf8');

if (!routeCode.includes('getAssetWarrantyList')) {
    routeCode = routeCode.replace(
        `import { Reportgetall, reportGet } from "../../controller/report/report.controller";`,
        `import { Reportgetall, reportGet, getAssetWarrantyList } from "../../controller/report/report.controller";`
    );

    routeCode = routeCode.replace(
        `export default reportrouter;`,
        `reportrouter.get("/asset-warranty", getAssetWarrantyList);\n\nexport default reportrouter;`
    );
    
    fs.writeFileSync(routePath, routeCode);
    console.log("Updated report.route.ts");
}
