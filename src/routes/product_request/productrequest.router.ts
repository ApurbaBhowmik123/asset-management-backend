import { Router } from "express";
export const requestRouter = Router();
import { hasPermission } from "@middlewares/permission.middleware";

import {
  productRequest,
  productRequestGetAll,
  requestApprove,
  productRequestDetails,
} from "@src/controller/product_request/productrequest.controller";

requestRouter.post(
  "/request-product-status",
  hasPermission("create-productrequest"),
  productRequest
);
requestRouter.get(
  "/request-product-get",
  hasPermission("create-productrequest"),
  productRequestGetAll
);
requestRouter.put(
  "/request-approve/:requestId",
  hasPermission("create-productrequest"),
  requestApprove
);
requestRouter.get(
  "/log-details/:requestId",
  hasPermission("read-productrequest"),
  productRequestDetails
);
