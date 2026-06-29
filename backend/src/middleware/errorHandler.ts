import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // Express requires 4-arg signature to recognize error handlers
  _next: NextFunction
): void {
  logger.error('Unhandled error', { message: err.message, path: req.path, method: req.method });
  res.status(500).json({ error: 'Internal server error' });
}
