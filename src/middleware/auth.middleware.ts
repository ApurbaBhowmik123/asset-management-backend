import { Request, Response, NextFunction } from "express";
import { ErrorHandler } from "../utils/ErrorHandler";
import { isBlacklisted } from "../utils/tokenBlackList";
import jwt from "jsonwebtoken";
import * as dotenv from "dotenv";
import prisma from "../utils/prisma";

dotenv.config();


export const authCheck = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let token = null;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (!token || isBlacklisted(token)) {
      return next(
        new ErrorHandler(
          "You are not logged in, please login to app first",
          401
        )
      );
    }
    const jwtsecret: string = process.env.JWT_SECRET || "defaultSecret";

    const decoded: any = jwt.verify(token, jwtsecret, async (err, decoded) => {
      if (err) {
        return next(new ErrorHandler(" please login first", 401));
      } else {
        const { data } = decoded as { data: { id: string; roles: string[] } };

        const currentUser = await prisma.user.findUnique({
          where: { id: Number(data.id) },
        });
        if (!currentUser) {
          return next(new ErrorHandler("User no longer exists", 401));
        } else {
          req.user = { id: data.id, role: data.roles };
          next();
        }
      }
    });
  } catch (err: unknown) {
    if (err instanceof Error) {
      next(new ErrorHandler(err.message, 400));
    } else {
      next(new ErrorHandler("An unknown error occurred", 500));
    }
  }
};
