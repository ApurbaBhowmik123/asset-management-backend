const fs = require('fs');

const dashPath = 'F:/asset_management/ams-backend/src/controller/dashboard/dashboard.controller.ts';
let dashCode = fs.readFileSync(dashPath, 'utf8');

dashCode = dashCode.replace(
  `export const getDashboardAnalytics = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {`,
  `export const getDashboardAnalytics = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const depreciationPeriodParam = req.query.depreciationPeriod as string;
      let depreciationYears = 3; // default
      if (depreciationPeriodParam === "today" || depreciationPeriodParam === "0") {
        depreciationYears = 0;
      } else if (depreciationPeriodParam) {
        const parsed = parseInt(depreciationPeriodParam);
        if (!isNaN(parsed)) depreciationYears = parsed;
      }`
);

dashCode = dashCode.replace(
  `        const ageInMs = new Date().getTime() - new Date(createdAt).getTime();
        const ageInYears = ageInMs / (1000 * 60 * 60 * 24 * 365.25);
        let depreciatedPrice = price;
        if (ageInYears >= 3) {
          depreciatedPrice = 0;
        } else if (ageInYears > 0) {
          depreciatedPrice = price - (price * (ageInYears / 3));
        }`,
  `        const ageInMs = new Date().getTime() - new Date(createdAt).getTime();
        const ageInYears = ageInMs / (1000 * 60 * 60 * 24 * 365.25);
        let depreciatedPrice = price;
        
        if (depreciationYears === 0) {
          // 'today' or 0 years - no depreciation yet
          depreciatedPrice = price;
        } else {
          if (ageInYears >= depreciationYears) {
            depreciatedPrice = 0;
          } else if (ageInYears > 0) {
            depreciatedPrice = price - (price * (ageInYears / depreciationYears));
          }
        }`
);

fs.writeFileSync(dashPath, dashCode);
console.log("dashboard.controller.ts updated for dynamic depreciation.");
