import { Request, Response, NextFunction } from "express";
import { ErrorHandler } from "../utils/ErrorHandler";
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from "@prisma/client/runtime/library";

const globalErrorHandler = (
  err: Error | ErrorHandler,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Default values
  let statusCode = 500;
  let message = "Internal server error";

  // If it's a custom ErrorHandler instance
  if (err instanceof ErrorHandler) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Prisma-specific error handling
  if (err instanceof PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2003":
        message = `The foreign key constraint failed. Please check your references.`;
        statusCode = 400;
        break;
      case "P2002": {
        const target = err.meta?.target as string[] | string | undefined;
        const fields = Array.isArray(target) ? target.join(", ") : target;

        message = fields
          ? `The value for ${fields} must be unique. Please choose a different one.`
          : `A unique constraint failed. Please provide a different value.`;
        statusCode = 400;
        break;
      }

      case "P2025":
        message = `The requested resource does not exist or has already been deleted.`;
        statusCode = 404;
        break;

      default:
        message = "A database error occurred. Please try again later.";
        statusCode = 500;
        break;
    }
  }

  if (err instanceof PrismaClientValidationError) {
    message = "Validation failed. Please check your input.";
    statusCode = 400;
  }

  // JWT Errors
  if (err.name === "JsonWebTokenError") {
    message = "Invalid token. Please log in again.";
    statusCode = 401;
  }

  if (err.name === "TokenExpiredError") {
    message = "Your session has expired. Please log in again.";
    statusCode = 401;
  }

  // Final response object
  const errorResponse: Record<string, any> = {
    success: false,
    message,
  };

  // Include stack trace and full error in development
  if (process.env.NODE_ENV === "development") {
    errorResponse.stack = err.stack;
    errorResponse.error = err;
  }

  // Log the error for debugging purposes
  if (process.env.NODE_ENV !== "production") {
    console.error("Unhandled error:", err);
  }
  res.json({ status: false, code: statusCode, errorResponse });
};

export default globalErrorHandler;
