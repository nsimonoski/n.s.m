import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

/** Logs every HTTP request with method, path, status code, and duration. Uses warn level for 4xx/5xx. */
@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl } = req;
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      const { statusCode } = res;

      if (statusCode >= 400) {
        this.logger.warn(`${method} ${originalUrl} ${statusCode} ${duration}ms`);
      } else {
        this.logger.log(`${method} ${originalUrl} ${statusCode} ${duration}ms`);
      }
    });

    next();
  }
}
