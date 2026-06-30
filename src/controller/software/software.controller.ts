import { successResponse } from "@utils/successResponse";
import { ErrorHandler } from "@utils/ErrorHandler";
import { Request, Response, NextFunction } from "express";
import { createPagedResponse } from "@utils/pagedResponse";
import { createSoftwareLog } from "@utils/software.log";

import { generateNextCode } from "@utils/codeGenerator";
import { getSafeString } from "@utils/paramHelper";
import prisma from "../../utils/prisma";



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
    const { licenseType } = req.query;
    const whereClause: any = licenseType ? { LicenseType: licenseType as string } : {};
    whereClause.currentQuantity = { gt: 0 };
    const softwares = await prisma.softWare.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        currentQuantity: true,
        LicenseType: true,
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
    const { unitId, locationId, assignToUser, notes, items, expiryDate } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return next(new ErrorHandler("Items array is required", 400));
    }

    if (!unitId && !locationId && !assignToUser) {
      return next(new ErrorHandler("Must specify assignment destination (Unit, Location, or User)", 400));
    }

    const assignedId = await generateNextCode(prisma.softWareAssignment, "assignedId", "mg-sass-");
    
    const results: any[] = [];
    
    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        const { softwareId, quantity } = item;
        const qty = Math.max(1, Number(quantity ?? 1));

        const software = await tx.softWare.findUnique({
          where: { id: Number(softwareId) },
        });

        if (!software) throw new Error(`Software with id ${softwareId} not found`);

        if (software.currentQuantity < qty) {
          throw new Error(
            `Not enough quantity for ${software.name}. Available: ${software.currentQuantity}, requested: ${qty}`
          );
        }

        // decrement quantity
        await tx.softWare.update({
          where: { id: Number(softwareId) },
          data: { currentQuantity: { decrement: qty } },
        });

        // create assignment
        const assignment = await tx.softWareAssignment.create({
          data: {
            assignedId,
            softwareId: Number(softwareId),
            unitId: unitId ? Number(unitId) : null,
            locationId: locationId ? Number(locationId) : null,
            assignedTo: assignToUser ? Number(assignToUser) : null,
            quantity: qty,
            notes: notes || null,
            assignedBy: actingUserId,
            status: "ASSIGNED",
            expiryDate: expiryDate ? new Date(expiryDate) : null
          },
        });

        results.push(assignment);

        let targetStr = "Unknown";
        if (assignToUser) {
          const user = await tx.user.findUnique({ where: { id: Number(assignToUser) } });
          targetStr = user ? `User ${user.name}` : `User ID ${assignToUser}`;
        } else if (unitId) {
          const unit = await tx.unit.findUnique({ where: { id: Number(unitId) } });
          targetStr = unit ? `Unit ${unit.name}` : `Unit ID ${unitId}`;
        } else if (locationId) {
          const loc = await tx.location.findUnique({ where: { id: Number(locationId) } });
          targetStr = loc ? `Location ${loc.name}` : `Location ID ${locationId}`;
        }

        // log
        await tx.softWareLog.create({
          data: {
            softwareId: Number(softwareId),
            userId: actingUserId,
            action: "ASSIGN",
            actionDetails: `Assigned software ${software.name} with quantity ${qty} to ${targetStr} (Assignment ID: ${assignedId})`,
          }
        });
      }
    });

    return successResponse(res, 200, "Software assigned successfully", results, null);
  } catch (error: any) {
    return next(new ErrorHandler(error.message || "Internal Server Error", error.message?.includes("Not enough") ? 400 : 500));
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
    const softwareId = req.query.softwareId ? parseInt(req.query.softwareId as string) : undefined;
    const skip = (page - 1) * limit;

    const whereFilters: any = {};
    if (softwareId) whereFilters.softwareId = softwareId;

    const logs = await prisma.softWareLog.findMany({
      where: whereFilters,
      include: {
        software: true,
        user: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    const totalCount = await prisma.softWareLog.count({ where: whereFilters });

    return successResponse(
      res,
      200,
      "Software Logs retrieved",
      createPagedResponse(logs, page, limit, totalCount),
      null
    );
  } catch (error: any) {
    return next(new ErrorHandler(error.message || "Internal Server Error", 500));
  }
};

export const unassignSoftware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const actingUserId = Number((req as any)?.user?.id ?? 0);
    const { items, unassignmentDate, remarks, condition } = req.body;

    // items should be [{ assignmentId: number, quantity: number }]

    if (!items || !Array.isArray(items) || items.length === 0) {
      return next(new ErrorHandler("Items array is required", 400));
    }

    const results: any[] = [];

    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        const { assignmentId, quantity } = item;
        const unassignQty = Number(quantity);

        const assignment = await tx.softWareAssignment.findUnique({
          where: { id: Number(assignmentId) },
          include: { software: true }
        });

        if (!assignment) throw new Error(`Assignment ${assignmentId} not found`);
        if (assignment.status === "UNASSIGNED") throw new Error(`Assignment ${assignmentId} is already unassigned`);
        if (assignment.quantity < unassignQty) throw new Error(`Cannot unassign more than assigned quantity`);

        // create unassignment record
        const unassignment = await tx.softWareUnAssignment.create({
          data: {
            softwareAssignmentId: assignment.id,
            unassignedQuantity: unassignQty,
            unassignmentDate: new Date(unassignmentDate || Date.now()),
            remarks: remarks || null,
            condition: condition || null,
            createdById: actingUserId,
          }
        });

        // update assignment status and quantity
        const newQty = assignment.quantity - unassignQty;
        await tx.softWareAssignment.update({
          where: { id: assignment.id },
          data: {
            quantity: newQty,
            status: newQty === 0 ? "UNASSIGNED" : "ASSIGNED"
          }
        });

        // restore quantity to software pool
        await tx.softWare.update({
          where: { id: assignment.softwareId },
          data: { currentQuantity: { increment: unassignQty } },
        });

        let targetStr = "Unknown";
        if (assignment.assignedTo) {
          const user = await tx.user.findUnique({ where: { id: assignment.assignedTo } });
          targetStr = user ? `User ${user.name}` : `User ID ${assignment.assignedTo}`;
        } else if (assignment.unitId) {
          const unit = await tx.unit.findUnique({ where: { id: assignment.unitId } });
          targetStr = unit ? `Unit ${unit.name}` : `Unit ID ${assignment.unitId}`;
        } else if (assignment.locationId) {
          const loc = await tx.location.findUnique({ where: { id: assignment.locationId } });
          targetStr = loc ? `Location ${loc.name}` : `Location ID ${assignment.locationId}`;
        }

        // create log
        await tx.softWareLog.create({
          data: {
            softwareId: assignment.softwareId,
            userId: actingUserId,
            action: "UNASSIGN",
            actionDetails: `Unassigned quantity ${unassignQty} from ${targetStr} (Assignment ID: ${assignment.assignedId}). Remarks: ${remarks || 'None'}`,
          }
        });

        results.push(unassignment);
      }
    });

    return successResponse(res, 200, "Software unassigned successfully", results, null);
  } catch (error: any) {
    return next(new ErrorHandler(error.message || "Internal Server Error", 500));
  }
};


export const getAssignSoftwareList = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || "";
    const unitId = req.query.unitId ? parseInt(req.query.unitId as string) : undefined;
    const locationId = req.query.locationId ? parseInt(req.query.locationId as string) : undefined;
    const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
    const licenseType = req.query.licenseType as string;
    const softwareId = req.query.softwareId ? parseInt(req.query.softwareId as string) : undefined;
    const expiryDate = req.query.expiryDate as string;

    const skip = (page - 1) * limit;

    const whereFilters: any = {};
    if (unitId) whereFilters.unitId = unitId;
    if (locationId) whereFilters.locationId = locationId;
    if (userId) whereFilters.assignedTo = userId;
    if (licenseType) whereFilters.software = { ...whereFilters.software, LicenseType: licenseType };
    if (softwareId) whereFilters.softwareId = softwareId;
    if (expiryDate) {
      const expD = new Date(expiryDate);
      whereFilters.expiryDate = { gte: expD, lt: new Date(expD.getTime() + 86400000) };
    }

    const assignments = await prisma.softWareAssignment.findMany({
      where: whereFilters,
      include: {
        software: true,
        assignedUser: true,
        assignedUnit: true,
        assignedLocation: true,
        assignedByUser: true,
      },
      orderBy: { assignedAt: "desc" },
    });

    const groupsMap = new Map();
    for (const a of assignments) {
      if (a.status === "UNASSIGNED" && a.quantity === 0) continue;
      
      const key = a.assignedId || a.id.toString();
      if (!groupsMap.has(key)) {
        groupsMap.set(key, {
          assignedId: key,
          assignedAt: a.assignedAt,
          status: a.status,
          notes: a.notes,
          assignedByUser: a.assignedByUser,
          assignedUser: a.assignedUser,
          assignedUnit: a.assignedUnit,
          assignedLocation: a.assignedLocation,
          products: []
        });
      }
      
      const g = groupsMap.get(key);
      g.products.push({
        id: a.id,
        software: a.software,
        quantity: a.quantity,
      });
    }

    const groupedData = Array.from(groupsMap.values());
    
    const filteredData = search ? groupedData.filter(g => 
      g.assignedId?.includes(search) || 
      g.assignedUser?.name?.toLowerCase().includes(search.toLowerCase()) ||
      g.products.some((p: any) => p.software.name.toLowerCase().includes(search.toLowerCase()))
    ) : groupedData;

    const paginated = filteredData.slice(skip, skip + limit);

    return successResponse(
      res,
      200,
      "Software Assignments retrieved",
      {
        data: paginated,
        pagination: {
          page,
          limit,
          total: filteredData.length,
          totalPages: Math.ceil(filteredData.length / limit),
        },
      },
      null
    );

  } catch (error: any) {
    return next(new ErrorHandler(error.message || "Internal Server Error", 500));
  }
};


export const getUnassignSoftwareList = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || "";
    
    const unassignments = await prisma.softWareUnAssignment.findMany({
      include: {
        softwareAssignment: {
          include: {
            software: true,
            assignedUser: true,
            assignedUnit: true,
            assignedLocation: true,
          }
        },
        createdBy: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const skip = (page - 1) * limit;

    const filteredData = search ? unassignments.filter((u: any) => 
      u.softwareAssignment?.assignedId?.includes(search) || 
      u.softwareAssignment?.software?.name?.toLowerCase().includes(search.toLowerCase())
    ) : unassignments;

    const paginated = filteredData.slice(skip, skip + limit);

    return successResponse(
      res,
      200,
      "Software Unassignments retrieved",
      {
        data: paginated,
        pagination: {
          page,
          limit,
          total: filteredData.length,
          totalPages: Math.ceil(filteredData.length / limit),
        },
      },
      null
    );

  } catch (error: any) {
    return next(new ErrorHandler(error.message || "Internal Server Error", 500));
  }
};


export const deleteSoftware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const actingUserId = Number((req as any)?.user?.id ?? 0);
    const softwareId = parseInt(req.params.id as string);

    const software = await prisma.softWare.findUnique({
      where: { id: softwareId }
    });

    if (!software) throw new Error("Software not found");

    // create log before deleting
    await prisma.softWareLog.create({
      data: {
        softwareId: software.id,
        userId: actingUserId,
        action: "DELETE",
        actionDetails: `Deleted software ${software.name}`,
      }
    });

    await prisma.softWare.delete({
      where: { id: softwareId }
    });

    return successResponse(res, 200, "Software deleted successfully", null, null);
  } catch (error: any) {
    return next(new ErrorHandler(error.message || "Internal Server Error", 500));
  }
};


export const getLicenseTypes = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const types = await prisma.softWare.findMany({
      select: { LicenseType: true },
      distinct: ['LicenseType'],
    });
    const licenseTypes = types.map(t => t.LicenseType).filter(Boolean);
    return successResponse(res, 200, "License types retrieved", licenseTypes, null);
  } catch (error) {
    return next(
      new ErrorHandler(
        error instanceof Error ? error.message : "Internal Server Error",
        500
      )
    );
  }
};

