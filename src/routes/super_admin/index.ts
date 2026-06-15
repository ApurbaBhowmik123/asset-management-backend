import { Router } from "express";
import { ACLRoute } from "./ACL/index";
import { departmentRouter } from "./department.route";
import { vendorRouter } from "./vendor.route";
import { brandRouter } from "./brand.route";
import { unitRouter } from "./unit.route";
import { authCheck } from "../../middleware/auth.middleware";
import { locationRouter } from "./location.route";
import { mailConfigRouter } from "./mail_config.route";
export const superAdminRoute = Router();

superAdminRoute.use(authCheck);
superAdminRoute.use("/acl", ACLRoute);
superAdminRoute.use("/departments", departmentRouter);
superAdminRoute.use("/units", unitRouter);
superAdminRoute.use("/vendors", vendorRouter);
superAdminRoute.use("/brands", brandRouter);
superAdminRoute.use("/locations", locationRouter);
superAdminRoute.use("/mail-config", mailConfigRouter);
