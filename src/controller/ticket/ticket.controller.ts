import { Request, Response, NextFunction } from "express";
import { successResponse } from "../../utils/successResponse";
import { ErrorHandler } from "../../utils/ErrorHandler";
import { createPagedResponse } from "../../utils/pagedResponse";
import { generateNextCode } from "../../utils/codeGenerator";
import { AssetStatus, LogAction, Roles, TicketStatus } from "@src/enum/enum";
import { uploadFiles } from "@src/helpers/uploadFiles";
import * as dotenv from "dotenv";
import { createLog } from "@src/helpers/createLog";
import { createLogReport } from "@src/utils/logReport";
import { ticketCreatedTemplate } from "@src/emails/tickets/ticket-create.template";
import { sendTicketEmail } from "@src/utils/mail";
import { ticketAssignedTemplate } from "@src/emails/tickets/ticket-support-assigned.template";
import { serviceCheckCompletedTemplate } from "@src/emails/tickets/tcket-service-check.template";
import { ticketRejectedTemplate } from "@src/emails/tickets/ticket-reject.template";
import { createNotification } from "@src/helpers/createNotification";
import {
  getAdminEmails,
  getSupporAdmintUnitAdminEmails,
  getSupportEngineerEmails,
} from "@src/helpers/getEmails";
import { ticketClosedTemplate } from "@src/emails/tickets/ticket-closed-template";
import { getSafeString } from "@src/utils/paramHelper";
import prisma from "../../utils/prisma";
dotenv.config();


export const getTickets = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const sortBy = (req.query.sortBy as string) || "createdAt";
    const sortOrder =
      (req.query.sortOrder as string) === "asc" ? "asc" : "desc";

    const allowedSortFields = [
      "subjectLine",
      "status",
      "priority",
      "createdAt",
    ];
    const finalSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    const currentUser = await prisma.user.findUnique({
      where: { id: Number(req?.user?.id) },
      include: { roles: true, unit: true },
    });

    if (!currentUser) {
      return next(new ErrorHandler("User not found", 404));
    }

    const isSuperAdmin = currentUser.roles.some(
      (role) => role.name === Roles.SUPER_ADMIN
    );
    const isUser = currentUser.roles.some((role) => role.name === Roles.USER);
    const isSupportEngineer = currentUser.roles.some(
      (role) => role.name === Roles.SUPPORT_ENGINEER
    );

    // build where clause
    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { subjectLine: { contains: search } }, // ❌ removed "mode"
        { uuid: { contains: search } }, // ❌ removed "mode"
      ];
    }

    if (req.query.status) {
      whereClause.status = req.query.status;
    }

    if (isSuperAdmin) {
      // no extra filter
    } else if (isSupportEngineer) {
      whereClause.supportEngineerId = currentUser.id;
    } else if (isUser) {
      whereClause.userId = currentUser.id;
    } else {
      whereClause.unitId = currentUser.unitId;
    }

    // ✅ Correct usage of count()
    const totalCount = await prisma.ticket.count({ where: whereClause });

    const tickets = await prisma.ticket.findMany({
      where: whereClause,
      orderBy: { [finalSortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true, email: true } },
        supportEngineer: { select: { id: true, name: true, email: true } },
        ticketAssets: {
          include: {
            asset: {
              select: {
                id: true,
                uuid: true,
                serialNo1: true,
                serialNo2: true,
              },
            },
          },
        },
      },
    });

    const paged = createPagedResponse(tickets, page, limit, totalCount);

    return successResponse(
      res,
      200,
      "Tickets fetched successfully",
      paged,
      null
    );
  } catch (error: unknown) {
    if (error instanceof Error)
      return next(new ErrorHandler(error.message, 400));
    return next(new ErrorHandler("An unknown error occurred", 500));
  }
};

export const unassignedTickets = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const sortBy = (req.query.sortBy as string) || "createdAt";
    const sortOrder =
      (req.query.sortOrder as string) === "asc" ? "asc" : "desc";

    const allowedSortFields = [
      "subjectLine",
      "status",
      "priority",
      "createdAt",
    ];
    const finalSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    const currentUser = await prisma.user.findUnique({
      where: { id: Number(req?.user?.id) },
      include: { roles: true, unit: true },
    });

    if (!currentUser) {
      return next(new ErrorHandler("User not found", 404));
    }


    const whereClause: any = {
      supportEngineerId: null,
      status: {
        not: TicketStatus.Closed,
      },
    };


    if (currentUser.unitId) {
      whereClause.unitId = currentUser.unitId;
    }
    // search filter
    if (search) {
      whereClause.OR = [
        { subjectLine: { contains: search, mode: "insensitive" } },
        { uuid: { contains: search, mode: "insensitive" } },
      ];
    }

    // status filter from query (optional, override)
    if (req.query.status) {
      whereClause.status = req.query.status;
    }

    // total count
    const totalCount = await prisma.ticket.count({ where: whereClause });

    // paginated tickets
    const tickets = await prisma.ticket.findMany({
      where: whereClause,
      orderBy: { [finalSortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true, email: true } },
        supportEngineer: { select: { id: true, name: true, email: true } },
        ticketAssets: {
          include: {
            asset: {
              select: {
                id: true,
                uuid: true,
                serialNo1: true,
                serialNo2: true,
              },
            },
          },
        },
      },
    });

    const paged = createPagedResponse(tickets, page, limit, totalCount);

    return successResponse(
      res,
      200,
      "Unassigned tickets fetched successfully",
      paged,
      null
    );
  } catch (error: unknown) {
    if (error instanceof Error)
      return next(new ErrorHandler(error.message, 400));
    return next(new ErrorHandler("An unknown error occurred", 500));
  }
};

export const getTicketByTicketId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { uuid } = req.params;
    const parsedUuid = getSafeString(uuid);
    const ticket = await prisma.ticket.findUnique({
      where: { uuid: parsedUuid },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true, email: true } },
        supportEngineer: { select: { id: true, name: true, email: true } },
        ticketAssets: {
          include: {
            asset: {
              select: {
                id: true,
                uuid: true,
                serialNo1: true,
                serialNo2: true,
                grInventoryProduct: {
                  select: {
                    product: {
                      select: {
                        name: true,
                        category: { select: { name: true } },
                         },
                      },
                    },
                  },
                },
              },
            },
          

                  },
              },
    });

    if (!ticket) return next(new ErrorHandler("Ticket not found", 404));

    const logs = await prisma.log.findMany({
      where: {
        relatedModelType: "prisma.ticket",
        relatedModelId: ticket.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        createdUser: { select: { id: true, name: true, email: true } },
      },
    });

    const parsedLogs = logs.map((log) => ({
      ...log,
      details:
        typeof log.details === "string" ? JSON.parse(log.details) : log.details,
    }));

    return successResponse(
      res,
      200,
      "Ticket fetched successfully",
      {
        ...ticket,
        logs: parsedLogs,
      },
      null
    );
  } catch (error: unknown) {
    if (error instanceof Error)
      return next(new ErrorHandler(error.message, 400));
    return next(new ErrorHandler("An unknown error occurred", 500));
  }
};

export const getTicketById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const ticket = await prisma.ticket.findUnique({
      where: { id: Number(id) },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true, email: true } },
        supportEngineer: { select: { id: true, name: true, email: true } },
        ticketAssets: {
          include: {
            asset: {
              select: {
                id: true,
                uuid: true,
                serialNo1: true,
                serialNo2: true,
                grInventoryProduct: {
                  select: {
                    product: {
                      select: {
                        name: true,
                        category: { select: { name: true } },
                         },
                      },
                    },
                  },
                },
              },
            },
          },
        },
            });

    if (!ticket) return next(new ErrorHandler("Ticket not found", 404));

    const logs = await prisma.log.findMany({
      where: {
        relatedModelType: "prisma.ticket",
        relatedModelId: ticket.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        createdUser: { select: { id: true, name: true, email: true } },
      },
    });

    const parsedLogs = logs.map((log) => ({
      ...log,
      details:
        typeof log.details === "string" ? JSON.parse(log.details) : log.details,
    }));

    return successResponse(
      res,
      200,
      "Ticket fetched successfully",
      {
        ...ticket,
        logs: parsedLogs,
      },
      null
    );
  } catch (error: unknown) {
    if (error instanceof Error)
      return next(new ErrorHandler(error.message, 400));
    return next(new ErrorHandler("An unknown error occurred", 500));
  }
};

export const getSupportEngineerByUnit = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let { unitId } = req.params;
    const search = req.query.search as string;

    const whereCondition: any = {
      roles: {
        some: {
          name: Roles.SUPPORT_ENGINEER,
        },
      },
    };

    if (unitId && unitId !== "all") {
      whereCondition.unitId = Number(unitId);
    }

    if (search) {
      whereCondition.name = {
        contains: search,
        mode: "insensitive",
      };
    }

    const users = await prisma.user.findMany({
      where: whereCondition,
      include: {
        roles: true,
        unit: true,
        department: true,
        location: true,
      },
    });

    return successResponse(
      res,
      200,
      "Support engineers fetched successfully",
      users,
      null
    );
  } catch (error: unknown) {
    if (error instanceof Error)
      return next(new ErrorHandler(error.message, 400));
    return next(new ErrorHandler("An unknown error occurred", 500));
  }
};

export const createTicket = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = parseInt(req.user?.id ?? "0");
    if (!userId) throw new Error("Invalid user id");

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return next(new ErrorHandler("User not found", 404));

    const {
      type,
      subjectLine,
      assetIds = [],
      supportEngineerId,
      priority,
      remarks = null,
      categoryId,
      subcategoryId,
    } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const attachmentFiles = files?.["attachment"] || [];

    const uuid = await generateNextCode(prisma.ticket, "uuid", "TICKET-");

    let uploadedAttachments: string[] = [];
    if (attachmentFiles.length > 0) {
      uploadedAttachments = await uploadFiles(
        "ticketAttachments",
        attachmentFiles
      );
    }

    const initialStatus = supportEngineerId && priority ? TicketStatus.AssigendSupport : TicketStatus.Open;

    const newTicket = await prisma.ticket.create({
      data: {
        uuid,
        subjectLine,
        type: type ? type : null,
        userId,
        unitId: user.unitId ?? null,
        priority: priority || null,
        status: initialStatus,
        supportEngineerId: supportEngineerId
          ? parseInt(supportEngineerId)
          : null,
        supportEngineerAssignedAt: supportEngineerId ? new Date() : null,
        categoryId: categoryId ? Number(categoryId) : null,
                attachment:
          uploadedAttachments.length > 0
            ? `${process.env.APP_URL}${uploadedAttachments[0]}`
            : null,
      },
    });

    if (assetIds.length > 0) {
      const ids = assetIds.map((id: string) => parseInt(id));
      await prisma.ticketAsset.createMany({
        data: ids.map((assetId: number) => ({
          ticketId: newTicket.id,
          assetId,
        })),
        // skipDuplicates: true,
      });
    }

    createLog({
      action: LogAction.TICKET,
      userId,
      relatedModelType: "prisma.ticket",
      relatedModelId: newTicket.id,
      details: {
        actions: TicketStatus.CREATED,
        uuid,
        subjectLine,
        attachment: newTicket.attachment,
      },
      actionUrl: `${process.env.FRONTEND_URL}/tickets/${newTicket.uuid}`,
    }).catch(console.error);

    const ticketLinks = `${process.env.FRONTEND_URL}/tickets/${newTicket.uuid}`;

    let productDetails: any[] = [];
    if (assetIds.length > 0) {
      const ids = assetIds.map((id: any) => parseInt(id));
      const assetDetails = await prisma.inventoryProductDetail.findMany({
        where: { id: { in: ids } },
        include: {
          grInventoryProduct: {
            include: { product: { select: { name: true } } },
          },
        },
      });

      productDetails = assetDetails.map((asset) => ({
        name: asset.grInventoryProduct?.product?.name || "N/A",
        serial1: asset.serialNo1 || "N/A",
        serial2: asset.serialNo2 || "N/A",
      }));
    }

    const emailContents = ticketCreatedTemplate(
      newTicket.uuid,
      user.name || "User",
      newTicket.subjectLine ?? "",
      ticketLinks,
      user.uuid ?? "N/A",
      user.email ?? "N/A",
      newTicket.createdAt.toDateString(),
      newTicket.createdAt.toLocaleTimeString(),
      newTicket.createdAt.toDateString(),
      productDetails,
      "N/A",
      uploadedAttachments.map((a) => `${process.env.APP_URL}${a}`)
    );

    sendTicketEmail(
      user.email!,
      `New Ticket Raised ${newTicket.uuid}`,
      emailContents
    );

    createNotification(
      userId,
      `Your ticket ${newTicket.uuid} has been created successfully.`,
      `${process.env.FRONTEND_URL}/tickets/${newTicket.uuid}`
    );

    if (supportEngineerId && priority) {
      const supportEngineer = await prisma.user.findUnique({
        where: { id: Number(supportEngineerId) },
        select: { name: true, email: true },
      });

      await createLog({
        action: LogAction.TICKET,
        userId: Number(userId),
        relatedModelType: "prisma.ticket",
        relatedModelId: newTicket.id,
        details: {
          actions: TicketStatus.AssigendSupport,
          uuid: newTicket.uuid,
          remarks: remarks,
        },
        actionUrl: `${process.env.FRONTEND_URL}/tickets/${newTicket.uuid}`,
      });

      const ticketLink = `${process.env.FRONTEND_URL}/tickets/${newTicket.uuid}`;
      const assignmentDate = new Date().toDateString();
      const assignmentTime = new Date().toLocaleTimeString();

      const emailContents = ticketAssignedTemplate(
        newTicket.uuid,
        newTicket.subjectLine || "N/A",
        supportEngineer?.name || "N/A",
        user?.name || "N/A",
        priority || "N/A",
        assignmentDate || "N/A",
        assignmentTime || "N/A",
        remarks || "N/A",
        ticketLink || "N/A"
      );

      sendTicketEmail(
        supportEngineer?.email!,
        `Support Engineer Assigned: ${newTicket.uuid}`,
        emailContents
      );

      createNotification(
        Number(supportEngineerId),
        `You have been assigned to ticket ${newTicket.uuid} with ${priority} priority.`,
        `${process.env.FRONTEND_URL}/tickets/${newTicket.uuid}`
      );
    } else {
      const engineers = await getSupportEngineerEmails(user.unitId);

      if (engineers.length > 0) {
        sendTicketEmail(
          engineers,
          `New Ticket Created: ${newTicket.uuid}`,
          emailContents
        );
      }
    }

    if (user.unitId) {
      const adminEmails = await getSupporAdmintUnitAdminEmails(user.unitId);

      if (adminEmails.length > 0) {
        sendTicketEmail(
          adminEmails,
          `New Ticket Created: ${newTicket.uuid}`,
          emailContents
        );
      }

      const adminUsers = await prisma.user.findMany({
        where: {
          unitId: user.unitId,
          roles: {
            some: {
              name: { in: [Roles.SUPPORT_ADMIN] },
            },
          },
        },
        select: { id: true },
      });

      adminUsers.forEach((admin) => {
        createNotification(
          admin.id,
          `New ticket ${newTicket.uuid} has been created in your unit.`,
          `${process.env.FRONTEND_URL}/tickets/${newTicket.uuid}`
        );
      });
    }

    return successResponse(
      res,
      201,
      "Ticket created successfully",
      newTicket,
      null
    );
  } catch (error: unknown) {
    if (error instanceof Error)
      return next(new ErrorHandler(error.message, 400));
    return next(new ErrorHandler("An unknown error occurred", 500));
  }
};

export const updateTicket = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new Error("User ID not found");

    const { id, type, categoryId, subcategoryId } = req.body;

    const ticket = await prisma.ticket.findUnique({
      where: { id: Number(id) },
      include: {
        createdBy: {
          select: { name: true, email: true },
        },
        unit: {
          select: { id: true },
        },
      },
    });

    if (!ticket) return next(new ErrorHandler("Ticket not found", 404));

    const updatedTicket = await prisma.ticket.update({
      where: { id: Number(id) },
      data: {
        type,
        categoryId,
        subcategoryId,
      },
    });

    return successResponse(
      res,
      200,
      "Ticket updated successfully",
      updatedTicket,
      null
    );
  } catch (error: any) {
    return next(
      new ErrorHandler(
        error.message || "Internal server error",
        error.statusCode || 500
      )
    );
  }
};

export const assignedSupport = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw new Error("User ID not found");

    const { id,
      supportEngineerId,
      priority,
      remarks } = req.body;

    const ticket = await prisma.ticket.findUnique({
      where: { id: Number(id) },
      include: {
        createdBy: {
          select: { name: true, email: true },
        },
        unit: {
          select: { id: true },
        },
      },
    });

    if (!ticket) return next(new ErrorHandler("Ticket not found", 404));

    const supportEngineer = await prisma.user.findUnique({
      where: { id: Number(supportEngineerId) },
      select: { name: true, email: true },
    });

    if (!supportEngineer) {
      return next(new ErrorHandler("Support engineer not found", 404));
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: Number(id) },
      data: {
        status: TicketStatus.AssigendSupport,
        supportEngineerId,
        priority,
        supportEngineerAssignedAt: new Date(),
      },
    });

    const ticketLink = `${process.env.FRONTEND_URL}/tickets/${ticket.uuid}`;
    await createLog({
      action: LogAction.TICKET,
      userId: Number(userId),
      relatedModelType: "prisma.ticket",
      relatedModelId: ticket.id,
      details: {
        actions: TicketStatus.AssigendSupport,
        uuid: ticket.uuid,
        remarks: remarks,
      },
      actionUrl: ticketLink,
    });

    const assignmentDate = new Date().toDateString();
    const assignmentTime = new Date().toLocaleTimeString();
    const adminEmails = await getAdminEmails(ticket.unit?.id || null);

    const recipients = new Set<string>();
    if (ticket.createdBy?.email) recipients.add(ticket.createdBy.email);
    if (supportEngineer.email) recipients.add(supportEngineer.email);
    adminEmails.forEach((email) => recipients.add(email));

    for (const email of recipients) {
      const recipientName =
        email === ticket.createdBy?.email
          ? ticket.createdBy.name || "User"
          : email === supportEngineer.email
            ? supportEngineer.name || "Support Engineer"
            : "Support Admin";

      const emailContent = ticketAssignedTemplate(
        ticket.uuid,
        ticket.subjectLine || "N/A",
        recipientName,
        ticket.createdBy?.name || "N/A",
        priority || "N/A",
        assignmentDate || "N/A",
        assignmentTime || "N/A",
        remarks || "N/A",
        ticketLink || "N/A"
      );

      await sendTicketEmail(
        email,
        `Ticket Assigned: ${ticket.uuid}`,
        emailContent
      );
    }

    createNotification(
      supportEngineerId,
      `you have been assigned to ticket ${updatedTicket.uuid}.`,
      ticketLink
    );

    return successResponse(
      res,
      200,
      "Ticket updated successfully",
      updatedTicket,
      null
    );
  } catch (error: unknown) {
    if (error instanceof Error)
      return next(new ErrorHandler(error.message, 400));
    return next(new ErrorHandler("An unknown error occurred", 500));
  }
};

export const serviceCheck = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const { ticketId, serviceDetails } = req.body;

    const user = await prisma.user.findUnique({
      where: {
        id: Number(userId),
      },
      include: {
        roles: {
          select: {
            name: true,
          },
        },
      },
    });
    let newStatus: TicketStatus;

    if (
      user?.roles?.some(
        (role) =>
          role.name === Roles.SUPER_ADMIN ||
          role.name === Roles.SUPPORT_ADMIN ||
          role.name === Roles.UNIT_ADMIN
      )
    ) {
      newStatus = TicketStatus.Closed;
    } else {
      newStatus = TicketStatus.Resolved;
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: Number(ticketId) },
      include: {
        createdBy: {
          select: {
            email: true,
            name: true,
            uuid: true,
          },
        },
        ticketAssets: {
          include: {
            asset: {
              include: {
                grInventoryProduct: {
                  include: {
                    product: true,
                  },
                },
              },
            },
          },
        },
        unit: {
          select: {
            id: true,
          },
        },
        supportEngineer: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });

    if (!ticket) {
      return next(new ErrorHandler("Ticket not found", 404));
    }

    await prisma.ticket.update({
      where: { id: Number(ticketId) },
      data: {
        status: newStatus,
        completedAt: new Date(),
      },
    });

    const processedAssets = [];
    const ticketLink = `${process.env.FRONTEND_URL}/tickets/${ticket.uuid}`;

    for (const detail of serviceDetails) {
      const { assetId, repairCost, isEWaste, remarks } = detail;
      const assetIdNum = Number(assetId);

      const ticketAsset = await prisma.ticketAsset.findFirst({
        where: { assetId: assetIdNum },
        include: {
          asset: {
            include: {
              grInventoryProduct: {
                include: {
                  product: true,
                },
              },
            },
          },
        },
      });

      if (!ticketAsset) continue;

      let parsedRepairCost: number | null = null;
      if (
        repairCost !== undefined &&
        repairCost !== null &&
        repairCost !== ""
      ) {
        parsedRepairCost = Number(repairCost);
        if (isNaN(parsedRepairCost)) {
          return next(new ErrorHandler("Invalid repair cost value", 400));
        }
      }

      await prisma.ticketAsset.update({
        where: { id: ticketAsset.id },
        data: {
          repairCost: parsedRepairCost,
          serviceRemarks: remarks || null,
          status: isEWaste ? AssetStatus.E_WASTE : AssetStatus.SERVICE_CHECKED,
        },
      });

      if (isEWaste) {
        await prisma.inventoryProductDetail.update({
          where: { id: assetIdNum },
          data: { assignedStatus: AssetStatus.E_WASTE },
        });
      }

      const asset = await prisma.inventoryProductDetail.findFirst({
        where: { id: assetIdNum },
        include: {
          grInventoryProduct: {
            include: {
              product: {
                select: { name: true },
              },
            },
          },
        },
      });

      const productName =
        asset?.grInventoryProduct?.product?.name || "Unknown Product";

      await prisma.service.create({
        data: {
          inventoryProductDetailId: assetIdNum,
          servicingCost: parsedRepairCost || 0,
          servicingRemarks: remarks || null,
          createdBy: Number(userId),
        },
      });

      const log = await createLog({
        action: LogAction.TICKET,
        userId: Number(userId),
        relatedModelType: "prisma.ticket",
        relatedModelId: ticket.id,
        details: {
          actions: TicketStatus.Resolved,
          uuid: ticket.uuid,
          remarks: `Service Checked Done For ${productName}`,
        },
        actionUrl: ticketLink,
      });

      if (log) {
        await createLogReport(
          ticket.uuid,
          assetIdNum,
          `Ticket Id: ${ticket.uuid} Servicing Cost :- ${repairCost || 0}`,
          new Date(),
          TicketStatus.Resolved,
          Number(userId),
          log.id,
          ticketLink,
          asset?.assignedStatus,
          repairCost
        );
      }

      processedAssets.push({
        name: productName,
        serial1: ticketAsset.asset?.serialNo1 || "N/A",
        serial2: ticketAsset.asset?.serialNo2 || "N/A",
        repairCost: parsedRepairCost,
        isEWaste,
        remarks,
      });
    }

    if (serviceDetails.length == 0) {
      await createLog({
        action: LogAction.TICKET,
        userId: Number(userId),
        relatedModelType: "prisma.ticket",
        relatedModelId: ticket.id,
        details: {
          actions: TicketStatus.Resolved,
          uuid: ticket.uuid,
          remarks: `Service Checked Done`,
        },
        actionUrl: ticketLink,
      });
    }

    const emailSubject = `Service Check Completed for Ticket #${ticket.uuid}`;

    const adminEmails = await getAdminEmails(ticket.unit?.id || null);

    const recipients = new Set<string>();
    if (ticket.createdBy?.email) recipients.add(ticket.createdBy.email);
    if (ticket.supportEngineer?.email)
      recipients.add(ticket.supportEngineer.email);
    adminEmails.forEach((email) => recipients.add(email));

    for (const email of recipients) {
      const recipientName =
        email === ticket.createdBy?.email
          ? ticket.createdBy.name || "User"
          : email === ticket.supportEngineer?.email
            ? ticket.supportEngineer.name || "Support Engineer"
            : "Support Admin";

      const emailHtml = serviceCheckCompletedTemplate(
        ticket.uuid,
        recipientName,
        `Service check has been completed for ticket #${ticket.uuid}`,
        ticketLink,
        ticket.createdBy?.uuid || "N/A",
        email,
        new Date().toLocaleDateString(),
        new Date().toLocaleTimeString(),
        processedAssets
      );

      await sendTicketEmail(email, emailSubject, emailHtml);
    }

    createNotification(
      ticket.userId,
      `service check has been done for your ticket ${ticket.uuid}.`,
      ticketLink
    );

    return successResponse(
      res,
      200,
      "Service check completed successfully",
      {},
      null
    );
  } catch (error: any) {
    return next(
      new ErrorHandler(
        error.message || "Internal server error",
        error.statusCode || 500
      )
    );
  }
};

export const rejectTicket = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const { id, remarks } = req.body;

    if (!id) return next(new ErrorHandler("Ticket ID is required", 400));

    const ticket = await prisma.ticket.findUnique({
      where: { id: Number(id) },
      include: {
        createdBy: {
          select: {
            email: true,
            name: true,
          },
        },
        supportEngineer: {
          select: {
            email: true,
            name: true,
          },
        },
        unit: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!ticket) return next(new ErrorHandler("Ticket not found", 404));

    await prisma.ticket.update({
      where: { id: Number(id) },
      data: {
        status: TicketStatus.ReOpen,
      },
    });

    const ticketLink = `${process.env.FRONTEND_URL}/tickets/${ticket.uuid}`;
    await createLog({
      action: LogAction.TICKET,
      userId: Number(userId),
      relatedModelType: "prisma.ticket",
      relatedModelId: ticket.id,
      details: {
        actions: TicketStatus.ReOpen,
        uuid: ticket?.uuid,
        remarks: remarks,
      },
      actionUrl: ticketLink,
    });

    const rejecter = await prisma.user.findUnique({
      where: { id: Number(userId) },
      select: { name: true, email: true },
    });

    const adminEmails = await getAdminEmails(ticket.unit?.id || null);

    const recipients = new Set<string>();
    if (ticket.createdBy?.email) recipients.add(ticket.createdBy.email);
    if (ticket.supportEngineer?.email)
      recipients.add(ticket.supportEngineer.email);
    adminEmails.forEach((email) => recipients.add(email));

    const currentDate = new Date();
    const rejectionDate = currentDate.toLocaleDateString();
    const rejectionTime = currentDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    for (const email of recipients) {
      const recipientName =
        email === ticket.createdBy?.email
          ? ticket.createdBy.name || "User"
          : email === ticket.supportEngineer?.email
            ? ticket.supportEngineer.name || "Support Engineer"
            : "Support Admin";

      const emailContent = ticketRejectedTemplate(
        ticket.uuid.toString(),
        ticket.subjectLine || "N/A",
        recipientName,
        rejecter?.name || "N/A",
        rejecter?.email || "N/A",
        rejectionDate,
        rejectionTime,
        remarks
      );

      await sendTicketEmail(
        email,
        `Ticket Rejected: ${ticket.uuid}`,
        emailContent
      );
    }

    if (ticket.supportEngineerId) {
      createNotification(
        ticket.supportEngineerId,
        `The Problem is not fixed yet user Reopen the ticket- ${ticket.uuid}.`,
        `${process.env.FRONTEND_URL}/tickets/${ticket.id}`
      );
    }

    return successResponse(res, 200, "Ticket rejected successfully", {}, null);
  } catch (error: unknown) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 400));
    }
    return next(new ErrorHandler("An unknown error occurred", 500));
  }
};

export const selfAssignTicket = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) throw new Error("User not authenticated");

    const ticketId = Number(req.params.id);
    if (isNaN(ticketId)) {
      return next(new ErrorHandler("Invalid ticket id", 400));
    }

    const { priority, remarks } = req.body;

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        createdBy: { select: { name: true, email: true } },
        unit: true,
      },
    });

    if (!ticket) return next(new ErrorHandler("Ticket not found", 404));

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: TicketStatus.AssigendSupport,
        supportEngineerId: Number(userId),
        priority: priority || ticket.priority,
        supportEngineerAssignedAt: new Date(),
      },
    });

    const ticketLink = `${process.env.FRONTEND_URL}/tickets/${ticket.uuid}`;

    // 🔹 Log
    await createLog({
      action: LogAction.TICKET,
      userId: Number(userId),
      relatedModelType: "prisma.ticket",
      relatedModelId: ticket.id,
      details: {
        actions: TicketStatus.AssigendSupport,
        uuid: ticket.uuid,
        remarks,
      },
      actionUrl: ticketLink,
    });

    // 🔹 Notifications & Emails
    const assignmentDate = new Date().toDateString();
    const assignmentTime = new Date().toLocaleTimeString();

    const adminEmails = await getAdminEmails(ticket.unit?.id || null);
    const recipients = new Set<string>();
    if (ticket.createdBy?.email) recipients.add(ticket.createdBy.email);

    const engineer = await prisma.user.findUnique({
      where: { id: Number(userId) },
      select: { name: true, email: true },
    });

    if (engineer?.email) recipients.add(engineer.email);
    adminEmails.forEach((email) => recipients.add(email));

    for (const email of recipients) {
      const recipientName =
        email === ticket.createdBy?.email
          ? ticket.createdBy.name || "User"
          : email === engineer?.email
            ? engineer.name || "Support Engineer"
            : "Support Admin";

      const emailContent = ticketAssignedTemplate(
        ticket.uuid,
        ticket.subjectLine || "N/A",
        recipientName,
        ticket.createdBy?.name || "N/A",
        priority || "N/A",
        assignmentDate,
        assignmentTime,
        remarks || "N/A",
        ticketLink
      );

      await sendTicketEmail(
        email,
        `Ticket Assigned: ${ticket.uuid}`,
        emailContent
      );
    }

    return successResponse(
      res,
      200,
      "Ticket self-assigned successfully",
      updatedTicket,
      null
    );
  } catch (error: any) {
    return next(new ErrorHandler(error.message || "Something went wrong", 400));
  }
};

export const closeTicket = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const { id, status, review, ratings } = req.body;

    const ticket = await prisma.ticket.findUnique({
      where: { id: Number(id) },
      include: {
        createdBy: {
          select: {
            email: true,
            name: true,
          },
        },
        supportEngineer: {
          select: {
            email: true,
            name: true,
          },
        },
        unit: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!ticket) return next(new ErrorHandler("Ticket not found", 404));

    const ticketLink = `${process.env.FRONTEND_URL}/tickets/${ticket.uuid}`;
    if (status && status !== ticket.status) {
      const updatedTicket = await prisma.ticket.update({
        where: { id: Number(id) },
        data: {
          status,
          ratings: parseFloat(ratings),
          reviews: review,
        },
      });

      await createLog({
        action: LogAction.TICKET,
        userId: Number(userId),
        relatedModelType: "prisma.ticket",
        relatedModelId: ticket.id,
        details: {
          actions: TicketStatus.Closed,
          uuid: ticket?.uuid,
          ratings: ratings ? ratings : null,
          remarks: review ? review : null,
        },
        actionUrl: ticketLink,
      });

      const closer = await prisma.user.findUnique({
        where: { id: Number(userId) },
        select: { name: true, email: true },
      });

      const adminEmails = await getSupporAdmintUnitAdminEmails(ticket.unit?.id || null);

      const recipients = new Set<string>();
      if (ticket.createdBy?.email) recipients.add(ticket.createdBy.email);
      if (ticket.supportEngineer?.email)
        recipients.add(ticket.supportEngineer.email);
      adminEmails.forEach((email) => recipients.add(email));

      const currentDate = new Date();
      const closeDate = currentDate.toLocaleDateString();
      const closeTime = currentDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      for (const email of recipients) {
        const recipientName =
          email === ticket.createdBy?.email
            ? ticket.createdBy.name || "User"
            : email === ticket.supportEngineer?.email
              ? ticket.supportEngineer.name || "Support Engineer"
              : "Support Admin";

        const emailContent = ticketClosedTemplate(
          ticket.uuid.toString(),
          ticket.subjectLine || "Ticket Closure",
          recipientName,
          closer?.name || "Closer",
          closer?.email || "",
          closeDate,
          closeTime,
          review,
          ratings
        );

        await sendTicketEmail(
          email,
          `Ticket Closed: ${ticket.uuid}`,
          emailContent
        );
      }
    }

    return successResponse(res, 200, "Ticket updated successfully", {}, null);
  } catch (error: unknown) {
    if (error instanceof Error)
      return next(new ErrorHandler(error.message, 400));
    return next(new ErrorHandler("An unknown error occurred", 500));
  }
};
