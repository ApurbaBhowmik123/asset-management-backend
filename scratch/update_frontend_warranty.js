const fs = require('fs');

// 1. Update App.jsx
const appPath = 'F:/asset_management/ams-frontend/src/App.jsx';
let appCode = fs.readFileSync(appPath, 'utf8');

if (!appCode.includes('AssetWarranty')) {
    // Add import
    appCode = appCode.replace(
        `import SoftReport from "./Page/Reports/SoftReport/SoftReport";`,
        `import SoftReport from "./Page/Reports/SoftReport/SoftReport";\nimport AssetWarranty from "./Page/Reports/AssetWarranty/AssetWarranty";`
    );

    // Add Route
    appCode = appCode.replace(
        `<Route path="/reports/soft-report" element={<SoftReport />} />`,
        `<Route path="/reports/soft-report" element={<SoftReport />} />\n              <Route path="/reports/asset-warranty" element={<AssetWarranty />} />`
    );
    
    fs.writeFileSync(appPath, appCode);
    console.log("Updated App.jsx");
}

// 2. Update SideBar.jsx
const sidebarPath = 'F:/asset_management/ams-frontend/src/Page/SideBar/SideBar.jsx';
let sidebarCode = fs.readFileSync(sidebarPath, 'utf8');

if (!sidebarCode.includes('path: "/reports/asset-warranty"')) {
    sidebarCode = sidebarCode.replace(
        `path: "/reports/asset-aging",\n                      requiredPermission: "read-report"\n                    },`,
        `path: "/reports/asset-aging",\n                      requiredPermission: "read-report"\n                    },\n                    {\n                      label: "Asset Warranty",\n                      path: "/reports/asset-warranty",\n                      requiredPermission: "read-report"\n                    },`
    );
    
    fs.writeFileSync(sidebarPath, sidebarCode);
    console.log("Updated SideBar.jsx");
}
