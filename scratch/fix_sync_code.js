const fs = require('fs');
const path = 'F:/asset_management/ams-backend/src/controller/old_data_sync/old_sync_modified.controller.ts';

let content = fs.readFileSync(path, 'utf8');

// 1. Fix createOrFindGRDetail
const target1 = `      const grDetail = await prisma.gRDetail.create({
        data: {
          uuid,
          sapId: data["PO Number"],
          sapDate: acquisitionDate,
          grDate: acquisitionDate,
          createdBy: userId,
          updatedBy: userId,
        },
      });`;

const replace1 = `      const grDetail = await prisma.gRDetail.create({
        data: {
          uuid,
          sapId: data["PO Number"],
          sapDate: acquisitionDate,
          grId: uuid,
          grDate: acquisitionDate,
          createdBy: userId,
          updatedBy: userId,
          isTagged: true,
        },
      });`;

content = content.replace(target1, replace1);

// 2. Fix installSoftware
const target2 = `      // Update product status
      const product = await prisma.inventoryProductDetail.update({
        where: { id: inventoryDetailId },
        data: {
          assignedStatus: AssignedStatus.InstallationCompleted,
        },
      });`;

const replace2 = `      // Update product status
      // We skip setting InstallationCompleted for bulk uploads to preserve historical Assigned/InStock states.
      /*
      const product = await prisma.inventoryProductDetail.update({
        where: { id: inventoryDetailId },
        data: {
          assignedStatus: AssignedStatus.InstallationCompleted,
        },
      });
      */`;

content = content.replace(target2, replace2);

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed old_sync_modified.controller.ts');
