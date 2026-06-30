import { ErrorHandler } from "./ErrorHandler";
import prisma from "../utils/prisma";
import { PrismaClient } from "../../prisma/generated/prisma";


interface DuplicateCheckOptions<T extends keyof PrismaClient> {
  model: T;
  fields: string[];
  values: Record<string, any>;
  excludeId?: number;
}

export const checkDuplicates = async <T extends keyof PrismaClient>({
  model,
  fields,
  values,
  excludeId,
}: DuplicateCheckOptions<T>): Promise<void> => {
  const filteredFields = fields.filter(field => {
    const value = values[field];
    return value !== null && value !== undefined && value !== '';
  });

  if (filteredFields.length === 0) return;

  const whereConditions = filteredFields.map((field) => ({
    [field]: values[field],
  }));

  const where: any = {
    OR: whereConditions,
  };

  if (excludeId !== undefined) {
    where.NOT = { id: excludeId };
  }

  const duplicate = await (prisma as any)[model].findFirst({ where });

  if (duplicate) {
    for (const field of filteredFields) {
      if (duplicate[field] === values[field]) {
        throw new ErrorHandler(`${field} already exists`, 409);
      }
    }
    throw new ErrorHandler(`Duplicate ${String(model)} data`, 409);
  }
};
