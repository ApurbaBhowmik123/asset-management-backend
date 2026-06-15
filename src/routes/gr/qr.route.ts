import { Router } from "express";
import { getQrList } from "@controllers/gr/qr.controller";
import { hasPermission } from "@middlewares/permission.middleware";
export const qrRouter = Router();
qrRouter.get("/qr-list", getQrList);
