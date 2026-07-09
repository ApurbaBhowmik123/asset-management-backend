const fs = require('fs');
const path = 'F:/asset_management/ams-backend/src/controller/old_data_sync/old_sync_modified.controller.ts';

let content = fs.readFileSync(path, 'utf8');

const target = `        // Get and normalize values
        const assetTag = item['Asset Tag']?.toString()?.trim();
        const serialNumber = item['Serial Number']?.toString()?.trim();
        const acquisitionDate = item["Acquisition Date (PO)"];
        const assignedOn = item["Assigned On"];
        const poNumber = item["PO Number"];
        const productName = item["Model"];
        const unitName = item["Unit"];`;

const replace = `        // Get and normalize values
        const assetTag = (item['Asset Tag'] || item['SAP Code'])?.toString()?.trim();
        const serialNumber = (item['Serial Number'] || item['Serial No 1'])?.toString()?.trim();
        const acquisitionDate = item["Acquisition Date (PO)"] || item["Warranty Till (YYYY-MM-DD)"];
        const assignedOn = item["Assigned On"];
        const poNumber = item["PO Number"] || item["Invoice Number"];
        const productName = item["Model"] || item["Model Name"] || item["Product"];
        const unitName = item["Unit"];`;

content = content.replace(target, replace);
fs.writeFileSync(path, content, 'utf8');
console.log("Fixed oldDataSync normalization");
