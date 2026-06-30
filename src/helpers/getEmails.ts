import { Roles } from "@src/enum/enum";
import prisma from "../utils/prisma";

export const getAdminEmails = async (unitId: number | null) => {
  if (!unitId) return [];

  const admins = await prisma.user.findMany({
    where: {
      unitId,
      roles: {
        some: {
          name: { in: [Roles.SUPPORT_ADMIN] },
        },
      },
    },
    select: { email: true },
  });

  return admins
    .map((admin) => admin.email)
    .filter((email): email is string => Boolean(email));
};


export const getSupporAdmintUnitAdminEmails = async (unitId: number | null) => {
  if (!unitId) return [];

  const admins = await prisma.user.findMany({
    where: {
      unitId,
      roles: {
        some: {
          name: { in: [Roles.SUPPORT_ADMIN, Roles.UNIT_ADMIN] },
        },
      },
    },
    select: { email: true },
  });

  return admins
    .map((admin) => admin.email)
    .filter((email): email is string => Boolean(email));
};




export const getSupportEngineerEmails = async (unitId: number | null) => {
  if (!unitId) return [];

  const engineers = await prisma.user.findMany({
    where: {
      unitId,
      roles: {
        some: {
          name: { in: [Roles.SUPPORT_ENGINEER] },
        },
      },
    },
    select: { email: true },
  });

  return engineers
    .map((eng) => eng.email)
    .filter((email): email is string => Boolean(email));
};