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

let files = [
    'src/controller/old_data_sync/old_sync.controller.ts',
    'src/controller/old_data_sync/old_sync_modified.controller.ts'
];

for (let f of files) {
    replace(f, /const\s*=\s*await this\.createOrFindSubcategory\([\s\S]*?\);/g, '');
    replace(f, /location\?:\s*any,\s*\?:\s*number/g, 'location?: any');
    replace(f, /location,\s*\);/g, 'location\n          );');
}

replace('src/controller/ticket/ticket.controller.ts', /unit:\s*\{\s*select:\s*\{\s*name:\s*true,\s*[\s\S]*?\},\s*\},\n?/g, '');

