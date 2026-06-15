import { Router } from "express";
import { authCheck } from "@middlewares/auth.middleware";
import { upcomingServiceRouter } from "./upcoming_service.route";
import { pendingServiceRouter } from "./pending_service.route";
import { serviceRouter } from "./service.route";

export const assetServiceRoute = Router();
assetServiceRoute.use(authCheck);
assetServiceRoute.use("/upcoming-service", upcomingServiceRouter);
assetServiceRoute.use("/pending-service", pendingServiceRouter);
assetServiceRoute.use("/", serviceRouter);

