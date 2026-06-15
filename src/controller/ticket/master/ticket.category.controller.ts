import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "../../../../prisma/generated/prisma";
import { successResponse } from "../../../utils/successResponse";
import { ErrorHandler } from "../../../utils/ErrorHandler";
import { createPagedResponse } from "../../../utils/pagedResponse";
import { generateNextCode } from "../../../utils/codeGenerator";

const prisma = new PrismaClient();

export const getTicketCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const type = req.query.type as string; 
    const sortBy = (req.query.sortBy as string) || "createdAt";
    const sortOrder =
      (req.query.sortOrder as string) === "asc" ? "asc" : "desc";

    const allowedSortFields = ["name", "createdAt"];
    const finalSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";


    const whereClause: any = {};
    if (search) {
      whereClause.OR = [{ name: { contains: search, mode: "insensitive" } }];
    }
    if (type) {
      whereClause.type = type;
    }

    const total = await prisma.ticketCategory.count({ where: whereClause });

    const categories = await prisma.ticketCategory.findMany({
      where: whereClause,
      orderBy: { [finalSortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        subcategories: true,
      },
    });

    const paged = createPagedResponse(categories, page, limit, total);
    return successResponse(
      res,
      200,
      "Ticket categories fetched successfully",
      paged,
      null
    );
  } catch (error: unknown) {
    if (error instanceof Error)
      return next(new ErrorHandler(error.message, 400));
    return next(new ErrorHandler("An unknown error occurred", 500));
  }
};


export const getTicketCategoryById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const category = await prisma.ticketCategory.findUnique({
      where: { id: Number(id) },
      include: { subcategories: true },
    });

    if (!category)
      return next(new ErrorHandler("Ticket category not found", 404));

    return successResponse(
      res,
      200,
      "Ticket category fetched successfully",
      category,
      null
    );
  } catch (error: unknown) {
    if (error instanceof Error)
      return next(new ErrorHandler(error.message, 400));
    return next(new ErrorHandler("An unknown error occurred", 500));
  }
};

export const createTicketCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { type, name, description } = req.body;

    const existing = await prisma.ticketCategory.findFirst({ where: { name } });
    if (existing)
      return next(
        new ErrorHandler(`Category name "${name}" already exists`, 409)
      );

    const uuid = await generateNextCode(prisma.ticketCategory, "uuid", "TC");

    const newCategory = await prisma.ticketCategory.create({
      data: { uuid, type, name, description },
    });

    return successResponse(
      res,
      201,
      "Ticket category created successfully",
      newCategory,
      null
    );
  } catch (error: unknown) {
    if (error instanceof Error)
      return next(new ErrorHandler(error.message, 400));
    return next(new ErrorHandler("An unknown error occurred", 500));
  }
};

export const updateTicketCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { name, type, description } = req.body;

    const findCategory = await prisma.ticketCategory.findUnique({
      where: { id: Number(id) },
    });
    if (!findCategory)
      return next(new ErrorHandler("Ticket category not found", 404));

    const existing = await prisma.ticketCategory.findFirst({
      where: { name, NOT: { id: Number(id) } },
    });
    if (existing)
      return next(new ErrorHandler("Category name already exists", 409));

    const category = await prisma.ticketCategory.update({
      where: { id: Number(id) },
      data: {
        type,
        name,
        description,
      },
    });

    return successResponse(
      res,
      200,
      "Ticket category updated successfully",
      category,
      null
    );
  } catch (error: unknown) {
    if (error instanceof Error)
      return next(new ErrorHandler(error.message, 400));
    return next(new ErrorHandler("An unknown error occurred", 500));
  }
};

export const deleteTicketCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const category = await prisma.ticketCategory.findUnique({
      where: { id: Number(id) },
    });
    if (!category)
      return next(new ErrorHandler("Ticket category not found", 404));
    await prisma.ticketSubcategory.deleteMany({
      where: { categoryId: Number(id) },
    });

    await prisma.ticketCategory.delete({ where: { id: Number(id) } });

    return successResponse(
      res,
      200,
      "Ticket category deleted successfully",
      null,
      null
    );
  } catch (error: unknown) {
    if (error instanceof Error)
      return next(new ErrorHandler(error.message, 400));
    return next(new ErrorHandler("An unknown error occurred", 500));
  }
};
