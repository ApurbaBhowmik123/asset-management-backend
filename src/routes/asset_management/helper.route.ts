import { Router } from "express";
import { hasPermission } from "@middlewares/permission.middleware";
import {
  fetchUserList,
  fetchAssignableProducList,
  fetchAssignDetails,
  fetchAssignDetailsSingle,
  getSpecValuesByCategory,
  getFilterMatrix,
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
assethelprouter.get(
  "/spec-values/:categoryId",
  hasPermission("update-asset"),
  getSpecValuesByCategory
);
assethelprouter.get(
  "/dynamic-filters-master-data",
  hasPermission("update-asset"),
  getFilterMatrix
);

assethelprouter.get("/test-matrix-data", getFilterMatrix);

export default assethelprouter;
