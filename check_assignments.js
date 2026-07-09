const { PrismaClient } = require('./prisma/generated/prisma');
const prisma = new PrismaClient();
async function main() {
  console.log('Assignments count:', await prisma.productAssignment.count());
}
main().finally(() => prisma.$disconnect());
