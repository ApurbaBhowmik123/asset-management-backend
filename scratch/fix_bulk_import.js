const fs = require('fs');
const path = 'F:/asset_management/ams-backend/src/controller/old_data_sync/old_sync_modified.controller.ts';

let content = fs.readFileSync(path, 'utf8');

const target = `    // Bulk import function
  async bulkImportAssets(req: Request, res: Response) {
    const results: ImportResult[] = [];
    const { data: assetsData } = req.body;
    const userId = parseInt(req?.user?.id ?? "0");
    for (const asset of assetsData) {
      try {`;

const replacement = `    // Bulk import function
  async bulkImportAssets(req: Request, res: Response) {
    const results: ImportResult[] = [];
    const { data: assetsData } = req.body;
    const userId = parseInt(req?.user?.id ?? "0");
    for (let asset of assetsData) {
      // Normalize keys for exported table format vs sample excel format
      asset.Model = asset.Model || asset["Model Name"] || asset["Product"] || "Unknown";
      asset["Asset Tag"] = asset["Asset Tag"] || asset["SAP Code"] || "";
      asset["Serial Number"] = asset["Serial Number"] || asset["Serial No 1"] || "";
      asset["Make"] = asset["Make"] || asset["Brand"] || "";
      asset["Asset Type"] = asset["Asset Type"] || asset["Category"] || "";
      asset["PO Number"] = asset["PO Number"] || asset["Invoice Number"] || "";
      asset["PO Value"] = asset["PO Value"] || asset["Rate Per Piece"] || 0;
      asset["Acquisition Date (PO)"] = asset["Acquisition Date (PO)"] || asset["Warranty Till (YYYY-MM-DD)"] || "";
      
      try {`;

content = content.replace(target, replacement);

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed bulkImportAssets');
