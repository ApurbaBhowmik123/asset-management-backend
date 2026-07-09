import { Router } from "express";
import {

    getLastMonthTicketsByDay,

    getLowStockProducts,
    getOpenTicketsByPriority,
    getPendingServiceProducts,
    getReopenTicketsByPriority,
    getSummaryCardsData,
    getTotalProductSummary,
    topTenUsedAndUnusedProducts,
    getDashboardAnalytics
} from "@controllers/dashboard/dashboard.controller";
import { authCheck } from "@middlewares/auth.middleware";


export const dashboardRouter = Router();

dashboardRouter.use(authCheck);

dashboardRouter.get("/summary", getSummaryCardsData);
dashboardRouter.get("/products-usage", topTenUsedAndUnusedProducts);
dashboardRouter.get("/low-stock-products", getLowStockProducts);
dashboardRouter.get("/pending-service-products", getPendingServiceProducts);
dashboardRouter.get("/total-products-summary", getTotalProductSummary)
dashboardRouter.get("/last-month-tickets-by-day", getLastMonthTicketsByDay)
dashboardRouter.get("/open-tickets-by-priority", getOpenTicketsByPriority)
dashboardRouter.get("/reopen-tickets-by-priority", getReopenTicketsByPriority)





dashboardRouter.get("/analytics", getDashboardAnalytics);
