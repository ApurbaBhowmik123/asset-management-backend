import { Request, Response, NextFunction } from "express";

import * as dotenv from "dotenv";
import prisma from "../utils/prisma";

dotenv.config();

export const createNotification = async (
  userId: number | null,

  text: string,
  transactionLink: string
) => {
  try {
    await prisma.notification.create({
      data: {
        userId : Number(userId),
    
        text,
        transactionLink,
      },
    });
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};

