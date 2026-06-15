import { Router } from "express";
import { hasPermission } from "@middlewares/permission.middleware";
import {
  fetchUserList,
  fetchAssignableProducList,
  fetchAssignDetails,
  fetchAssignDetailsSingle,
} from "@src/controller/asset_management/helper.controller";
const assethelprouter = Router();

assethelprouter.get(
  "/user-list",
  hasPermission("update-asset"),
  fetchUserList
);
assethelprouter.get(
  "/asset-assignable-products",
  hasPermission("update-asset"),
  fetchAssignableProducList
);
assethelprouter.get(
  "/asset-assignable-details",
  hasPermission("update-asset"),
  fetchAssignDetails
);
assethelprouter.get(
  "/asset-assignable-details-single/:id",
  hasPermission("update-asset"),
  fetchAssignDetailsSingle
);

export default assethelprouter;
