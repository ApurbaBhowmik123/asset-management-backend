import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "../../prisma/generated/prisma";

import * as dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();
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

