import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { EnvironmentVariables } from '../common';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;

  constructor(private readonly config: ConfigService) {
    this.client = new Redis({
      host: this.config.getOrThrow<string>(EnvironmentVariables.REDIS_HOST),
      port: this.config.get<number>(EnvironmentVariables.REDIS_PORT, 6379),
      password: this.config.get<string>(EnvironmentVariables.REDIS_PASSWORD),
    });
    this.client.on('connect', () => this.logger.log('Connected to Redis'));
    this.client.on('error', (err) => this.logger.error('Redis error', err));
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const json = JSON.stringify(value);
    if (ttlSeconds) {
      await this.client.set(key, json, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, json);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async resetTTL(key: string, ttlSeconds: number): Promise<void> {
    await this.client.expire(key, ttlSeconds);
  }

  async keys(pattern: string): Promise<string[]> {
    return this.client.keys(pattern);
  }

  onModuleDestroy() {
    this.client.disconnect();
    this.logger.log('Redis disconnected');
  }
}
