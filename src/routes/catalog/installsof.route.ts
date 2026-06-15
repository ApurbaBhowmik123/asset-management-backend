import { Router } from "express";
import { hasPermission } from "@middlewares/permission.middleware";
import {
  createInstallation,
  getAllInstallations,
  updateStatus,
} from "@controllers/catalog/installation.controller";

export const installSofRouter = Router();

installSofRouter.post("/", hasPermission("create-installation"), createInstallation);
installSofRouter.get("/", hasPermission("read-installation"), getAllInstallations);
installSofRouter.put(
  "/:id/status",
  hasPermission("update-installation"),
  updateStatus
);

