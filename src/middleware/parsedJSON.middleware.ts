import { Request, Response, NextFunction } from 'express';
export const parseJsonFields = (fields: string[]) => (req: Request, res: Response, next: NextFunction) => {
  for (const field of fields) {
    if (req.body[field] && typeof req.body[field] === 'string') {
      try {
        req.body[field] = JSON.parse(req.body[field]);
      } catch (e) {
        return res.status(400).json({
          status: 'validation_error',
          message: `${field} must be valid JSON`,
          data: { [field]: [`${field} must be valid JSON`] },
          code: 422
        });
      }
    }
  }
  next();
};
