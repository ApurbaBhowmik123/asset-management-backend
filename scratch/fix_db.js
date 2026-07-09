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
    if (gr.inventoryProducts.some(ip => ip.inventoryDetails.length > 0)) {
      await prisma.gRDetail.update({
        where: { id: gr.id },
        data: { isTagged: true }
      });
      console.log(`Tagged GR ${gr.id}`);
    }
  }
  console.log('Done');
}
main();
