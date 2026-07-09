const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const asset = await prisma.inventoryProductDetail.findFirst({
    where: { grInventoryProduct: { categoryId: { not: null } } },
    include: {
      grInventoryProduct: {
        include: { category: true, product: { include: { category: true } } }
      }
    }
  });
  console.log("Found by grInventoryProduct.categoryId:", JSON.stringify(asset, null, 2));

  const asset2 = await prisma.inventoryProductDetail.findFirst({
    where: { grInventoryProduct: { product: { categoryId: { not: null } } } },
    include: {
      grInventoryProduct: {
        include: { category: true, product: { include: { category: true } } }
      }
    }
  });
  console.log("Found by grInventoryProduct.product.categoryId:", JSON.stringify(asset2, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
