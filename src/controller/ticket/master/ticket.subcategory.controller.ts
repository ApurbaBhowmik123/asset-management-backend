import { Request, Response, NextFunction } from "express";
import { successResponse } from "../../../utils/successResponse";
import { ErrorHandler } from "../../../utils/ErrorHandler";
import { createPagedResponse } from "../../../utils/pagedResponse";
import { generateNextCode } from "../../../utils/codeGenerator";
import prisma from "../../../utils/prisma";



export const getTicketSubcategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { categoryId } = req.query;

    const whereClause: any = {};
    if (categoryId) whereClause.categoryId = Number(categoryId);

    const subcategories = await prisma.ticketSubcategory.findMany({
      where: whereClause,
      include: { category: true },
    });

    return successResponse(res, 200, "Ticket subcategories fetched successfully", subcategories, null);
  } catch (error: unknown) {
    if (error instanceof Error) return next(new ErrorHandler(error.message, 400));
    return next(new ErrorHandler("An unknown error occurred", 500));
  }
};
export const getTicketSubCategoryById = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const subcategory = await prisma.ticketSubcategory.findUnique({ 
      where: { id: Number(id) },
     
    });

    if (!subcategory) return next(new ErrorHandler("Ticket subcategory not found", 404));

    return successResponse(res, 200, "Ticket subcategory fetched successfully", subcategory, null);
  } catch (error: unknown) {
    if (error instanceof Error) return next(new ErrorHandler(error.message, 400));
    return next(new ErrorHandler("An unknown error occurred", 500));
  }
};
export const createTicketSubcategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, categoryId } = req.body;

    const existing = await prisma.ticketSubcategory.findFirst({
      where: { name, categoryId },
    });
    if (existing) return next(new ErrorHandler(`Subcategory "${name}" already exists in this category`, 409));

    const uuid = await generateNextCode(prisma.ticketSubcategory, "uuid", "TSC");

    const newSubcategory = await prisma.ticketSubcategory.create({
      data: { uuid, name, description, categoryId: Number(categoryId) },
    });

    return successResponse(res, 201, "Ticket subcategory created successfully", newSubcategory, null);
  } catch (error: unknown) {
    if (error instanceof Error) return next(new ErrorHandler(error.message, 400));
    return next(new ErrorHandler("An unknown error occurred", 500));
  }
};

export const updateTicketSubcategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, description, categoryId } = req.body;

    const findSubcategory = await prisma.ticketSubcategory.findUnique({ where: { id: Number(id) } });
    if (!findSubcategory) return next(new ErrorHandler("Ticket subcategory not found", 404));

    const existing = await prisma.ticketSubcategory.findFirst({
      where: { name, categoryId: Number(categoryId), NOT: { id: Number(id) } },
    });
    if (existing) return next(new ErrorHandler("Subcategory name already exists in this category", 409));

    const subcategory = await prisma.ticketSubcategory.update({
      where: { id: Number(id) },
      data: { name, description, categoryId: Number(categoryId) },
    });

    return successResponse(res, 200, "Ticket subcategory updated successfully", subcategory, null);
  } catch (error: unknown) {
    if (error instanceof Error) return next(new ErrorHandler(error.message, 400));
    return next(new ErrorHandler("An unknown error occurred", 500));
  }
};

export const deleteTicketSubcategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const subcategory = await prisma.ticketSubcategory.findUnique({ where: { id: Number(id) } });
    if (!subcategory) return next(new ErrorHandler("Ticket subcategory not found", 404));

    await prisma.ticketSubcategory.delete({ where: { id: Number(id) } });

    return successResponse(res, 200, "Ticket subcategory deleted successfully", null, null);
  } catch (error: unknown) {
    if (error instanceof Error) return next(new ErrorHandler(error.message, 400));
    return next(new ErrorHandler("An unknown error occurred", 500));
  }
};
