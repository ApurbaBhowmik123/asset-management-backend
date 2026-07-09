const fs = require('fs');
const path = 'F:/asset_management/ams-backend/src/controller/old_data_sync/old_sync_modified.controller.ts';

let content = fs.readFileSync(path, 'utf8');

// Fix Model.trim()
content = content.replace(/data\.Model\.trim\(\)/g, "data.Model?.trim() || ''");

// Fix Asset Tag and Serial Number trim
content = content.replace(/item\["Asset Tag"\]\?\.toString\(\)\.trim\(\)/g, "item['Asset Tag']?.toString()?.trim()");
content = content.replace(/item\["Serial Number"\]\?\.toString\(\)\.trim\(\)/g, "item['Serial Number']?.toString()?.trim()");

// Fix uuid and serialNo1 trim
content = content.replace(/\.uuid\?\.toString\(\)\.trim\(\)/g, ".uuid?.toString()?.trim()");
content = content.replace(/\.serialNo1\?\.toString\(\)\.trim\(\)/g, ".serialNo1?.toString()?.trim()");

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed trim issues');
