import { Request, Response, NextFunction } from "express";
import { successResponse } from "../../utils/successResponse";
import { ErrorHandler } from "../../utils/ErrorHandler";
import { generateNextCode } from "@src/utils/codeGenerator";
import { createPagedResponse } from "@src/utils/pagedResponse";
import { checkDuplicates } from "@src/utils/checkDuplicates";
import { SanitizeInput } from "@src/helpers/sanitizeInput";
import prisma from "../../utils/prisma";


export const getUnits = async (
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

    const allowedSortFields = ["name", "status", "createdAt"];
    const finalSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    const whereClause = search
      ? {
          OR: [
            { name: { contains: search} },
            { description: { contains: search } },
          ],
        }
      : {};
    const total = await prisma.unit.count({ where: whereClause });

    const units = await prisma.unit.findMany({
      where: whereClause,
      orderBy: { [finalSortBy]: sortOrder },
      skip: (page - 1) * limit,
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
        address: true,
        unitlocation: {
          include: {
            location: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Transform result so location name is easy to access
    const formattedUnits = units.map((unit) => ({
      ...unit,
      locationName: unit.unitlocation?.[0]?.location?.name || null,
    }));

    const paged = createPagedResponse(formattedUnits, page, limit, total);
    return successResponse(res, 200, "Units fetched successfully", paged, null);
  } catch (error: unknown) {
    if (error instanceof Error)
      return next(new ErrorHandler(error.message, 400));
    return next(new ErrorHandler("An unknown error occurred", 500));
  }
};

export const getUnitById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const unit = await prisma.unit.findUnique({
      where: { id: Number(id) },
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
        address: true,
        unitlocation: {
          select: {
            locationId: true,
            location: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!unit) {
      return next(new ErrorHandler("Unit not found", 404));
    }

    // Add location info directly into the existing unit object
    const responseData = {
      ...unit,
      locationId: unit.unitlocation?.[0]?.locationId || null,
      locationName: unit.unitlocation?.[0]?.location?.name || null,
    };

    return successResponse(
      res,
      200,
      "Unit fetched successfully",
      responseData,
      null
    );
  } catch (error: unknown) {
    if (error instanceof Error)
      return next(new ErrorHandler(error.message, 400));
    return next(new ErrorHandler("An unknown error occurred", 500));
  }
};

export const createUnit = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req?.user?.id;
    const {
      name,
      description,
      identificationNumber,
      status,
      addressLine1,
      addressLine2,
      addressLine3,
      buildingName,
      unitNumber,
      abbriviatedName,
      floor,
      neighborhood,
      nearbyLandmark,
      city,
      district,
      county,
      state,
      province,
      country,
      countryCode,
      postalCode,
      zipCode,
      poBoxNumber,
      latitude,
      longitude,
      timezone,
      geohash,
      formatted,
      placeId,
      locationId,
    } = SanitizeInput(req.body);

    await checkDuplicates({
      model: "unit",
      fields: ["name", "identificationNumber"],
      values: { name, identificationNumber },
    });

    const address = await prisma.address.create({
      data: {
        addressLine1,
        addressLine2,
        addressLine3,
        buildingName,
        unitNumber,
        floor,
        neighborhood,
        landmark: nearbyLandmark,
        city,
        district,
        county,
        state,
        province,
        country,
        countryCode,
        postalCode,
        zipCode,
        poBoxNumber,
        latitude,
        longitude,
        timezone,
        geohash,
        formatted,
        placeId,
      },
    });

    const uuid = await generateNextCode(prisma.unit, "uuid", "UNIT");

    const unit = await prisma.unit.create({
      data: {
        uuid,
        name,
        abbriviatedName,
        description,
        identificationNumber,
        createdBy: Number(userId),
        addressId: address.id,
        status: status ?? true,
      },
      include: {
        address: true,
      },
    });
    if (locationId) {
      await prisma.unitLocation.create({
        data: {
          unitId: unit.id,
          locationId: Number(locationId),
          createdBy: Number(userId),
          updatedBy: Number(userId),
          status: true,
        },
      });
    }

    return successResponse(res, 201, "Unit created successfully", unit, null);
  } catch (error: unknown) {
    if (error instanceof Error)
      return next(new ErrorHandler(error.message, 400));
    return next(new ErrorHandler("An unknown error occurred", 500));
  }
};

export const updateUnit = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userId = req?.user?.id;

    const findUnit = await prisma.unit.findUnique({
      where: { id: Number(id) },
      include: { address: true, unitlocation: true },
    });

    if (!findUnit) {
      return next(new ErrorHandler("Unit not found", 404));
    }

    const {
      name,
      description,
      identificationNumber,
      status,
      addressLine1,
      addressLine2,
      addressLine3,
      buildingName,
      unitNumber,
      floor,
      neighborhood,
      nearbyLandmark,
      city,
      district,
      county,
      state,
      province,
      country,
      countryCode,
      postalCode,
      zipCode,
      poBoxNumber,
      latitude,
      longitude,
      timezone,
      geohash,
      formatted,
      placeId,
      abbriviatedName,
      // locationId,
    } = SanitizeInput(req.body);

    // 🔹 Check duplicate name / identificationNumber
    await checkDuplicates({
      model: "unit",
      fields: [
        "name",
        ...(identificationNumber ? ["identificationNumber"] : []),
      ],
      values: { name, identificationNumber },
      excludeId: Number(id),
    });

    // 🔹 Update address
    await prisma.address.update({
      where: { id: Number(findUnit.addressId) },
      data: {
        addressLine1,
        addressLine2,
        addressLine3,
        buildingName,
        unitNumber,
        floor,
        neighborhood,
        landmark: nearbyLandmark,
        city,
        district,
        county,
        state,
        province,
        country,
        countryCode,
        postalCode,
        zipCode,
        poBoxNumber,
        latitude,
        longitude,
        timezone,
        geohash,
        formatted,
        placeId,
      },
    });

    // 🔹 Update main unit details
    const updatedUnit = await prisma.unit.update({
      where: { id: Number(id) },
      data: {
        name,
        abbriviatedName,
        description,
        identificationNumber,
        status,
        updatedBy: Number(userId),
        updatedAt: new Date(),
      },
      include: { address: true, unitlocation: true },
    });

    // 🔹 Update or create unit-location mapping
    // if (locationId) {
    //   if (findUnit.unitlocation.length > 0) {
    //     // Update existing mapping
    //     await prisma.unitLocation.update({
    //       where: { id: findUnit.unitlocation[0].id },
    //       data: {
    //         locationId: Number(locationId),
    //         updatedBy: Number(userId),
    //       },
    //     });
    //   } else {
    //     // Create new mapping
    //     await prisma.unitLocation.create({
    //       data: {
    //         unitId: Number(id),
    //         locationId: Number(locationId),
    //         createdBy: Number(userId),
    //         updatedBy: Number(userId),
    //       },
    //     });
    //   }
    // }

    return successResponse(
      res,
      200,
      "Unit updated successfully",
      updatedUnit,
      null
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      return next(new ErrorHandler(error.message, 400));
    }
    return next(new ErrorHandler("An unknown error occurred", 500));
  }
};

export const deleteUnit = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const unit = await prisma.unit.findUnique({
      where: { id: Number(id) },
    });

    if (!unit) {
      return next(new ErrorHandler("Unit not found", 404));
    }

    await prisma.unit.delete({
      where: { id: Number(id) },
    });

    return successResponse(res, 200, "Unit deleted successfully", null, null);
  } catch (error: unknown) {
    if (error instanceof Error)
      return next(new ErrorHandler(error.message, 400));
    return next(new ErrorHandler("An unknown error occurred", 500));
  }
};
