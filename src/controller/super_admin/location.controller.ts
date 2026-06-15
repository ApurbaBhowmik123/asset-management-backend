import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "../../../prisma/generated/prisma";
import { successResponse } from "@utils/successResponse";
import { ErrorHandler } from "@utils/ErrorHandler";
import { generateNextCode } from "@utils/codeGenerator";
import { createPagedResponse } from "@utils/pagedResponse";
import { uploadFiles } from "@src/helpers/uploadFiles";
import * as dotenv from "dotenv";
dotenv.config();
const prisma = new PrismaClient();

export const getLocations = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const sortBy = (req.query.sortBy as string) || "name";
    const sortOrder =
      (req.query.sortOrder as string) === "asc" ? "asc" : "desc";

    const allowedSortFields = ["name", "address", "createdAt"];
    const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : "name";

    const whereClause = search
      ? {
          OR: [
            { name: { contains: search } },
            { address: { contains: search } },
            { description: { contains: search } },
          ],
        }
      : {};

    const total = await prisma.location.count({ where: whereClause });

    const locations = await prisma.location.findMany({
      where: whereClause,
      orderBy: { [finalSortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        unitlocation: {
          include: {
            unit: {
              select: {
                id: true,
                identificationNumber: true,

                name: true,
                uuid: true,
              },
            },
          },
        },
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
    });

    const simplifiedLocations = locations.map((location) => ({
      id: location.id,
      identificationNumber: location.identificationNumber,
      uuid: location.uuid,
      name: location.name,
      abbriviatedName: location.abbriviatedName,
      address: location.address,
      description: location.description,
      units: location.unitlocation.map((ul) => ({
        id: ul.unit.id,
        name: ul.unit.name,
        uuid: ul.unit.uuid,
      })),
      createdBy: location.createdUser,
      updatedBy: location.updatedUser,
      createdAt: location.createdAt,
      updatedAt: location.updatedAt,
    }));

    const paged = createPagedResponse(simplifiedLocations, page, limit, total);
    successResponse(res, 200, "Locations fetched successfully", paged, null);
  } catch (error: unknown) {
    next(
      error instanceof Error
        ? new ErrorHandler(error.message, 400)
        : new ErrorHandler("An unknown error occurred", 500)
    );
  }
};

export const getLocationById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const location = await prisma.location.findUnique({
      where: { id: Number(id) },
      include: {
        
        unitlocation: {
          include: {
            unit: {
              select: {
                id: true,
                name: true,
                uuid: true,
                identificationNumber: true,
              },
            },
          },
        },
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
    });

    if (!location) {
      return next(new ErrorHandler("Location not found", 404));
    }

    // const response = {
    //   id: location.id,
    //   identificationNumber: location.identificationNumber,
    //   uuid: location.uuid,
    //   name: location.name,
    //   abbriviatedName: location.abbriviatedName,
    //   description: location.description,

    //   units: location.unitlocation.map((assoc) => ({
    //     id: assoc.unit.id,
    //     name: assoc.unit.name,
    //     uuid: assoc.unit.uuid,
    //   })),
    //   createdBy: location.createdUser,
    //   updatedBy: location.updatedUser,
    //   createdAt: location.createdAt,
    //   updatedAt: location.updatedAt,
    // };

    successResponse(res, 200, "Location fetched successfully", location, null);
  } catch (error: unknown) {
    next(
      error instanceof Error
        ? new ErrorHandler(error.message, 400)
        : new ErrorHandler("An unknown error occurred", 500)
    );
  }
};

export const createLocation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const {
      name,
      description,
      unitId,
      identificationNumber,
      abbriviatedName,
      address,
    } = req.body;

    let imagePath: string | null = null;
    if (req.file) {
      const uploadedFiles = await uploadFiles("locations", req.file);
      imagePath = uploadedFiles[0];
    }
    let imgUrl = null;
    if (imagePath) {
      const baseUrl = process.env.APP_URL?.replace(/\/$/, "");
      imgUrl = `${baseUrl}${imagePath}`;
    }

    const uuid = await generateNextCode(prisma.location, "uuid", "LOC");
    const result = await prisma.$transaction(async (tx) => {
      const location = await tx.location.create({
        data: {
          uuid,
          name,
          identificationNumber,
          abbriviatedName,
          address,
          image: imgUrl,
          description: description,
          createdBy: Number(userId),
          updatedBy: Number(userId),
        },
      });

      let association = null;

      if (unitId) {
        const unit = await tx.unit.findUnique({
          where: { id: Number(unitId) },
        });

        if (!unit) {
          throw new ErrorHandler(`Unit not found`, 404);
        }

        association = await tx.unitLocation.create({
          data: {
            unitId: unit.id,
            locationId: location.id,
            status: true,
            createdBy: Number(userId),
            updatedBy: Number(userId),
          },
        });
      }

      return { location, association };
    });

    successResponse(
      res,
      201,
      "Location created successfully",
      result,
      null
    );
  } catch (error: unknown) {
    next(
      error instanceof Error
        ? new ErrorHandler(error.message, 400)
        : new ErrorHandler("An unknown error occurred", 500)
    );
  }
};

export const updateLocation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { name, description, unitId, identificationNumber, abbriviatedName, address } =
      req.body;

    if (!userId) {
      return next(new ErrorHandler("User authentication required", 401));
    }
    let imagePath: string | null = null;
    if (req.file) {
      const uploadedFiles = await uploadFiles("locations", req.file);
      imagePath = uploadedFiles[0];
    }
    let imgUrl = null;
    
    if (imagePath) {
      const baseUrl = process.env.APP_URL?.replace(/\/$/, "");
      imgUrl = `${baseUrl}${imagePath}`;
    }
   
    const result = await prisma.$transaction(async (tx) => {
      const location = await tx.location.update({
        where: { id: Number(id) },
        data: {
          name: name,
          identificationNumber: identificationNumber,
          abbriviatedName: abbriviatedName,
          image: imgUrl,
          address: address,
          description: description,
          updatedBy: Number(userId),
        },
      });

      let association = null;
      let disassociation = null;

      if (unitId) {
        const unit = await tx.unit.findUnique({
          where: { id: Number(unitId) },
        });

        if (!unit) {
          throw new ErrorHandler(`Unit with ID ${unitId} not found`, 404);
        }

        disassociation = await tx.unitLocation.deleteMany({
          where: { locationId: location.id },
        });


        association = await tx.unitLocation.create({
          data: {
            unitId: unit.id,
            locationId: location.id,
            status: true,
            createdBy: Number(userId),
            updatedBy: Number(userId),
          },
        });
      } else {
        disassociation = await tx.unitLocation.deleteMany({
          where: { locationId: location.id },
        });
      }

      return {
        location,
        associationCreated: !!association,
        associationsRemoved: disassociation ? disassociation.count : 0,
      };
    });

    successResponse(
      res,
      200,
      "Location updated successfully",
      {
        id: result.location.id,
        name: result.location.name,
        identificationNumber: result.location.identificationNumber,
        abbriviatedName: result.location.abbriviatedName,
        unitId: unitId || null,
        associationCreated: result.associationCreated,
        associationsRemoved: result.associationsRemoved,
      },
      null
    );
  } catch (error: unknown) {
    next(
      error instanceof Error
        ? new ErrorHandler(error.message, 400)
        : new ErrorHandler("An unknown error occurred", 500)
    );
  }
};

export const deleteLocation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const location = await prisma.location.findUnique({
      where: { id: Number(id) },
    });

    if (!location) {
      return next(new ErrorHandler("Location not found", 404));
    }

    await prisma.$transaction(async (tx) => {
      await tx.unitLocation.deleteMany({
        where: { locationId: Number(id) },
      });

      await tx.location.delete({ where: { id: Number(id) } });
    });

    successResponse(res, 200, "Location deleted successfully", null, null);
  } catch (error: unknown) {
    next(
      error instanceof Error
        ? new ErrorHandler(error.message, 400)
        : new ErrorHandler("An unknown error occurred", 500)
    );
  }
};

export const getLocationByUnitId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const unitId = parseInt(req.params.unitId as string);

  if (isNaN(unitId)) {
    return next(new ErrorHandler("Invalid unit ID", 400));
  }

  try {
    const locations = await prisma.unitLocation.findMany({
      where: { unitId: unitId },
      select: {
        id: true,
        uuid: true,
        location: {
          select: {
            id: true,
            uuid: true,
            name: true,
            description: true,
          },
        },
        unit: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    successResponse(
      res,
      200,
      "Locations fetched successfully",
      locations,
      null
    );
  } catch (error: unknown) {
    next(
      error instanceof Error
        ? new ErrorHandler(error.message, 400)
        : new ErrorHandler("An unknown error occurred", 500)
    );
  }
};
export const getAllLocations = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const locations = await prisma.location.findMany({
      include: {
        unitlocation: {
          include: {
            unit: {
              select: {
                id: true,
                identificationNumber: true,
                name: true,
                uuid: true,
              },
            },
          },
        },
      },
    });

    const simplifiedLocations = locations.map((location) => ({
      id: location.id,
      identificationNumber: location.identificationNumber,
      uuid: location.uuid,
      name: location.name,
      abbriviatedName: location.abbriviatedName,
    }));

    successResponse(
      res,
      200,
      "Locations fetched successfully",
      simplifiedLocations,
      null
    );
  } catch (error: unknown) {
    next(
      error instanceof Error
        ? new ErrorHandler(error.message, 400)
        : new ErrorHandler("An unknown error occurred", 500)
    );
  }
};
