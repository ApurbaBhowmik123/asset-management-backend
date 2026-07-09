const { PrismaClient } = require('../prisma/generated/prisma');
const prisma = new PrismaClient();

async function main() {
  const details = await prisma.inventoryProductDetail.findMany({
    where: { 
      grInventoryProduct: {
        grDetails: {
          sapId: "INV-3"
        }
      }
    }
  });

  for (const detail of details) {
    await prisma.inventoryProductDetail.update({
      where: { id: detail.id },
      data: { assignedStatus: "Untagged" }
    });
    console.log(`Set Asset ${detail.uuid} to Untagged`);
  }

  console.log('Done');
}
main();
