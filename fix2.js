const fs = require('fs');

const files = [
'src/controller/asset.detail.controller.ts',
'src/controller/asset_management/assign_asset.controller.ts',
'src/controller/asset_management/handover.controller.ts',
'src/controller/asset_management/helper.controller.ts',
'src/controller/asset_management/unassign.controller.ts',
'src/controller/asset_service/pending_asset_service.controller.ts',
'src/controller/asset_service/service.controller.ts',
'src/controller/asset_service/upcoming_asset_service.controller.ts',
'src/controller/asset_transfer/accept_transfer.controller.ts',
'src/controller/asset_transfer/transfer.controller.ts',
'src/controller/gr/gr.controller.ts',
'src/controller/gr/installation.controller.ts',
'src/controller/gr/qr.controller.ts',
'src/controller/old_data_sync/old_sync.controller.ts',
'src/controller/old_data_sync/old_sync_modified.controller.ts',
'src/controller/product_request/e_waste.controller.ts',
'src/controller/product_request/productrequest.controller.ts',
'src/controller/ticket/ticket.controller.ts'
];

for(let f of files) {
    let content = fs.readFileSync(f, 'utf8');
    let original = content;
    
    // Fix: extra }, after category
    content = content.replace(/(category:\s*\{\s*select:\s*\{[^}]+\},\s*\},\s*)\s*\},/g, '');
    
    // Fix: extra }, before category
    content = content.replace(/(name:\s*true,\s*)\s*\},\s*(category:\s*\{)/g, '\n');
    
    // Fix: extra }, before brand
    content = content.replace(/(category:\s*\{\s*select:\s*\{[^}]+\},\s*\},\s*)\s*\},\s*(brand:\s*\{)/g, '\n');

    // Any other extra }, before category?
    content = content.replace(/(\},\s*)\s*\},\s*(category:\s*\{)/g, '\n');

    if(content !== original) {
        fs.writeFileSync(f, content);
        console.log('Fixed', f);
    }
}
