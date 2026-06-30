import { Request, Response, NextFunction } from "express";
import { ErrorHandler } from "../utils/ErrorHandler";
import { createAndSendToken } from "../shared/auth";
import * as bcrypt from "bcrypt";
import prisma from "../utils/prisma";


export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findFirst({
      where: { email },
      include: {
        roles: true,
      },
    });
    if (!user) {
      return next(new ErrorHandler("Invalid email or password", 401));
    }
    if (!user.status) {
      return next(
        new ErrorHandler(
          "Your account has been disabled, please contact admin",
          401
        )
      );
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return next(new ErrorHandler("Invalid email or password", 401));
    }
    const formattedUser: typeof user & { role: string | null; roles?: any } = {
      ...user,
      role: user.roles[0]?.name || null,
      roles: user.roles,
    };
    delete formattedUser.roles;
    createAndSendToken(formattedUser, 200, res, "Login successful");
  } catch (error: unknown) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 400));
    }
    return next(new ErrorHandler("An unknown error occurred", 500));
  }
};
