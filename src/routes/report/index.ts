import { Router } from "express";
import { authCheck } from "@middlewares/auth.middleware";
import reportrouter from "./report.route";
export const reportRoute = Router();

reportRoute.use(authCheck);
reportRoute.use("/report-query",reportrouter );






