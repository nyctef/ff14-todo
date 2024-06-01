import { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * https://stackoverflow.com/questions/51391080/handling-errors-in-express-async-middleware
 * https://expressjs.com/en/guide/error-handling.html
 */
export const asyncHandler =
  (fn: RequestHandler) => (req: Request, res: Response, next: NextFunction) => {
    return Promise.resolve(fn(req, res, next)).catch(next);
  };
