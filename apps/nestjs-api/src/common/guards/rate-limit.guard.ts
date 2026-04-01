import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Response } from 'express';
import { RedisService } from '../../redis/redis.service';
import { RATE_LIMIT_KEY, RateLimitConfig } from './rate-limit.decorator';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly redis: RedisService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const config = this.reflector.getAllAndOverride<RateLimitConfig | undefined>(
      RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!config) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse<Response>();

    const controller = context.getClass().name;
    const handler = context.getHandler().name;
    const identity = request.session?.id ?? request.ip;
    const key = `rl:${controller}:${handler}:${identity}`;

    const current = (await this.redis.get<number>(key)) ?? 0;

    response.setHeader('X-RateLimit-Limit', config.limit);
    response.setHeader('X-RateLimit-Remaining', Math.max(0, config.limit - current - 1));

    if (current >= config.limit) {
      response.setHeader('Retry-After', config.windowSeconds);
      throw new HttpException('Too many requests', 429);
    }

    await this.redis.set(key, current + 1, config.windowSeconds);
    return true;
  }
}
