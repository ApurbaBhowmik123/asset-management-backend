import { Router } from "express";

import { authCheck } from "@middlewares/auth.middleware";
import { ticketCategoryRouter } from "./ticketCategory";
import { ticketSubCategoryRouter } from "./ticketSubcategory";


export const ticketMasterRouter = Router();

ticketMasterRouter.use(authCheck);

ticketMasterRouter.use("/category", ticketCategoryRouter);
ticketMasterRouter.use("/subcategories", ticketSubCategoryRouter);









