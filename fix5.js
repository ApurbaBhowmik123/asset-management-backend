const fs = require('fs');

function replace(f, regex, repl) {
    if (fs.existsSync(f)) {
        let text = fs.readFileSync(f, 'utf8');
        let newText = text.replace(regex, repl);
        if (text !== newText) {
            fs.writeFileSync(f, newText);
            console.log('Fixed', f);
        }
    }
}

// helper.controller.ts
replace('src/controller/asset_management/helper.controller.ts', /case "subcategory_name":\s*return product\?\.subcategory\?\.name \|\| "";/g, '');
replace('src/controller/asset_management/helper.controller.ts', /subcategory: grProduct\.product\.subcategory,/g, '');

// transfer.controller.ts (just in case)
replace('src/controller/asset_transfer/transfer.controller.ts', /case "subcategory_name":\s*return product\?\.subcategory\?\.name \|\| "";/g, '');

// service.controller.ts
replace('src/controller/asset_service/service.controller.ts', /inventoryProductDetail\.inventoryProducts\.maintenanceFrequency/g, 'inventoryProductDetail.grInventoryProduct.maintenanceFrequency');

// gr.controller.ts
replace('src/controller/gr/gr.controller.ts', /cost: inventoryProducts\.ratePerPiece,/g, 'cost: grInventoryProduct.ratePerPiece,');

// old_sync.controller.ts
replace('src/controller/old_data_sync/old_sync.controller.ts', /subcategoryId,?\n?/g, '');

// old_sync_modified.controller.ts
replace('src/controller/old_data_sync/old_sync_modified.controller.ts', /subcategoryId,?\n?/g, '');

// ticket.controller.ts
replace('src/controller/ticket/ticket.controller.ts', /unit:\s*\{\s*select:\s*\{\s*name:\s*true,\s*\},\s*\},\n?/g, '');

// seed.ts
replace('src/seed/seed.ts', /\/\/ Associate Spec Fields with Subcategory Laptops[\s\S]*?\}\n  \}/g, '');
