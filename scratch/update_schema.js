const fs = require('fs');
const schemaPath = 'F:/asset_management/ams-backend/prisma/schema.prisma';
let schemaCode = fs.readFileSync(schemaPath, 'utf8');

schemaCode = schemaCode.replace(
  `  remarks                  String?
  createdById              Int
  createdAt                DateTime @default(now())`,
  `  remarks                  String?
  condition                String?
  documentUrl              String?
  createdById              Int
  createdAt                DateTime @default(now())`
);

fs.writeFileSync(schemaPath, schemaCode);
console.log("schema.prisma updated.");
