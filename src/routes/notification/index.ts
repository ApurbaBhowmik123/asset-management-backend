import { Router } from "express";
import { authCheck } from "@middlewares/auth.middleware";
import { notificationRouter } from "./notification.route";
export const notificationRoute = Router();

notificationRoute.use(authCheck);
notificationRoute.use("/notification",notificationRouter );




