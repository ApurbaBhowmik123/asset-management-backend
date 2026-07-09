const fs = require('fs');
const path = 'F:/asset_management/ams-backend/src/controller/old_data_sync/old_sync_modified.controller.ts';

let content = fs.readFileSync(path, 'utf8');

const target1 = `  async importAsset(data: AssetData, userId: number): Promise<ImportResult> {
    try {
      return await prisma.$transaction(async (tx) => {
        // Step 1: Create or find product`;

const replace1 = `  async importAsset(data: AssetData, userId: number): Promise<ImportResult> {
    try {
        // Transaction removed to avoid sqlite deadlock
        // Step 1: Create or find product`;

const target2 = `          return {
          success: true,
          message: \`Asset imported successfully for \${data.Model} Asset tag \${data["Asset Tag"]}\`,
          data: {
            productId,
            grDetailId,
            inventoryProductId,
            inventoryDetailId,
            assignmentId: assignmentId || undefined,
          },
        };
      });
    } catch (error) {`;

const replace2 = `          return {
          success: true,
          message: \`Asset imported successfully for \${data.Model} Asset tag \${data["Asset Tag"]}\`,
          data: {
            productId,
            grDetailId,
            inventoryProductId,
            inventoryDetailId,
            assignmentId: assignmentId || undefined,
          },
        };
    } catch (error) {`;

// Standardize whitespace for robust replacement
content = content.replace(/return await prisma\.\$transaction\(async \(tx\) => \{/g, "");
content = content.replace(/\s*\}\);\s*\} catch \(error\) \{/g, "\n      } catch (error) {");

fs.writeFileSync(path, content, 'utf8');
console.log("Fixed transaction");
