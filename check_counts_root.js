const { PrismaClient } = require('./prisma/generated/prisma');
const prisma = new PrismaClient();
async function main() {
  const all = await prisma.inventoryProductDetail.count({ where: { status: true } });
  
  const byAssignedStatus = await prisma.inventoryProductDetail.groupBy({
    by: ['assignedStatus'],
    _count: true,
    where: { status: true }
  });

  const byAssignedStatusNotEwaste = await prisma.inventoryProductDetail.count({
    where: { 
      status: true,
      assignedStatus: {
        notIn: ["E-WASTE", "WRITE-OFF", "SCRAP"]
      }
    }
  });

  console.log('Total status=true:', all);
  console.log('Counts by status:', byAssignedStatus);
  console.log('Valid (not e-waste/scrap):', byAssignedStatusNotEwaste);
}
main().finally(() => prisma.$disconnect());
