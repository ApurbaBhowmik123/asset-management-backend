import { successResponse } from "@utils/successResponse";
import { Request, Response, NextFunction } from "express";
import { ErrorHandler } from "@utils/ErrorHandler";
import { PrismaClient } from "../../../prisma/generated/prisma";
const prisma = new PrismaClient();

export const notificationCount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {

    if (!req.user || !(req as any).user.id) {
      return next(new ErrorHandler("Unauthorized", 401));      
    }

    const userId = (req as any).user.id;

    const count = await prisma.notification.count({
      where: {
        userId,
        isRead: false, 
      },
    });

    return successResponse(res,200,"Notification count fetched successfully",count,null);
  } 

  catch (error) {
  
    console.error("Error in notificationCount:", error);
  
    return next(
      new ErrorHandler(
        error instanceof Error ? error.message : "Internal Server Error",
        500
      )
    );
  
  }

};


export const notificationGet = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user || !(req as any).user.id) {
      return next(new ErrorHandler("Unauthorized", 401));
    }

    const userId = Number((req as any).user.id);

    if (isNaN(userId)) {
      return next(new ErrorHandler("Invalid user id", 400));
    }

    const page = parseInt((req.query.page as string) || "1");
    const limit = parseInt((req.query.limit as string) || "10");
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId , isRead:false},
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where: { userId } }),
    ]);

    const pagination = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };

    return successResponse(
      res,
      200,
      "Notifications fetched successfully",
      notifications,
      pagination
    );
  } catch (error) {
    console.error("Error in notificationGet:", error);
    return next(
      new ErrorHandler(
        error instanceof Error ? error.message : "Internal Server Error",
        500
      )
    );
  }
};

export const markAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user || !(req as any).user.id) {
      return next(new ErrorHandler("Unauthorized", 401));
    }

    const userId = Number((req as any).user.id);
    if (isNaN(userId)) {
      return next(new ErrorHandler("Invalid user id", 400));
    }

    const { ids } = req.body;

    if (Array.isArray(ids) && ids.length > 0) {
      await prisma.notification.updateMany({
        where: {
          id: { in: ids.map((id: any) => Number(id)) },
          userId: userId,
        },
        data: {
          isRead: true,
        },
      });
    } else {
      return next(new ErrorHandler("No notification ids provided", 400));
    }

    return successResponse(
      res,
      200,
      "Notifications marked as read successfully",
      [],
      null
    );
  } catch (error) {
    console.error("Error in markAsRead:", error);
    return next(
      new ErrorHandler(
        error instanceof Error ? error.message : "Internal Server Error",
        500
      )
    );
  }
};


