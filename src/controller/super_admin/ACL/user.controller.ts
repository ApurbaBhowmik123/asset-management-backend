import { successResponse } from "../../../utils/successResponse";
import { ErrorHandler } from "../../../utils/ErrorHandler";
import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "../../../../prisma/generated/prisma";
import { createPagedResponse } from "../../../utils/pagedResponse";
import bcrypt from "bcrypt";
import { generateNextCode } from "@src/utils/codeGenerator";
import { Roles } from "@src/enum/enum";

const prisma = new PrismaClient();

export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const sortBy = (req.query.sortBy as string) || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? "asc" : "desc";

    const allowedSortFields = [
      "name",
      "email",
      "designation",
      "unit",
      "department",
      "createdAt",
      "updatedAt",
    ];
    const finalSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    //Validate logged-in user
    if (!req.user || !(req as any).user.id) {
      return next(
        new ErrorHandler("Unauthorized: Missing user information", 401)
      );
    }

    const userId = Number((req as any).user.id);
    if (isNaN(userId) || userId <= 0) {
      return next(new ErrorHandler("Invalid user ID", 400));
    }

    // Fetch full user info from DB
    const dbUser = await prisma.user.findFirst({
      where: { id: userId, status: true },
      include: { roles: true, unit: true },
    });

    if (!dbUser) {
      return next(new ErrorHandler("User not found or inactive", 404));
    }

    const userRoles = dbUser.roles?.map((r) => r.name) || [];
    const userUnitId = dbUser.unitId || null;

    // Apply role-based filter
    let roleBasedWhere: any = {};
    if (
      (userRoles.includes(Roles.UNIT_ADMIN) ||
        userRoles.includes(Roles.SUPPORT_ADMIN)) &&
      userUnitId
    ) {
      roleBasedWhere.unitId = userUnitId;
    }

    // Search filter
    const searchFilter = search
      ? {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
            { designation: { contains: search } },
            { unit: { name: { contains: search } } },
            { department: { name: { contains: search } } },
          ],
        }
      : {};

    const whereClause = { ...roleBasedWhere, ...searchFilter };

    // Query users
    const total = await prisma.user.count({ where: whereClause });
    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        designation: true,
        username: true,
        uuid: true,
        dateOfBirth: true,
        mobile: true,
        about: true,
        mobile_prefix: true,
        roles: {
          select: {
            id: true,
            name: true,
          },
        },
        unit: {
          select: {
            id: true,
            name: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        location: {
          select: {
            id: true,
            name: true,
          },
        },
        softAssignedTo: {
          where: { status: "ASSIGNED" },
          select: {
            id: true,

            software: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        productAssignAssignedToUser: true,
      },
      orderBy: { [finalSortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    return successResponse(
      res,
      200,
      "Users fetched successfully",
      createPagedResponse(users, page, limit, total),
      null
    );
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    return next(
      new ErrorHandler(
        error instanceof Error ? error.message : "Internal Server Error",
        500
      )
    );
  }
};

export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.params.id;
    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
      include: { roles: true, unit: true, department: true, location: true },
    });
    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }
    return successResponse(res, 200, "User fetched successfully", user, null);
  } catch (error: unknown) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 400));
    }
    return next(new ErrorHandler("An unknown error occurred", 500));
  }
};

export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      name,
      email,
      password,
      roles: roleIds,
      designation,
      unitId,
      departmentID,
      phone,
      about,
      locationId,
    } = req.body;
    const userExists = await prisma.user.findFirst({
      where: { email },
    });
    if (userExists) {
      return next(new ErrorHandler("User with this email already exists", 400));
    }
    const roles = await prisma.role.findMany({
      where: { id: { in: roleIds } },
    });

    if (roles.length !== roleIds.length) {
      return next(new ErrorHandler("One or more roles are invalid", 400));
    }
    const uuid = await generateNextCode(prisma.user, "uuid", "EMP");

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        uuid,
        name,
        email,
        username: "ewf",
        password: hashedPassword,
        roles: { connect: roles.map((r) => ({ id: r.id })) },
        designation,
        unit: unitId ? { connect: { id: unitId } } : undefined,
        department: departmentID
          ? { connect: { id: departmentID } }
          : undefined,
        mobile: phone,
        location: locationId ? { connect: { id: locationId } } : undefined,
        about,
      },
    });

    return successResponse(res, 201, "User created successfully", user, null);
  } catch (error: unknown) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 400));
    }
    return next(new ErrorHandler("An unknown error occurred", 500));
  }
};

export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.params.id;
    const {
      name,
      email,
      password,
      roles: roleIds,
      designation,
      unitId,
      departmentID,
      phone,
      about,
      locationId,
    } = req.body;
    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
    });
    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    if (roleIds) {
      const roles = await prisma.role.findMany({
        where: { id: { in: roleIds } },
      });
      if (roles.length !== roleIds.length) {
        return next(new ErrorHandler("One or more roles are invalid", 400));
      }
    }
    let hashedPassword = user.password;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }
    const updatedData: any = {
      name: name || user.name,
      email: email || user.email,
      designation: designation || user.designation,
      unit: unitId ? { connect: { id: unitId } } : undefined,
      mobile: phone || user.mobile,
      about: about || user.about,
      roles: { set: (roleIds || []).map((id: number) => ({ id })) },
      department: departmentID ? { connect: { id: departmentID } } : undefined,
      location: locationId ? { connect: { id: locationId } } : undefined,
      password: hashedPassword || user.password,
    };
    await prisma.user.update({
      where: { id: Number(userId) },
      data: updatedData,
    });
    return successResponse(res, 200, "User updated successfully", user, null);
  } catch (error: unknown) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 400));
    }
    return next(new ErrorHandler("An unknown error occurred", 500));
  }
};

export const updateUserStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.params.id;
    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
    });
    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }
    await prisma.user.update({
      where: { id: Number(userId) },
      data: { status: !user.status },
    });
    return successResponse(
      res,
      200,
      "User status updated successfully",
      user,
      null
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 400));
    }
    return next(new ErrorHandler("An unknown error occurred", 500));
  }
};
