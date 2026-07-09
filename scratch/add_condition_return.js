const fs = require('fs');
const filePath = 'F:/asset_management/ams-frontend/src/Page/AssetManagement/ReturnHandover/ReturnHandover.jsx';
let code = fs.readFileSync(filePath, 'utf8');

if (!code.includes('unassignCondition: result.data.data.products.map(p => p.unassignCondition')) {
    code = code.replace(
        `unassignRemark: result.data.data.products.map(p => p.unassignRemark || 'N/A').join(', ')`,
        `unassignRemark: result.data.data.products.map(p => p.unassignRemark || 'N/A').join(', '),\n              unassignCondition: result.data.data.products.map(p => p.unassignCondition || 'N/A').join(', ')`
    );
}

if (!code.includes('columnHelper.accessor("unassignCondition"')) {
    code = code.replace(
        `columnHelper.accessor("unassignRemark", { header: "Previous Remark", size: 150 }),`,
        `columnHelper.accessor("unassignCondition", { header: "Condition", size: 120 }),\n      columnHelper.accessor("unassignRemark", { header: "Previous Remark", size: 150 }),`
    );
}

fs.writeFileSync(filePath, code);
console.log("Updated ReturnHandover.jsx with unassignCondition column");
