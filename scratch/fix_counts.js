const fs = require('fs');

// 1. dashboard.controller.ts
const dashPath = 'F:/asset_management/ams-backend/src/controller/dashboard/dashboard.controller.ts';
let dashCode = fs.readFileSync(dashPath, 'utf8');

dashCode = dashCode.replace(
  `              AssignedStatus.WRITE_OFF,
            ],`,
  `              AssignedStatus.WRITE_OFF,
              AssignedStatus.SCRAP,
            ],`
);

dashCode = dashCode.replace(
  `// 2. Asset Status
      const st = asset.assignedStatus || "Unknown";
      statusMap.set(st, (statusMap.get(st) || 0) + 1);`,
  `// 2. Asset Status
      let st = asset.assignedStatus || "Unknown";
      if (["Untagged", "InstallationCompleted", "PENDING_RETURN", "SCRAP"].includes(st)) {
          st = "InStock"; // Group these under Instock for the pie chart to match the Top Card logic
      }
      statusMap.set(st, (statusMap.get(st) || 0) + 1);`
);

fs.writeFileSync(dashPath, dashCode);


// 2. helper.controller.ts
const helperPath = 'F:/asset_management/ams-backend/src/controller/asset_management/helper.controller.ts';
let helperCode = fs.readFileSync(helperPath, 'utf8');

helperCode = helperCode.replace(
  `          notIn: [
            AssignedStatus.ASSIGNED,
            AssignedStatus.BLOCKED,
            AssignedStatus.WRITE_OFF,
            AssignedStatus.E_WASTE,
          ],`,
  `          notIn: [
            AssignedStatus.ASSIGNED,
            AssignedStatus.BLOCKED,
            AssignedStatus.WRITE_OFF,
            AssignedStatus.E_WASTE,
            AssignedStatus.SCRAP,
          ],`
);

helperCode = helperCode.replace(
  `notIn: ["ASSIGNED", "BLOCKED", "WRITE_OFF", "E_WASTE"],`,
  `notIn: ["ASSIGNED", "BLOCKED", "WRITE_OFF", "E_WASTE", "SCRAP"],`
);

fs.writeFileSync(helperPath, helperCode);


// 3. inventory.controller.ts
const invPath = 'F:/asset_management/ams-backend/src/controller/gr/inventory.controller.ts';
let invCode = fs.readFileSync(invPath, 'utf8');

invCode = invCode.replace(
  `notIn: [AssignedStatus.E_WASTE, AssignedStatus.BLOCKED, AssignedStatus.ASSIGNED, AssignedStatus.WRITE_OFF, "Untagged", AssignedStatus.SCRAP]`,
  `notIn: [AssignedStatus.E_WASTE, AssignedStatus.BLOCKED, AssignedStatus.ASSIGNED, AssignedStatus.WRITE_OFF]`
);

invCode = invCode.replace(
  `notIn: [AssignedStatus.E_WASTE, AssignedStatus.BLOCKED, AssignedStatus.ASSIGNED, AssignedStatus.WRITE_OFF, "Untagged", AssignedStatus.SCRAP]`,
  `notIn: [AssignedStatus.E_WASTE, AssignedStatus.BLOCKED, AssignedStatus.ASSIGNED, AssignedStatus.WRITE_OFF]`
);

invCode = invCode.replace(
  `notIn: [AssignedStatus.E_WASTE, AssignedStatus.BLOCKED, AssignedStatus.ASSIGNED, AssignedStatus.WRITE_OFF, "Untagged", AssignedStatus.SCRAP]`,
  `notIn: [AssignedStatus.E_WASTE, AssignedStatus.BLOCKED, AssignedStatus.ASSIGNED, AssignedStatus.WRITE_OFF]`
);

invCode = invCode.replace(
  `notIn: [AssignedStatus.E_WASTE, AssignedStatus.WRITE_OFF, "Untagged", AssignedStatus.SCRAP]`,
  `notIn: [AssignedStatus.E_WASTE, AssignedStatus.WRITE_OFF]`
);

fs.writeFileSync(invPath, invCode);

console.log("Replaced successfully!");
