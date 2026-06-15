import { Router } from "express";
import {
  getInventory,
  getInventoryById,
  updateGrInventory,
  deleteGrInventory,
  getInventoryByStatus,
  allAsset,
  getInventorySummary,
} from "@controllers/gr/inventory.controller";
export const inventoryRouter = Router();
import { hasPermission } from "@src/middleware/permission.middleware";

inventoryRouter.get("/list", hasPermission("read-inventory"), getInventory);

inventoryRouter.get(
  "/summary",
  hasPermission("read-inventory"),
  getInventorySummary
);

inventoryRouter.get(
  "/filter/:status",
  hasPermission("read-inventory"),
  getInventoryByStatus
);

inventoryRouter.get(
  "/details/:id",
  hasPermission("read-inventory"),
  getInventoryById
);

inventoryRouter.put(
  "/update/:id",
  hasPermission("update-inventory"),
  updateGrInventory
);

inventoryRouter.delete(
  "/delete/:id",
  hasPermission("delete-inventory"),
  deleteGrInventory
);

inventoryRouter.post("/all-assets", hasPermission("read-inventory"), allAsset);
