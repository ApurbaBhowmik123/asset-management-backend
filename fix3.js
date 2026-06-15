const fs = require('fs');
const path = require('path');

function replace(f, regex, replacement) {
    if (fs.existsSync(f)) {
        let text = fs.readFileSync(f, 'utf8');
        let newText = text.replace(regex, replacement);
        if (newText !== text) {
            fs.writeFileSync(f, newText);
            console.log('Fixed', f);
        }
    }
}

function walk(dir) {
    fs.readdirSync(dir).forEach(f => {
        let p = path.join(dir, f);
        if (fs.statSync(p).isDirectory()) walk(p);
        else if (p.endsWith('.ts')) {
            replace(p, /inventoryEntries/g, 'inventoryProducts');
            replace(p, /sapCodeAddedAt\./g, 'qrCode.');
        }
    });
}
walk('src');

replace('src/controller/product_request/e_waste.controller.ts', /item\.inventoryProducts/g, 'item.InventoryProductDetails');
replace('src/controller/ticket/ticket.controller.ts', /subcategories:\s*true,?\n?/g, '');

