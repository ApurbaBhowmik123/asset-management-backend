import { Router } from "express";
import { authRouter } from "./auth.route";

import { accessRouter } from "./access.route";
import { superAdminRoute } from "./super_admin";

import { ticketRouter } from "./tickets/index.route";
import { catalogRouter } from "./catalog";
import { grRoute } from "./gr/index";
import { assetManagementRoute } from "./asset_management";
import { reportRoute } from "./report";
import { assetServiceRoute } from "./asset_service/index";
import { assetTransferRouter } from "./asset_transfer/index";
import { dashboardRouter } from "./dashboard/index.route";
import { getAssetById } from "@controllers/asset.detail.controller";
import { requestRoute } from "./product_request";
import { oldDataSync } from "@controllers/old_data_sync/old_sync.controller";
import { authCheck } from "@middlewares/auth.middleware";
import { softwareRoute } from "./software/index";
import { upload } from "@utils/multer";
import { notificationRoute } from "./notification";
import { oldSyncRouter } from "./old_data_sync.route";

export const appRouter = Router();

// Root route for the application
// This can be used to check if the server is running
appRouter.get("/", (req, res) => {
  res.send("Welcome to the Asset Management System API");
});

// Grouping authentication related routes
appRouter.use("/auth", authRouter);
appRouter.use("/access", accessRouter);

// Grouping Super Admin related routes
appRouter.use("/super-admin", superAdminRoute);

// Grouping Catalog related routes
appRouter.use("/catalog", catalogRouter);

// Grouping GR related routes
appRouter.use("/gr", grRoute);
appRouter.use("/asset-mng", assetManagementRoute);
appRouter.use("/report", reportRoute);

// Ticket management
appRouter.use("/tickets", ticketRouter);

//Dashboard
appRouter.use("/dashboard", dashboardRouter);

// Asset service management
appRouter.use("/asset-service", assetServiceRoute);

appRouter.use("/asset-transfer", assetTransferRouter);

appRouter.use("/request", requestRoute);
appRouter.get("/asset/detail/:id", getAssetById);

// Software management
appRouter.use("/software", softwareRoute);

// Old data synchronization
appRouter.use("/old-data-sync", upload.single("file"), authCheck, oldDataSync);
appRouter.use("/sync", oldSyncRouter);

appRouter.use("/ntf", notificationRoute);
