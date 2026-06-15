import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";

export const validate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const errorArray = result.array({ onlyFirstError: false });

    const errorObject: Record<string, string[]> = {};

    errorArray.forEach((err: any) => {
      // Get the correct field name from the error object
      const field = err.path || err.param || "general";

      if (!errorObject[field]) {
        errorObject[field] = [];
      }
      errorObject[field].push(err.msg);
    });

    res.json({
      status: "validation_error",
      message: errorArray[0].msg || "Validation failed",
      data: errorObject,
      code: 422,
    });
    return;
  }
  next();
};
