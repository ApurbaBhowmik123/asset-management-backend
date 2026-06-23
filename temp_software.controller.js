"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSoftwareLogs = exports.assignSoftware = exports.getAllSoftware = exports.updateSoftware = exports.createSoftware = exports.getSoftwareById = exports.getsoftwares = void 0;
const successResponse_1 = require("@utils/successResponse");
const ErrorHandler_1 = require("@utils/ErrorHandler");
const pagedResponse_1 = require("@utils/pagedResponse");
const software_log_1 = require("@utils/software.log");
const prisma_1 = require("../../../prisma/generated/prisma");
const codeGenerator_1 = require("@utils/codeGenerator");
const paramHelper_1 = require("@utils/paramHelper");
const prisma = new prisma_1.PrismaClient();
const getsoftwares = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || "";
        const sortBy = req.query.sortBy || "createdAt";
        const sortOrder = req.query.sortOrder === "asc" ? "asc" : "desc";
        const allowedSortFields = ["name", "uuid", "createdAt", "updatedAt"];
        const finalSortBy = allowedSortFields.includes(sortBy)
            ? sortBy
            : "createdAt";
        const searchTerms = search.split(" ");
        const searchConditions = searchTerms.map((term) => ({
            OR: [{ name: { contains: term } }, { uuid: { contains: term } }],
        }));
        const softwares = yield prisma.softWare.findMany({
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
        const totalCount = yield prisma.softWare.count({
            where: {
                AND: [...(search ? searchConditions : [])],
            },
        });
        return (0, successResponse_1.successResponse)(res, 200, "software list retrieved", (0, pagedResponse_1.createPagedResponse)(softwares, page, limit, totalCount), null);
    }
    catch (error) {
        return next(new ErrorHandler_1.ErrorHandler(error instanceof Error ? error.message : "Internal Server Error", 500));
    }
});
exports.getsoftwares = getsoftwares;
const getSoftwareById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const softwareId = parseInt((0, paramHelper_1.getSafeString)(req.params.id));
        const software = yield prisma.softWare.findUnique({
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
            return next(new ErrorHandler_1.ErrorHandler("Software not found", 404));
        }
        return (0, successResponse_1.successResponse)(res, 200, "Software retrieved", software, null);
    }
    catch (error) {
        return next(new ErrorHandler_1.ErrorHandler(error instanceof Error ? error.message : "Internal Server Error", 500));
    }
});
exports.getSoftwareById = getSoftwareById;
const createSoftware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = parseInt((_b = (_a = req === null || req === void 0 ? void 0 : req.user) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : "0");
        const { name, version, licenseKey, quantity, ExpiryDate, IssueDate, LicenseType, activationKey, } = req.body;
        const uuid = yield (0, codeGenerator_1.generateNextCode)(prisma.softWare, "uuid", "SOFT-");
        const newSoftware = yield prisma.softWare.create({
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
        const user = yield prisma.user.findUnique({
            where: {
                id: userId,
            },
            select: {
                id: true,
                name: true,
            },
        });
        yield (0, software_log_1.createSoftwareLog)({
            softwareId: newSoftware.id,
            userId: userId,
            action: "CREATE",
            actionDetails: `Created software with quantity ${quantity} created By ${user === null || user === void 0 ? void 0 : user.name}`,
        });
        return (0, successResponse_1.successResponse)(res, 201, "Software created", newSoftware, null);
    }
    catch (error) {
        return next(new ErrorHandler_1.ErrorHandler(error instanceof Error ? error.message : "Internal Server Error", 500));
    }
});
exports.createSoftware = createSoftware;
const updateSoftware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const softwareId = parseInt((0, paramHelper_1.getSafeString)(req.params.id));
        const userId = parseInt((_b = (_a = req === null || req === void 0 ? void 0 : req.user) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : "0");
        const { name, version, licenseKey, quantity, ExpiryDate, LicenseType, IssueDate, activationKey, } = req.body;
        const softWare = yield prisma.softWare.findUnique({
            where: { id: softwareId },
        });
        if (!softWare) {
            return next(new ErrorHandler_1.ErrorHandler("Software not found", 404));
        }
        const currentQuantity = softWare.currentQuantity + Number(quantity);
        const updatedSoftware = yield prisma.softWare.update({
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
        const user = yield prisma.user.findUnique({
            where: {
                id: userId,
            },
            select: {
                id: true,
                name: true,
            },
        });
        yield (0, software_log_1.createSoftwareLog)({
            softwareId: updatedSoftware.id,
            userId: userId,
            action: "UPDATE",
            actionDetails: `Updated software to ${name} with quantity ${quantity} by ${user === null || user === void 0 ? void 0 : user.name}`,
        });
        return (0, successResponse_1.successResponse)(res, 200, "Software updated", updatedSoftware, null);
    }
    catch (error) {
        return next(new ErrorHandler_1.ErrorHandler(error instanceof Error ? error.message : "Internal Server Error", 500));
    }
});
exports.updateSoftware = updateSoftware;
const getAllSoftware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const softwares = yield prisma.softWare.findMany({
            select: {
                id: true,
                name: true,
            },
        });
        return (0, successResponse_1.successResponse)(res, 200, "Software list retrieved", softwares, null);
    }
    catch (error) {
        return next(new ErrorHandler_1.ErrorHandler(error instanceof Error ? error.message : "Internal Server Error", 500));
    }
});
exports.getAllSoftware = getAllSoftware;
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
const assignSoftware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const actingUserId = Number((_b = (_a = req === null || req === void 0 ? void 0 : req.user) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : 0);
        const { assignToUser, softwareIds, quantity } = req.body;
        const targetUserId = Number(assignToUser);
        if (!targetUserId || !Array.isArray(softwareIds)) {
            return next(new ErrorHandler_1.ErrorHandler("assignToUser and softwareIds are required", 400));
        }
        // normalize: unique & ints
        const finalSelectedIds = [
            ...new Set(softwareIds.map((id) => Number(id))),
        ];
        // 1) Current active assignments
        const existingAssignments = yield prisma.softWareAssignment.findMany({
            where: { assignedTo: targetUserId, status: "ASSIGNED" },
            select: { id: true, softwareId: true, quantity: true },
        });
        const existingIds = new Set(existingAssignments.map((a) => a.softwareId));
        // 2) Diffs
        const toAssign = finalSelectedIds.filter((id) => !existingIds.has(id));
        const toUnassign = existingAssignments.filter((a) => !finalSelectedIds.includes(a.softwareId));
        const qty = Math.max(1, Number(quantity !== null && quantity !== void 0 ? quantity : 1));
        const results = [];
        // 3) Assign new
        for (const softwareId of toAssign) {
            const software = yield prisma.softWare.findUnique({
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
            const [updatedSoftware, assignment] = yield prisma.$transaction([
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
            (0, software_log_1.createSoftwareLog)({
                softwareId,
                userId: actingUserId,
                action: "ASSIGN",
                actionDetails: `Assigned ${qty} of ${software.name} to user ${targetUserId}`,
            }).catch(console.error);
            results.push({ action: "ASSIGNED", data: assignment });
        }
        // 4) Unassign removed
        for (const { id: assignmentId, softwareId, quantity: assignedQty, } of toUnassign) {
            const software = yield prisma.softWare.findUnique({
                where: { id: softwareId },
            });
            if (!software)
                continue;
            const [updatedSoftware, updatedAssignment] = yield prisma.$transaction([
                prisma.softWare.update({
                    where: { id: softwareId },
                    data: { currentQuantity: { increment: assignedQty } },
                }),
                prisma.softWareAssignment.update({
                    where: { id: assignmentId },
                    data: { status: "UNASSIGNED" },
                }),
            ]);
            (0, software_log_1.createSoftwareLog)({
                softwareId,
                userId: actingUserId,
                action: "UNASSIGN",
                actionDetails: `Unassigned ${assignedQty} of ${software.name} from user ${targetUserId}`,
            }).catch(console.error);
            results.push({ action: "UNASSIGNED", data: updatedAssignment });
        }
        // 5) Return updated user
        const updatedUser = yield prisma.user.findUnique({
            where: { id: targetUserId },
            include: {
                softAssignedTo: {
                    where: { status: "ASSIGNED" },
                    include: { software: true },
                },
            },
        });
        return (0, successResponse_1.successResponse)(res, 200, "Software assignment updated", {
            actions: results,
            user: updatedUser,
        }, null);
    }
    catch (error) {
        return next(new ErrorHandler_1.ErrorHandler((error === null || error === void 0 ? void 0 : error.message) || "Internal Server Error", 500));
    }
});
exports.assignSoftware = assignSoftware;
const getSoftwareLogs = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || "";
        const sortBy = req.query.sortBy || "createdAt";
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
        const logs = yield prisma.softWareLog.findMany({
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
        const totalCount = yield prisma.softWareLog.count({
            where: {
                AND: [search ? { OR: searchConditions } : {}],
            },
        });
        return (0, successResponse_1.successResponse)(res, 200, "Software logs retrieved", (0, pagedResponse_1.createPagedResponse)(logs, page, limit, totalCount), null);
    }
    catch (error) {
        return next(new ErrorHandler_1.ErrorHandler(error instanceof Error ? error.message : "Internal Server Error", 500));
    }
});
exports.getSoftwareLogs = getSoftwareLogs;
