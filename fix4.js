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

// transfer.controller.ts
replace('src/controller/asset_transfer/transfer.controller.ts', /case "subcategory_name":\s*return product\?\.subcategory\?\.name \|\| "";/g, '');

// service.controller.ts
replace('src/controller/asset_service/service.controller.ts', /item\.inventoryProducts/g, 'item.grInventoryProduct');

// dashboard.controller.ts
replace('src/controller/dashboard/dashboard.controller.ts', /inventoryProducts:/g, 'inventoryEntries:');
replace('src/controller/dashboard/dashboard.controller.ts', /\.inventoryProducts/g, '.inventoryEntries');

// gr.controller.ts
replace('src/controller/gr/gr.controller.ts', /grInventoryProductId: inventoryProducts.id/g, 'grInventoryProductId: grInventoryProduct.id');

// old_sync.controller.ts & old_sync_modified.controller.ts
replace('src/controller/old_data_sync/old_sync.controller.ts', /subcategoryId:\s*''\s*,?\n?/g, '');
replace('src/controller/old_data_sync/old_sync.controller.ts', /inventoryProducts\.id/g, 'grInventoryProduct.id');

replace('src/controller/old_data_sync/old_sync_modified.controller.ts', /subcategoryId:\s*''\s*,?\n?/g, '');
replace('src/controller/old_data_sync/old_sync_modified.controller.ts', /inventoryProducts\.id/g, 'grInventoryProduct.id');

// ticket.controller.ts
replace('src/controller/ticket/ticket.controller.ts', /include:\s*\{\s*\},\n?/g, '');

// seed.ts
replace('src/seed/seed.ts', /subcategoryId:\s*''\s*,?\n?/g, '');
