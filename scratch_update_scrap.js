const fs = require('fs');
const file = 'f:/asset_management/ams-backend/src/controller/gr/inventory.controller.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /notIn:\s*\[\s*AssignedStatus\.E_WASTE,\s*AssignedStatus\.WRITE_OFF,\s*"Untagged"\s*\]/g,
  'notIn: [AssignedStatus.E_WASTE, AssignedStatus.WRITE_OFF, "Untagged", AssignedStatus.SCRAP]'
);

// We should also replace the one that includes BLOCKED and ASSIGNED
content = content.replace(
  /notIn:\s*\[\s*AssignedStatus\.E_WASTE,\s*AssignedStatus\.BLOCKED,\s*AssignedStatus\.ASSIGNED,\s*AssignedStatus\.WRITE_OFF,\s*"Untagged",?\s*\]/g,
  'notIn: [AssignedStatus.E_WASTE, AssignedStatus.BLOCKED, AssignedStatus.ASSIGNED, AssignedStatus.WRITE_OFF, "Untagged", AssignedStatus.SCRAP]'
);

fs.writeFileSync(file, content);
console.log("Updated inventory.controller.ts to exclude SCRAP from main listings.");
