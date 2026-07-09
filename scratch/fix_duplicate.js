const fs = require('fs');
const path = 'F:/asset_management/ams-backend/src/controller/old_data_sync/old_sync_modified.controller.ts';

let content = fs.readFileSync(path, 'utf8');

const target = `  async importAsset(data: AssetData, userId: number): Promise<ImportResult> {
    try {
        // Transaction removed to avoid sqlite deadlock
        // Step 1: Create or find product`;

const replace = `  async importAsset(data: AssetData, userId: number): Promise<ImportResult> {
    try {
        // Transaction removed to avoid sqlite deadlock
        
        // Check for duplicate asset tag early
        const assetTag = data["Asset Tag"];
        if (assetTag) {
            const existingAsset = await prisma.inventoryProductDetail.findUnique({
                where: { uuid: assetTag }
            });
            if (existingAsset) {
                return {
                    success: false,
                    message: \`Asset tag \${assetTag} already exists in the system (Duplicate skipped).\`,
                };
            }
        }

        // Step 1: Create or find product`;

content = content.replace(target, replace);
fs.writeFileSync(path, content, 'utf8');
console.log("Added duplicate check");
