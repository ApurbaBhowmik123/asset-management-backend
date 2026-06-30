import { Request, Response, NextFunction } from "express";
import { successResponse } from "../../utils/successResponse";
import { ErrorHandler } from "../../utils/ErrorHandler";
import { createPagedResponse } from "../../utils/pagedResponse";
import * as dotenv from "dotenv";
import { Roles, TicketPriority } from "@src/enum/enum";
import prisma from "../../utils/prisma";

dotenv.config();

export const ticketReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const sortBy = (req.query.sortBy as string) || "createdAt";
    const sortOrder = (req.query.sortOrder as string) === "asc" ? "asc" : "desc";
    const status = req.query.status as string;
    const priority = req.query.priority as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    const hasRating = req.query.hasRating as string;
    const minRating = req.query.minRating as string;
    const maxRating = req.query.maxRating as string;
    const unitId = req.query.unitId as string;
    const costRange = req.query.cost as string;

    let minCost: number | undefined;
    let maxCost: number | undefined;
    if (costRange) {
      const [minStr, maxStr] = costRange.split('-');
      minCost = minStr ? Number(minStr) : undefined;
      maxCost = maxStr ? Number(maxStr) : undefined;

      if ((minCost !== undefined && isNaN(minCost)) || (maxCost !== undefined && isNaN(maxCost))) {
        return next(new ErrorHandler("Invalid cost range values", 400));
      }
    }

    const allowedSortFields = ["subjectLine", "status", "priority", "createdAt", "completedAt", "ratings"];
    const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";

    const currentUser = await prisma.user.findUnique({
      where: { id: Number(req?.user?.id) },
      include: { roles: true, unit: true },
    });

    if (!currentUser) return next(new ErrorHandler("User not found", 404));

    const isSuperAdmin = currentUser.roles.some(role => role.name === Roles.SUPER_ADMIN);
    const isUser = currentUser.roles.some(role => role.name === Roles.USER);
    const isSupportEngineer = currentUser.roles.some(role => role.name === Roles.SUPPORT_ENGINEER);

    const whereClause: any = {
      ...(search && {
        OR: [
          { subjectLine: { contains: search, mode: "insensitive" } },
          { uuid: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    if (status) whereClause.status = status;
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = new Date(startDate);
      if (endDate) whereClause.createdAt.lte = new Date(endDate);
    }
    if (hasRating === "true") whereClause.ratings = { not: null };
    else if (hasRating === "false") whereClause.ratings = null;
    if (minRating || maxRating) {
      whereClause.ratings = {};
      if (minRating) whereClause.ratings.gte = parseFloat(minRating);
      if (maxRating) whereClause.ratings.lte = parseFloat(maxRating);
    }

    if (minCost !== undefined || maxCost !== undefined) {
      whereClause.ticketAssets = {
        some: {
          repairCost: {
            ...(minCost !== undefined && { gte: minCost }),
            ...(maxCost !== undefined && { lte: maxCost }),
          },
        },
      };
    }

    if (!isSuperAdmin) {
      if (isSupportEngineer) whereClause.OR = [{ supportEngineerId: currentUser.id }];
      else if (isUser) whereClause.OR = [{ userId: currentUser.id }];
      else whereClause.createdBy = { unitId: currentUser.unitId };
    }

    if (unitId) {
      whereClause.unitId = Number(unitId);
    }

    const ticketsRaw = await prisma.ticket.findMany({
      where: whereClause,
      orderBy: { [finalSortBy]: sortOrder },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true, email: true } },
        supportEngineer: { select: { id: true, name: true, email: true } },
        ticketAssets: {
          include: {
            asset: { select: { id: true, uuid: true, serialNo1: true, serialNo2: true } },
          },
        },
      },
    });

    const ticketsWithCost = ticketsRaw.map((ticket) => {
      const totalCost = Array.isArray(ticket.ticketAssets) && ticket.ticketAssets.length > 0
        ? ticket.ticketAssets.reduce((sum, asset) => sum + (asset.repairCost ?? 0), 0)
        : 0;
      return {
        ...ticket,
        cost: totalCost > 0 ? totalCost : null,
      };
    });

  
    let tickets = ticketsWithCost;
    if (priority && ["High", "Medium", "Low"].includes(priority)) {
      const slaHours = TicketPriority[priority as keyof typeof TicketPriority];
      tickets = ticketsWithCost.filter((ticket) => {
        if (ticket.priority !== priority) return false;
        if (!ticket.completedAt) return false;
        const elapsedHours = (ticket.completedAt.getTime() - ticket.createdAt.getTime()) / (1000 * 60 * 60);
        return elapsedHours > slaHours;
      });
    }

    const totalCount = tickets.length;
    const pagedTickets = tickets.slice((page - 1) * limit, page * limit);
    const paged = createPagedResponse(pagedTickets, page, limit, totalCount);

    return successResponse(res, 200, "Tickets fetched successfully", paged, null);

  } catch (error: unknown) {
    if (error instanceof Error) return next(new ErrorHandler(error.message, 400));
    return next(new ErrorHandler("An unknown error occurred", 500));
  }
};
