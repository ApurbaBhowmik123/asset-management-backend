const fs = require('fs');

const appPath = 'F:/asset_management/ams-frontend/src/App.jsx';
let appCode = fs.readFileSync(appPath, 'utf8');

if (!appCode.includes('asset-warranty-upcoming')) {
    appCode = appCode.replace(
        `<Route path="/reports/asset-warranty" element={<AssetWarranty />} />`,
        `<Route path="/reports/asset-warranty" element={<AssetWarranty />} />\n              <Route path="/reports/asset-warranty-upcoming" element={<AssetWarranty />} />\n              <Route path="/reports/asset-warranty-expired" element={<AssetWarranty />} />`
    );
    fs.writeFileSync(appPath, appCode);
    console.log("Updated App.jsx with new routes");
}

const sidebarPath = 'F:/asset_management/ams-frontend/src/Page/SideBar/SideBar.jsx';
let sidebarCode = fs.readFileSync(sidebarPath, 'utf8');

if (!sidebarCode.includes('path: "/reports/asset-warranty-upcoming"')) {
    sidebarCode = sidebarCode.replace(
        `                    {
                      label: "Asset Warranty",
                      path: "/reports/asset-warranty",
                      requiredPermission: "read-report"
                    },`,
        `                    {
                      label: "Asset Warranty",
                      path: "/reports/asset-warranty",
                      requiredPermission: "read-report"
                    },
                    {
                      label: "Upcoming Warranty Asset",
                      path: "/reports/asset-warranty-upcoming",
                      requiredPermission: "read-report"
                    },
                    {
                      label: "Expiry Warranty Asset",
                      path: "/reports/asset-warranty-expired",
                      requiredPermission: "read-report"
                    },`
    );
    fs.writeFileSync(sidebarPath, sidebarCode);
    console.log("Updated SideBar.jsx with new menus");
}
