const fs = require('fs');

const dashPath = 'F:/asset_management/ams-backend/src/controller/dashboard/dashboard.controller.ts';
let dashCode = fs.readFileSync(dashPath, 'utf8');

dashCode = dashCode.replace(
  `        if (!categoryMap.has(cName)) {
          categoryMap.set(cName, { name: cName, count: 0, value: 0 });
        }
        const cEntry = categoryMap.get(cName);
        cEntry.count += 1;
        cEntry.value += price;`,
  `        const createdAt = asset.grInventoryProduct?.createdAt || asset.createdAt;
        const ageInMs = new Date().getTime() - new Date(createdAt).getTime();
        const ageInYears = ageInMs / (1000 * 60 * 60 * 24 * 365.25);
        let depreciatedPrice = price;
        if (ageInYears >= 3) {
          depreciatedPrice = 0;
        } else if (ageInYears > 0) {
          depreciatedPrice = price - (price * (ageInYears / 3));
        }

        if (!categoryMap.has(cName)) {
          categoryMap.set(cName, { name: cName, count: 0, value: 0, depreciatedValue: 0 });
        }
        const cEntry = categoryMap.get(cName);
        cEntry.count += 1;
        cEntry.value += price;
        cEntry.depreciatedValue += depreciatedPrice;`
);

fs.writeFileSync(dashPath, dashCode);
console.log("dashboard.controller.ts updated for depreciation.");
