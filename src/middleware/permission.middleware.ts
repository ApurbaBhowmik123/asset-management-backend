import { Request, Response, NextFunction } from "express";
import { ErrorHandler } from "../utils/ErrorHandler";
import { PrismaClient } from "../../prisma/generated/prisma";

const prisma = new PrismaClient();

export const hasPermission = (requiredPermissionSlug: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Make sure user is authenticated
      if (!req.user || !req.user.id) {
        return next(
          new ErrorHandler(
            "You are not logged in, please login to app first",
            401
          )
        );
      }
      // Fetch user details including roles and permissions
      const user = await prisma.user.findUnique({
        where: { id: Number(req.user.id) },
        include: {
          roles: {
            include: {
              permissions: true,
            },
          },
        },
      });

      if (!user) {
        return next(new ErrorHandler("User no longer exists", 401));
      }

      // Check if user has the required permission through any of their roles
      const hasRequiredPermission = user.roles.some((role) =>
        role.permissions.some(
          (permission) => permission.slug === requiredPermissionSlug
        )
      );

      if (!hasRequiredPermission) {
        return next(
          new ErrorHandler(
            `Access denied! You don't have permission: ${requiredPermissionSlug}`,
            403
          )
        );
      }
      // User has the required permission, proceed to the next middleware
      next();
    } catch (error) {
      if (error instanceof Error) {
        next(new ErrorHandler(error.message, 400));
      } else {
        next(new ErrorHandler("An unknown error occurred", 500));
      }
    }
  };
};
