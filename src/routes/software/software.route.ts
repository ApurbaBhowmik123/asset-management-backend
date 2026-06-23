import { Router } from "express";
import {
  getSoftwareById,
  getsoftwares,
  createSoftware,
  getAllSoftware,
  getLicenseTypes,
  updateSoftware,
  assignSoftware,
  getSoftwareLogs,
  getAssignSoftwareList,
  unassignSoftware,
  getUnassignSoftwareList,
  deleteSoftware
} from "@controllers/software/software.controller";
import { hasPermission } from "@middlewares/permission.middleware";

export const softwareRouter = Router();

softwareRouter.get("/list", hasPermission("read-software"), getsoftwares);
softwareRouter.get("/all", hasPermission("read-software"), getAllSoftware);
softwareRouter.get("/license-types", hasPermission("read-software"), getLicenseTypes);
softwareRouter.get(
  "/detail/:id",
  hasPermission("read-software"),
  getSoftwareById
);
softwareRouter.post(
  "/create",
  hasPermission("create-software"),
  createSoftware
);
softwareRouter.put(
  "/update/:id",
  hasPermission("update-software"),
  updateSoftware
);

softwareRouter.post(
  "/assign",
  hasPermission("update-software"),
  assignSoftware
);

softwareRouter.get(
  "/logs",
  hasPermission("read-software"),
  getSoftwareLogs
);

softwareRouter.get(
  "/assign-list",
  hasPermission("read-software"),
  getAssignSoftwareList
);

softwareRouter.post(
  "/unassign",
  hasPermission("update-software"),
  unassignSoftware
);

softwareRouter.get(
  "/unassign-list",
  hasPermission("read-software"),
  getUnassignSoftwareList
);

softwareRouter.delete(
  "/:id",
  hasPermission("delete-software"),
  deleteSoftware
);