import { Router } from "express";
import {
  getTickets,
  getTicketById,
  createTicket,
  closeTicket,
  getSupportEngineerByUnit,
  assignedSupport,
  rejectTicket,
  serviceCheck,
  getTicketByTicketId,
  updateTicket,
  unassignedTickets,
  selfAssignTicket,
} from "@controllers/ticket/ticket.controller";
import { validateCreateTicket, validateUpdateTicket } from "@validators/ticket.validator";
import { validate } from "@middlewares/validate.midlleware";
import { authCheck } from "@middlewares/auth.middleware";
import { upload } from "@utils/multer";
import { ticketReport } from "@src/controller/ticket/ticket.report.controller";
import { ticketMasterRouter } from "./master/index.route";

export const ticketRouter = Router();

ticketRouter.use(authCheck);


ticketRouter.use('/master', ticketMasterRouter)

ticketRouter.get("/support-lists/:unitId", getSupportEngineerByUnit);

ticketRouter.get("/", getTickets);

ticketRouter.get("/unassigned-tickets", unassignedTickets);

ticketRouter.put("/:id/self-assign", selfAssignTicket);

ticketRouter.get("/reports", ticketReport);

ticketRouter.get("/find/:id", getTicketById);

ticketRouter.get("/find-by-ticket-id/:uuid", getTicketByTicketId);

ticketRouter.put("/update-details", updateTicket);
  
ticketRouter.post("/create", validateCreateTicket, validate, upload.fields([{ name: "attachment", maxCount: 100 }]), createTicket);

ticketRouter.post("/assign", assignedSupport);

ticketRouter.post("/service-check", serviceCheck);

ticketRouter.post("/reject", rejectTicket);

ticketRouter.put("/close", closeTicket);









