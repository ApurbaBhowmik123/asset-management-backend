const fs = require('fs');
const path = 'F:/asset_management/ams-backend/src/controller/old_data_sync/old_sync_modified.controller.ts';

let content = fs.readFileSync(path, 'utf8');

// The pattern repeats twice, we can just replace both.
const findPattern = `      const itAssetsCategory = await prisma.category.findFirst({
        where: {
          name: {
            equals: "IT Assets",
          },
        },
      });
  
      if (!itAssetsCategory) {
        throw new Error("IT Assets category not found");
      }`;

const replacePattern = `      let itAssetsCategory = await prisma.category.findFirst({
        where: {
          name: {
            equals: "IT Assets",
          },
        },
      });
  
      if (!itAssetsCategory) {
        const catUuid = await generateNextCode(prisma.category, "uuid", "CAT-");
        itAssetsCategory = await prisma.category.create({
          data: {
            name: "IT Assets",
            uuid: catUuid,
            createdBy: userId,
            updatedBy: userId
          }
        });
      }`;

// We might need to handle slight variations in indentation
// Let's use a regex instead for safety.
content = content.replace(/const itAssetsCategory = await prisma\.category\.findFirst\([\s\S]*?throw new Error\("IT Assets category not found"\);\n\s*\}/g, replacePattern);

fs.writeFileSync(path, content, 'utf8');
console.log("Fixed IT Assets category");
