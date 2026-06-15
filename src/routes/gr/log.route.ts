import { Router } from "express";
import { getProductLog, getLog,getLogs } from "@controllers/gr/log.controller";
export const logRouter = Router();
logRouter.get("/list/:inventoryProductDetailsId", getLog);
logRouter.get("/report", getLogs);
