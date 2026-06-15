import { Router } from "express";
import {
  getLocations,
  getLocationById,
  createLocation,
  updateLocation,
  deleteLocation,
  getLocationByUnitId,
  getAllLocations,
} from "@controllers/super_admin/location.controller";
import { parseJsonFields } from "@src/middleware/parsedJSON.middleware";

import { hasPermission } from "@middlewares/permission.middleware";
import { validate } from "@middlewares/validate.midlleware";
import {
  validateCreateLocation,
  validateUpdateLocation,
} from "@validators/super_admin/locations/location.validator";
import { upload } from "@src/utils/multer";

export const locationRouter = Router();

locationRouter.get("/",  getLocations);
// locationRouter.get("/", hasPermission("read-locations"), getLocations);

locationRouter.get(
  "/find/:id",
  hasPermission("read-locations"),
  getLocationById
);

locationRouter.post(
  "/create",
  hasPermission("create-locations"),
  upload.single("image"),
  parseJsonFields(["image"]),
  validateCreateLocation,
  validate,
  createLocation
);

locationRouter.post(
  "/update/:id",
  hasPermission("update-locations"),
  upload.single("image"),
  parseJsonFields(["image"]),
  validateUpdateLocation,
  validate,
  updateLocation
);

locationRouter.delete(
  "/delete/:id",
  hasPermission("delete-locations"),
  deleteLocation
);

locationRouter.get(
  "/by-unit/:unitId",
  // hasPermission("read-locations"),
  getLocationByUnitId
);

locationRouter.get("/location-all", hasPermission("read-locations"), getAllLocations);
