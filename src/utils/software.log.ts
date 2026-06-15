import { PrismaClient } from "../../prisma/generated/prisma";
interface softwareLog {
  softwareId: number;
  userId: number;
  action: string;
  actionDetails: string;
}
import { generateUniqueId } from "./randomNumberGenerator";

export const createSoftwareLog = (log: softwareLog) => {
  const prisma = new PrismaClient();
  return prisma.softWareLog.create({
    data: {
      uuid: generateUniqueId(),
      softwareId: log.softwareId,
      userId: log.userId,
      action: log.action,
      actionDetails: log.actionDetails,
    },
  });
};
