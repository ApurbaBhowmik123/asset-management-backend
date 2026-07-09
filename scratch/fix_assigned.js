const { PrismaClient } = require('../prisma/generated/prisma');
const prisma = new PrismaClient();

async function main() {
  // Find assets created today that are ASSIGNED and belong to the GRs we bulk imported
  const details = await prisma.inventoryProductDetail.findMany({
    where: {
      assignedStatus: "Assigned",
      grInventoryProduct: {
        grDetails: {
          sapId: "INV-3" // Just in case, though might be other SAP IDs
        }
      }
    }
  });

  for (const detail of details) {
    await prisma.inventoryProductDetail.update({
      where: { id: detail.id },
      data: { assignedStatus: "Untagged" }
    });
    console.log(`Set Asset ${detail.uuid} back to Untagged`);
  }

  console.log('Done');
}
main();
