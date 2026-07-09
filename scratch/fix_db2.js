const { PrismaClient } = require('../prisma/generated/prisma');
const prisma = new PrismaClient();

async function main() {
  const grs = await prisma.gRDetail.findMany({
    include: {
      inventoryProducts: {
        include: {
          inventoryDetails: true
        }
      }
    }
  });

  for (const gr of grs) {
    let shouldUpdate = false;
    let dataToUpdate = {};
    
    if (gr.inventoryProducts.some(ip => ip.inventoryDetails.length > 0)) {
      if (!gr.isTagged) {
        dataToUpdate.isTagged = true;
        shouldUpdate = true;
      }
    }
    
    if (!gr.grId) {
      dataToUpdate.grId = gr.uuid;
      shouldUpdate = true;
    }

    if (shouldUpdate) {
      await prisma.gRDetail.update({
        where: { id: gr.id },
        data: dataToUpdate
      });
      console.log(`Updated GR ${gr.id}:`, dataToUpdate);
    }
  }

  // Fix InstallationCompleted status
  const details = await prisma.inventoryProductDetail.findMany({
    where: { assignedStatus: "InstallationCompleted" }
  });

  for (const detail of details) {
    const newStatus = detail.isUsed ? "Assigned" : "InStock";
    await prisma.inventoryProductDetail.update({
      where: { id: detail.id },
      data: { assignedStatus: newStatus }
    });
    console.log(`Fixed status for Asset ${detail.uuid} to ${newStatus}`);
  }

  console.log('Done');
}
main();
