import jwt from "jsonwebtoken";
import { Response } from "express";
import * as dotenv from "dotenv";
import prisma from "../utils/prisma";
dotenv.config();

const jwtSecret: string = process.env.JWT_SECRET || "defaultSecret";

const signToken = (userId: string, role: any) => {
  return jwt.sign(
    {
      data: { id: userId, role: role },
    },
    jwtSecret,
    { expiresIn: "30d" }
  );
};


export const createAndSendToken = (
  user: any,
  statusCode: number,
  res: Response,
  message: string
) => {
  const token = signToken(
    user.id.toString(),
    Array.isArray(user.roles) ? user.roles : [user.roles]
  );
  const JWT_EXPIRES_IN: number = parseInt(
    process.env.JWT_EXPIRES_IN || "1",
    10
  );
  const cookieOptions = {
    expires: new Date(Date.now() + JWT_EXPIRES_IN * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "None",
  };
  res.cookie(token, cookieOptions);
  res.status(statusCode).json({
    status: true,
    token,
    data: user,
    message: message,
  });
};
