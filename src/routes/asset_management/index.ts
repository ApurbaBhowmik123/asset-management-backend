import { Router } from "express";
import { authCheck } from "@middlewares/auth.middleware";
import assetrouter from "./assign_asset.route";
import assethelprouter from "./helper.route";
import handoverrouter from "./handover.route";
import { unassignRouter } from "./unassign.route";
export const assetManagementRoute = Router();

assetManagementRoute.use(authCheck);
assetManagementRoute.use("/asset", assetrouter);
assetManagementRoute.use("/asset-helper", assethelprouter);
assetManagementRoute.use("/asset-handover", handoverrouter);
assetManagementRoute.use("/asset-unassign", unassignRouter);
