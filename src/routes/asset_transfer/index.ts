import { Router } from "express";
import { transferRouter } from "./transfer.route";
import { acceptRouter } from "./accept.route";
import { cancelRouter } from "./cancel.route";
import { authCheck } from "@src/middleware/auth.middleware";

export const assetTransferRouter = Router();
assetTransferRouter.use(authCheck);

assetTransferRouter.use("/transfer", transferRouter);
assetTransferRouter.use("/accept", acceptRouter);
assetTransferRouter.use("/cancel", cancelRouter);
