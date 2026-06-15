import { successResponse } from "@utils/successResponse";
import { ErrorHandler } from "@utils/ErrorHandler";
import { Request, Response, NextFunction } from "express";
import { createPagedResponse } from "@utils/pagedResponse";
import { createSoftwareLog } from "@utils/software.log";
import { PrismaClient } from "../../../prisma/generated/prisma";
import { generateNextCode } from "@utils/codeGenerator";
import { getSafeString } from "@utils/paramHelper";

const prisma = new PrismaClient();

export const getsoftwares = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || "";
    const sortBy = (req.query.sortBy as string) || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? "asc" : "desc";

    const allowedSortFields = ["name", "uuid", "createdAt", "updatedAt"];
    const finalSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    const searchTerms = search.split(" ");
    const searchConditions = searchTerms.map((term) => ({
      OR: [{ name: { contains: term } }, { uuid: { contains: term } }],
    }));

    const softwares = await prisma.softWare.findMany({
      where: {
        AND: [...(search ? searchConditions : [])],
      },
      take: limit,
      include: {
        createdUser: {
          select: {
            id: true,
            name: true,
          },
        },
        updatedUser: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      skip: (page - 1) * limit,
      orderBy: {
        [finalSortBy]: sortOrder,
      },
    });
    const totalCount = await prisma.softWare.count({
      where: {
        AND: [...(search ? searchConditions : [])],
      },
    });
    return successResponse(
      res,
      200,
      "software list retrieved",
      createPagedResponse(softwares, page, limit, totalCount),
      null
    );
  } catch (error: unknown) {
    return next(
      new ErrorHandler(
        error instanceof Error ? error.message : "Internal Server Error",
        500
      )
    );
  }
};

export const getSoftwareById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const softwareId = parseInt(getSafeString(req.params.id));
    const software = await prisma.softWare.findUnique({
      where: {
        id: softwareId,
      },
      include: {
        createdUser: {
          select: {
            id: true,
            name: true,
          },
        },
        updatedUser: {
          select: {
            id: true,
            name: true,
          },
        },
        softwareLogs: {
          select: {
            id: true,
            action: true,
            createdAt: true,
            updatedAt: true,
            actionDetails: true,
            uuid: true,
            software: {
              select: {
                id: true,
                name: true,
                ExpiryDate: true,
                LicenseType: true,
                IssueDate: true,
              },
            },
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
    if (!software) {
      return next(new ErrorHandler("Software not found", 404));
    }
    return successResponse(res, 200, "Software retrieved", software, null);
  } catch (error) {
    return next(
      new ErrorHandler(
        error instanceof Error ? error.message : "Internal Server Error",
        500
      )
    );
  }
};

export const createSoftware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = parseInt(req?.user?.id ?? "0");
    const {
      name,
      version,
      licenseKey,
      quantity,
      ExpiryDate,
      IssueDate,
      LicenseType,
      activationKey,
    } = req.body;
    const uuid = await generateNextCode(prisma.softWare, "uuid", "SOFT-");
    const newSoftware = await prisma.softWare.create({
      data: {
        uuid,
        name,
        version,
        licenseKey,
        IssueDate,
        ExpiryDate,
        LicenseType,
        activationKey,
        addedQuantity: Number(quantity),
        currentQuantity: Number(quantity),
        createdBy: userId,
        updatedBy: userId,
      },
    });
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
      },
    });
    await createSoftwareLog({
      softwareId: newSoftware.id,
      userId: userId,
      action: "CREATE",
      actionDetails: `Created software with quantity ${quantity} created By ${user?.name}`,
    });
    return successResponse(res, 201, "Software created", newSoftware, null);
  } catch (error) {
    return next(
      new ErrorHandler(
        error instanceof Error ? error.message : "Internal Server Error",
        500
      )
    );
  }
};

export const updateSoftware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const softwareId = parseInt(getSafeString(req.params.id));
    const userId = parseInt(req?.user?.id ?? "0");
    const {
      name,
      version,
      licenseKey,
      quantity,
      ExpiryDate,
      LicenseType,
      IssueDate,
      activationKey,
    } = req.body;
    const softWare = await prisma.softWare.findUnique({
      where: { id: softwareId },
    });
    if (!softWare) {
      return next(new ErrorHandler("Software not found", 404));
    }
    const currentQuantity = softWare.currentQuantity + Number(quantity);
    const updatedSoftware = await prisma.softWare.update({
      where: { id: softwareId },
      data: {
        name,
        version,
        licenseKey,
        ExpiryDate,
        LicenseType,
        IssueDate,
        activationKey,
        addedQuantity: Number(quantity),
        currentQuantity: currentQuantity,
        updatedBy: userId,
      },
    });
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
      },
    });
    await createSoftwareLog({
      softwareId: updatedSoftware.id,
      userId: userId,
      action: "UPDATE",
      actionDetails: `Updated software to ${name} with quantity ${quantity} by ${user?.name}`,
    });

    return successResponse(res, 200, "Software updated", updatedSoftware, null);
  } catch (error) {
    return next(
      new ErrorHandler(
        error instanceof Error ? error.message : "Internal Server Error",
        500
      )
    );
  }
};

export const getAllSoftware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const softwares = await prisma.softWare.findMany({
      select: {
        id: true,
        name: true,
      },
    });
    return successResponse(
      res,
      200,
      "Software list retrieved",
      softwares,
      null
    );
  } catch (error) {
    return next(
      new ErrorHandler(
        error instanceof Error ? error.message : "Internal Server Error",
        500
      )
    );
  }
};

// export const assignSoftware = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const userId = parseInt(req?.user?.id ?? "0");
//     const { assignToUser, softwareIds, quantity } = req.body;
//     const assignments = await Promise.all(
//       softwareIds.map(async (softwareId: number) => {
//         const software = await prisma.softWare.findUnique({
//           where: { id: softwareId },
//         });
//         if (!software) {
//           throw new Error(`Software is not available`);
//         }
//         await prisma.softWare.update({
//           where: { id: softwareId },
//           data: {
//             currentQuantity:
//               software.currentQuantity - (quantity ? Number(quantity) : 1),
//           },
//         });
//         let assignedTo = null;
//         if (assignToUser) {
//           assignedTo = await prisma.user.findUnique({
//             where: { id: Number(assignToUser) },
//           });
//         }
//         const assignedBy = await prisma.user.findUnique({
//           where: { id: userId },
//         });
//         await createSoftwareLog({
//           softwareId: softwareId,
//           userId: userId,
//           action: "ASSIGN",
//           actionDetails: `Assigned software ${software.name} to user ${
//             assignedTo?.name
//           } assigned by ${assignedBy?.name} with quantity ${
//             quantity ? ` ${quantity}` : 1
//           }`,
//         });
//         return prisma.softWareAssignment.create({
//           data: {
//             softwareId,
//             assignedTo: Number(assignToUser),
//             quantity: quantity ? Number(quantity) : 1,
//             assignedBy: userId,
//             status: "ASSIGNED",
//           },
//         });
//       })
//     );
//     return successResponse(res, 200, "Software assigned", assignments, null);
//   } catch (error: unknown) {
//     return next(
//       new ErrorHandler(
//         error instanceof Error ? error.message : "Internal Server Error",
//         500
//       )
//     );
//   }
// };

/**
 * Expects body:
 * {
 *   assignToUser: number,           // target user id
 *   softwareIds: number[],          // final selected software ids (no need to pass deselected ids)
 *   quantity?: number               // optional; same quantity for each newly assigned software (default 1)
 * }
 *
 * Behavior:
 * - Compares target user's current ASSIGNED list vs supplied softwareIds
 * - Assigns newly added (not previously assigned)
 * - Unassigns removed (previously assigned but not in softwareIds)
 */
export const assignSoftware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const actingUserId = Number((req as any)?.user?.id ?? 0);
    const { assignToUser, softwareIds, quantity } = req.body;

    const targetUserId = Number(assignToUser);
    if (!targetUserId || !Array.isArray(softwareIds)) {
      return next(
        new ErrorHandler("assignToUser and softwareIds are required", 400)
      );
    }

    // normalize: unique & ints
    const finalSelectedIds = [
      ...new Set(softwareIds.map((id: any) => Number(id))),
    ];

    // 1) Current active assignments
    const existingAssignments = await prisma.softWareAssignment.findMany({
      where: { assignedTo: targetUserId, status: "ASSIGNED" },
      select: { id: true, softwareId: true, quantity: true },
    });

    const existingIds = new Set(existingAssignments.map((a) => a.softwareId));

    // 2) Diffs
    const toAssign = finalSelectedIds.filter((id) => !existingIds.has(id));
    const toUnassign = existingAssignments.filter(
      (a) => !finalSelectedIds.includes(a.softwareId)
    );

    const qty = Math.max(1, Number(quantity ?? 1));
    const results: Array<{ action: "ASSIGNED" | "UNASSIGNED"; data: any }> = [];

    // 3) Assign new
    for (const softwareId of toAssign) {
      const software = await prisma.softWare.findUnique({
        where: { id: softwareId },
      });
      if (!software)
        throw new Error(`Software with id ${softwareId} not found`);
      // if (software.currentQuantity < qty) {
      //   throw new Error(
      //     `Not enough quantity for ${software.name}. Available: ${software.currentQuantity}, required: ${qty}`
      //   );
      // }

      // batch transaction (fast)
      const [updatedSoftware, assignment] = await prisma.$transaction([
        prisma.softWare.update({
          where: { id: softwareId },
          data: { currentQuantity: { decrement: qty } },
        }),
        prisma.softWareAssignment.create({
          data: {
            softwareId,
            assignedTo: targetUserId,
            quantity: qty,
            assignedBy: actingUserId,
            status: "ASSIGNED",
          },
        }),
      ]);

      // logging OUTSIDE transaction
      createSoftwareLog({
        softwareId,
        userId: actingUserId,
        action: "ASSIGN",
        actionDetails: `Assigned ${qty} of ${software.name} to user ${targetUserId}`,
      }).catch(console.error);

      results.push({ action: "ASSIGNED", data: assignment });
    }

    // 4) Unassign removed
    for (const {
      id: assignmentId,
      softwareId,
      quantity: assignedQty,
    } of toUnassign) {
      const software = await prisma.softWare.findUnique({
        where: { id: softwareId },
      });
      if (!software) continue;

      const [updatedSoftware, updatedAssignment] = await prisma.$transaction([
        prisma.softWare.update({
          where: { id: softwareId },
          data: { currentQuantity: { increment: assignedQty } },
        }),
        prisma.softWareAssignment.update({
          where: { id: assignmentId },
          data: { status: "UNASSIGNED" },
        }),
      ]);

      createSoftwareLog({
        softwareId,
        userId: actingUserId,
        action: "UNASSIGN",
        actionDetails: `Unassigned ${assignedQty} of ${software.name} from user ${targetUserId}`,
      }).catch(console.error);

      results.push({ action: "UNASSIGNED", data: updatedAssignment });
    }

    // 5) Return updated user
    const updatedUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        softAssignedTo: {
          where: { status: "ASSIGNED" },
          include: { software: true },
        },
      },
    });

    return successResponse(
      res,
      200,
      "Software assignment updated",
      {
        actions: results,
        user: updatedUser,
      },
      null
    );
  } catch (error: any) {
    return next(
      new ErrorHandler(error?.message || "Internal Server Error", 500)
    );
  }
};

export const getSoftwareLogs = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || "";
    const sortBy = (req.query.sortBy as string) || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? "asc" : "desc";

    const allowedSortFields = ["softwareId", "uuid", "action", "actionDetails"];
    const finalSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    const searchTerms = search.split(" ");
    const searchConditions = searchTerms.map((term) => ({
      OR: [
        { action: { contains: term } },
        { actionDetails: { contains: term } },
      ],
    }));

    const logs = await prisma.softWareLog.findMany({
      where: {
        AND: [search ? { OR: searchConditions } : {}],
      },
      orderBy: {
        [finalSortBy]: sortOrder,
      },
      take: limit,
      skip: (page - 1) * limit,
      include: {
        user: {
          select: { id: true, name: true },
        },
        software: {
          select: {
            id: true,
            name: true,
            LicenseType: true,
            IssueDate: true,
            ExpiryDate: true,
          },
        },
      },
    });
    const totalCount = await prisma.softWareLog.count({
      where: {
        AND: [search ? { OR: searchConditions } : {}],
      },
    });
    return successResponse(
      res,
      200,
      "Software logs retrieved",
      createPagedResponse(logs, page, limit, totalCount),
      null
    );
  } catch (error) {
    return next(
      new ErrorHandler(
        error instanceof Error ? error.message : "Internal Server Error",
        500
      )
    );
  }
};
