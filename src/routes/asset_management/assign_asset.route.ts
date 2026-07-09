import { Router } from "express";
import { hasPermission } from "@middlewares/permission.middleware";
import { assignAsset, getAssignList, getAssignDetails, getExpiredAssignList } from "@src/controller/asset_management/assign_asset.controller";
const assetrouter = Router();

assetrouter.post("/assign-asset",hasPermission('update-asset'), assignAsset);
assetrouter.get("/list", hasPermission('update-asset'), getAssignList);
assetrouter.get("/details/:id", hasPermission('update-asset'), getAssignDetails);
assetrouter.get("/expired-list", hasPermission('update-asset'), getExpiredAssignList);


export default assetrouter;