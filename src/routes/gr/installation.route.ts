import { Router } from "express";
import { hasPermission } from "@middlewares/permission.middleware";
import {
  getInstallationList,
  installSoftwaresToProduct,
  getInstalledList,
  getInstallatedDetails,
} from "@controllers/gr/installation.controller";
import { installSoftwareValidator } from "@src/validator/gr/install-sof-to-prod.validator";
import { paginationValidator } from "@validators/pagination.validator";
import { validate } from "@middlewares/validate.midlleware";

export const installationRouter = Router();

installationRouter.get(
  "/list",
  hasPermission("read-installation"),
  paginationValidator([
    "name",
    "uuid",
    "description",
    "createdAt",
    "updatedAt",
    "warrantyTill",
    "lifecycleExDate",
    "assignedStatus",
    `totalAmount`,
  ]),
  validate,
  getInstallationList
);

installationRouter.post(
  "/install-software/:id",
  hasPermission("create-installation"),
  installSoftwareValidator,
  validate,
  installSoftwaresToProduct
);

installationRouter.get(
  "/complete-installation/list",
  hasPermission("read-installation"),
  getInstalledList
);

installationRouter.get(
  "/complete-installation/details/:installedId",
  hasPermission("read-installation"),
  getInstallatedDetails
);