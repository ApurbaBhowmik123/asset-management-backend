const fs = require('fs');
const filePath = 'F:/asset_management/ams-frontend/src/Page/AssetManagement/UnassignAsset/UnassignAsset.jsx';
let code = fs.readFileSync(filePath, 'utf8');

code = code.replace(
  'doc.autoTable({',
  'autoTable(doc, {'
);

fs.writeFileSync(filePath, code);
console.log("UnassignAsset.jsx updated");
