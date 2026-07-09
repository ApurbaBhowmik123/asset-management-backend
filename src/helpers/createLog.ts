import { PrismaClient, Prisma } from "../../prisma/generated/prisma";
import { LogAction } from "@src/enum/enum";
import prisma from "../utils/prisma";


interface LogData {
  action: any;
  userId: number;
  relatedModelType?: string;
  relatedModelId?: number;
  details?: Record<string, any>;
  actionUrl?: string;
}

export const createLog = async ({
  action,
  userId,
  relatedModelType,
  relatedModelId,
  details,
  actionUrl,
}: LogData) => {
  try {
    const log= await prisma.log.create({
      data: {
        action,
        userId,
        relatedModelType: relatedModelType ?? null,
        relatedModelId: relatedModelId ?? null,
        details: details ? JSON.stringify(details) : null,
        actionUrl: actionUrl ?? null,
      },
    });
    
    return log;
  } catch (err) {
    console.error("Failed to create log:", err);
    return false;
  }
};
