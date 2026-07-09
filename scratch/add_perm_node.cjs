const { PrismaClient } = require('./dist/utils/prisma.js');
const prisma = new PrismaClient();

async function main() {
  let perm = await prisma.permission.findFirst({ where: { slug: 'update-asset' } });
  if (!perm) {
    perm = await prisma.permission.create({
      data: { name: 'Update Asset', slug: 'update-asset', module: 'Asset' }
    });
  }

  const role = await prisma.role.findFirst({ where: { name: 'Super Admin' } });
  if (role) {
    await prisma.role.update({
      where: { id: role.id },
      data: {
        permissions: {
          connect: { id: perm.id }
        }
      }
    });
    console.log("Added update-asset to Super Admin");
  } else {
    console.log("Super Admin not found");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
