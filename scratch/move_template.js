const fs = require('fs');
const filePath = 'F:/asset_management/ams-frontend/src/Page/AssetManagement/UnassignAsset/UnassignAsset.jsx';
let code = fs.readFileSync(filePath, 'utf8');

// The pdfTemplate is inside the Modal right now. Let's extract it.
const regex = /({\/\* PDF Template - Hidden but used for PDF generation \*\/}[\s\S]*?)<\/Modal>/;
const match = code.match(regex);
if (match) {
    const templateBlock = match[1];
    code = code.replace(regex, '</Modal>\n\n      ' + templateBlock);
    fs.writeFileSync(filePath, code);
    console.log("Moved PDF Template outside the Modal");
} else {
    console.log("Could not find the PDF Template inside the Modal");
}
