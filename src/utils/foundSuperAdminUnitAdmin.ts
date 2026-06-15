import { PrismaClient } from "../../prisma/generated/prisma";
const prisma = new PrismaClient();
export const foundSuperAdminUnitAdmin = async (
  unitId: number,
  isReturnSuperAdmin: boolean = true
) => {
  let emailList: string[] = [];
  if (isReturnSuperAdmin) {
    const superAdmins = await prisma.user.findMany({
      where: {
        roles: {
          some: { name: "Super Admin" },
        },
        status: true,
      },

      select: {
        email: true,
        roles: {
          select: { name: true },
        },
      },
    });
    emailList.push(
      ...superAdmins
        .map((admin) => admin.email)
        .filter((email): email is string => email !== null)
    );
  }
  const unitAdmins = await prisma.user.findMany({
    where: {
      roles: {
        some: { name: "Unit Admin" },
      },
      unitId: Number(unitId),
      status: true,
    },
    select: {
      email: true,
      roles: {
        select: { name: true },
      },
    },
  });
  emailList.push(
    ...unitAdmins
      .map((admin) => admin.email)
      .filter((email): email is string => email !== null)
  );
  return emailList;
};
