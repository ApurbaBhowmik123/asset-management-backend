import { Router } from "express";
import { hasPermission } from "@middlewares/permission.middleware";
import { reportGet, Reportgetall, getAssetWarrantyList } from "@src/controller/report/report.controller";
const reportrouter = Router();

reportrouter.get("/report-get",hasPermission('read-report'), reportGet);
reportrouter.get("/report-get-all",hasPermission('read-report'), Reportgetall);

reportrouter.get("/asset-warranty", getAssetWarrantyList);

export default reportrouter;