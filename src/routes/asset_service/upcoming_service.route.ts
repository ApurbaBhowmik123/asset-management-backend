import {
  upcomingService,
  upcomingServiceDetails,
} from "@controllers/asset_service/upcoming_asset_service.controller";
import { hasPermission } from "@middlewares/permission.middleware";
import { CreateServiceValidator } from "@validators/asset-service/service.validator";
import { validate } from "@middlewares/validate.midlleware";
import { service } from "@controllers/asset_service/service.controller";
import Router from "express";

export const upcomingServiceRouter = Router();

upcomingServiceRouter.get(
  "/list",
  hasPermission("read-services"),
  upcomingService
);

upcomingServiceRouter.get(
  "/details/:id",
  hasPermission("read-services"),
  upcomingServiceDetails
);

upcomingServiceRouter.post(
  "/create/:inventoryProductDetailId",
  hasPermission("create-services"),
  CreateServiceValidator,
  validate,
  service
);
