
import { Router } from "express";
import {
getTicketCategories,
getTicketCategoryById,
createTicketCategory,
updateTicketCategory,
deleteTicketCategory
} from "@controllers/ticket/master/ticket.category.controller";
// import { validateCategory } from "@validators/category.validator";
import { validate } from "@middlewares/validate.midlleware";

export const ticketCategoryRouter = Router();


ticketCategoryRouter.get("/", getTicketCategories);


ticketCategoryRouter.get("/:id", getTicketCategoryById);


ticketCategoryRouter.post("/", createTicketCategory);


ticketCategoryRouter.put("/:id", updateTicketCategory);

ticketCategoryRouter.delete("/:id", deleteTicketCategory);
