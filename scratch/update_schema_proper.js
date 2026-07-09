const fs = require('fs');
const schemaPath = 'F:/asset_management/ams-backend/prisma/schema.prisma';
let schemaCode = fs.readFileSync(schemaPath, 'utf8');

const regex = /(model ProductUnAssignment \{[\s\S]*?remarks\s+String\?)/;
if (regex.test(schemaCode) && !schemaCode.includes('documentUrl')) {
  schemaCode = schemaCode.replace(regex, `$1\n  condition                String?\n  documentUrl              String?`);
  fs.writeFileSync(schemaPath, schemaCode);
  console.log("schema.prisma updated properly!");
} else {
  console.log("Could not find the target string or it is already updated.");
}
