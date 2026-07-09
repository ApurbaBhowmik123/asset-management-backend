const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const items = await prisma.inventoryProductDetail.findMany({
    orderBy: { id: 'desc' },
    take: 5,
    select: { id: true, serialNo1: true, installationStatus: true, assignedStatus: true }
  });
  console.log(items);
}
main().finally(() => prisma.$disconnect());
