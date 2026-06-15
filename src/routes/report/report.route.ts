import { Router } from "express";
import { hasPermission } from "@middlewares/permission.middleware";
import { reportGet, Reportgetall } from "@src/controller/report/report.controller";
const reportrouter = Router();

reportrouter.get("/report-get",hasPermission('read-report'), reportGet);
reportrouter.get("/report-get-all",hasPermission('read-report'), Reportgetall);

export default reportrouter;