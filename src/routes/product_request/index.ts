import { Router } from "express";
import { authCheck } from "@middlewares/auth.middleware";
import { requestRouter } from "./productrequest.router";
import { softDeleteRouter } from "./soft_delete.route";
import { eWasteRouter } from "./e_waste.route";

export const requestRoute = Router();

requestRoute.use(authCheck);
requestRoute.use("/request-product", requestRouter);
requestRoute.use("/soft-delete", softDeleteRouter);
requestRoute.use("/e-waste", eWasteRouter);
