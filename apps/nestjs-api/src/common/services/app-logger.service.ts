import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { createLogger, format, transports, Logger } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { lookup } from 'geoip-lite';
import { join } from 'path';

const LOG_DIR = join(process.cwd(), 'logs');

@Injectable()
export class AppLogger implements NestLoggerService {
  private readonly logger: Logger;

  constructor() {
    this.logger = createLogger({
      level: 'info',
      format: format.combine(format.timestamp(), format.json()),
      transports: [
        new transports.Console({
          format: format.combine(
            format.colorize(),
            format.printf(({ timestamp, level, message, context, ...meta }) => {
              const ctx = context ? `[${context}] ` : '';
              const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
              return `${timestamp} ${level}: ${ctx}${message}${extra}`;
            }),
          ),
        }),
        new DailyRotateFile({
          dirname: LOG_DIR,
          filename: 'app-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '10m',
          maxFiles: '30d',
        }),
        new DailyRotateFile({
          dirname: LOG_DIR,
          filename: 'error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          level: 'error',
          maxSize: '10m',
          maxFiles: '30d',
        }),
      ],
    });
  }

  log(message: string, context?: string): void {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string): void {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string): void {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string): void {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string): void {
    this.logger.verbose(message, { context });
  }

  /** Log a structured login/logout activity event with geo-location. */
  logActivity(event: {
    action: 'login' | 'logout' | 'guest-login';
    username: string;
    ip: string;
    userAgent: string;
  }): void {
    const geo = lookup(event.ip);
    const location = geo
      ? { country: geo.country, region: geo.region, city: geo.city, ll: geo.ll }
      : null;

    this.logger.info(event.action, { ...event, location, context: 'Activity' });
  }
}
