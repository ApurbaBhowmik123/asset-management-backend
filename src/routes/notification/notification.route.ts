import { Router } from "express";
export const notificationRouter = Router();
import { hasPermission } from "@middlewares/permission.middleware";
import { markAsRead, notificationGet } from "@src/controller/notification/notification.controller";

notificationRouter.get("/notification-get", notificationGet);
notificationRouter.put("/mark-as-read", markAsRead);



