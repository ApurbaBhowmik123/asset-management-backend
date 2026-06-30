interface softwareLog {
  softwareId: number;
  userId: number;
  action: string;
  actionDetails: string;
}
import { generateUniqueId } from "./randomNumberGenerator";
import prisma from "../utils/prisma";

export const createSoftwareLog = (log: softwareLog) => {
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
