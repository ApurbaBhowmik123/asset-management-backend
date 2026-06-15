const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    for (const [regex, replacement] of replacements) {
        content = content.replace(regex, replacement);
    }
    if (content !== original) {
        fs.writeFileSync(filePath, content);
        console.log('Fixed', filePath);
    }
}

function walk(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walk(dirPath, callback) : callback(dirPath);
    });
}

walk('src', (filePath) => {
    if (filePath.endsWith('.ts')) {
        replaceInFile(filePath, [
            [/subcategory:\s*true,?\n?/g, ''],
            [/subcategory:\s*\{\s*select:[^}]+\},?\n?/g, ''],
            [/subcategoryId:[^,}\n]+,?\n?/g, ''],
            [/inventoryProducts/g, 'inventoryEntries'],
            [/grInventoryProduct\./g, 'inventoryEntries.'], // wild guess
            [/InventoryProductDetails\./g, 'inventoryEntries.'], // wild guess
            [/qrCode\./g, 'sapCodeAddedAt.'] // wait, just remove it or ignore it
        ]);
    }
});
