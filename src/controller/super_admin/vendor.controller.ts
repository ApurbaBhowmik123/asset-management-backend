import { Request, Response, NextFunction } from "express";

import { generateNextCode } from "@src/utils/codeGenerator";
import { createPagedResponse } from "@utils/pagedResponse";
import { successResponse } from "@utils/successResponse";
import { ErrorHandler } from "@utils/ErrorHandler";
import { checkDuplicates } from "@src/utils/checkDuplicates";
import { SanitizeInput } from "@src/helpers/sanitizeInput";
import prisma from "../../utils/prisma";


export const getVendors = async (
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

    const allowedSortFields = ["name", "gstNumber", "createdAt"];
    const finalSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

    const whereClause = search
      ? {
          OR: [
            { name: { contains: search } },
            { gstNumber: { contains: search } },
          ],
        }
      : {};

    const total = await prisma.vendor.count({ where: whereClause });

    const vendors = await prisma.vendor.findMany({
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
      },
    });

    const paged = createPagedResponse(vendors, page, limit, total);
    return successResponse(
      res,
      200,
      "Vendors fetched successfully",
      paged,
      null
    );
  } catch (error: unknown) {
    if (error instanceof Error)
      return next(new ErrorHandler(error.message, 400));
    return next(new ErrorHandler("An unknown error occurred", 500));
  }
};

export const getVendorById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const vendor = await prisma.vendor.findUnique({
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
      },
    });

    if (!vendor) {
      return next(new ErrorHandler("Vendor not found", 404));
    }

    return successResponse(
      res,
      200,
      "Vendor fetched successfully",
      vendor,
      null
    );
  } catch (error: unknown) {
    if (error instanceof Error)
      return next(new ErrorHandler(error.message, 400));
    return next(new ErrorHandler("An unknown error occurred", 500));
  }
};
export const createVendor = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req?.user?.id;

    const {
      name,
      email,
      gstNumber,
      vendorType,
      mobile,
      contactPerson,
      contactNumber,
      bankName,
      bankAccountNumber,
      bankIfscCode,
      panNumber,
      identificationNumber,
      // Required
      addressLine1,

      // Optional address fields
      addressLine2,
      addressLine3,
      buildingName,
      unitNumber,
      floor,
      neighborhood,
      landmark,
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
    } = SanitizeInput(req.body);

    if (!addressLine1) {
      return next(new ErrorHandler("Address line 1 is required", 400));
    }

    await checkDuplicates({
      model: "vendor",
      fields: ["name", "email", "gstNumber", "mobile", "panNumber"],
      values: { name, email, gstNumber, mobile, panNumber },
    });

    const uuid = await generateNextCode(prisma.vendor, "uuid", "VN");

    const address = await prisma.address.create({
      data: {
        addressLine1,
        addressLine2,
        addressLine3,
        buildingName,
        unitNumber,
        floor,
        neighborhood,
        landmark,
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

    const vendor = await prisma.vendor.create({
      data: {
        uuid,
        identificationNumber,
        name,
        email,
        gstNumber,
        vendorType,
        mobile,
        addressId: address.id,
        contactPerson,
        contactNumber,
        bankName,
        bankAccountNumber,
        bankIfscCode,
        panNumber,
        createdBy: Number(userId),
      },
    });

    return successResponse(
      res,
      201,
      "Vendor created successfully",
      vendor,
      null
    );
  } catch (error: unknown) {
    if (error instanceof ErrorHandler) return next(error);
    if (error instanceof Error)
      return next(new ErrorHandler(error.message, 400));
    return next(new ErrorHandler("An unknown error occurred", 500));
  }
};

export const updateVendor = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userId = req?.user?.id;

    const existingVendor = await prisma.vendor.findUnique({
      where: { id: Number(id) },
    });

    if (!existingVendor) {
      return next(new ErrorHandler("Vendor not found", 404));
    }

    const {
      name,
      email,
      gstNumber,
      vendorType,
      mobile,
      contactPerson,
      contactNumber,
      bankName,
      bankAccountNumber,
      bankIfscCode,
      panNumber,
      identificationNumber,
      addressLine1,
      addressLine2,
      addressLine3,
      buildingName,
      unitNumber,
      floor,
      neighborhood,
      landmark,
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
    } = SanitizeInput(req.body);

    if (!addressLine1) {
      return next(new ErrorHandler("Address line 1 is required", 400));
    }

    await checkDuplicates({
      model: "vendor",
      fields: ["name", "email", "gstNumber", "mobile", "panNumber"],
      values: { name, email, gstNumber, mobile, panNumber },
      excludeId: Number(id),
    });

    if (existingVendor.addressId) {
      await prisma.address.update({
        where: { id: existingVendor.addressId },
        data: {
          addressLine1,
          addressLine2,
          addressLine3,
          buildingName,
          unitNumber,
          floor,
          neighborhood,
          landmark,
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
          updatedAt: new Date(),
        },
      });
    }

    const updated = await prisma.vendor.update({
      where: { id: Number(id) },
      data: {
        name,
        identificationNumber,
        email,
        gstNumber,
        vendorType,
        mobile,
        contactPerson,
        contactNumber,
        bankName,
        bankAccountNumber,
        bankIfscCode,
        panNumber,
        updatedBy: Number(userId),
        updatedAt: new Date(),
      },
    });

    return successResponse(
      res,
      200,
      "Vendor updated successfully",
      updated,
      null
    );
  } catch (error: unknown) {
    if (error instanceof Error)
      return next(new ErrorHandler(error.message, 400));
    return next(new ErrorHandler("An unknown error occurred", 500));
  }
};

export const deleteVendor = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const vendor = await prisma.vendor.findUnique({
      where: { id: Number(id) },
    });

    if (!vendor) {
      return next(new ErrorHandler("Vendor not found", 404));
    }

    await prisma.vendor.delete({
      where: { id: Number(id) },
    });

    return successResponse(res, 200, "Vendor deleted successfully", null, null);
  } catch (error: unknown) {
    if (error instanceof Error)
      return next(new ErrorHandler(error.message, 400));
    return next(new ErrorHandler("An unknown error occurred", 500));
  }
};
