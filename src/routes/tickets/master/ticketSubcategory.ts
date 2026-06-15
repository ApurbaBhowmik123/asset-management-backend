
import { Router } from "express";
import {
    createTicketSubcategory,
    deleteTicketSubcategory,
getTicketSubcategories,
getTicketSubCategoryById,
updateTicketSubcategory,

} from "@controllers/ticket/master/ticket.subcategory.controller";
// import { validateCategory } from "@validators/category.validator";
import { validate } from "@middlewares/validate.midlleware";

export const ticketSubCategoryRouter = Router();


ticketSubCategoryRouter.get("/", getTicketSubcategories);


ticketSubCategoryRouter.get("/:id", getTicketSubCategoryById);


ticketSubCategoryRouter.post("/", createTicketSubcategory);


ticketSubCategoryRouter.put("/:id", updateTicketSubcategory);

ticketSubCategoryRouter.delete("/:id", deleteTicketSubcategory);
