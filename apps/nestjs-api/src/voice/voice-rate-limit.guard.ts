import { CanActivate, HttpException, Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class VoiceRateLimitGuard implements CanActivate {
  private readonly MAX_DAILY_REQUESTS = 500;
  private readonly MAX_DAILY_AUDIO_SECONDS = 20000;
  private readonly TTL = 90000; // 25 hours in seconds

  constructor(private readonly redis: RedisService) {}

  async canActivate(): Promise<boolean> {
    const dateKey = new Date().toISOString().slice(0, 10);
    const requestsKey = `voice:daily:requests:${dateKey}`;

    const current = (await this.redis.get<number>(requestsKey)) ?? 0;
    if (current >= this.MAX_DAILY_REQUESTS) {
      throw new HttpException('Daily voice command limit reached. Try again tomorrow.', 429);
    }
    await this.redis.set(requestsKey, current + 1, this.TTL);
    return true;
  }

  async trackAudioDuration(seconds: number): Promise<void> {
    const dateKey = new Date().toISOString().slice(0, 10);
    const audioKey = `voice:daily:audio-seconds:${dateKey}`;
    const current = (await this.redis.get<number>(audioKey)) ?? 0;
    await this.redis.set(audioKey, current + seconds, this.TTL);
  }

  async checkAudioQuota(estimatedSeconds: number): Promise<void> {
    const dateKey = new Date().toISOString().slice(0, 10);
    const audioKey = `voice:daily:audio-seconds:${dateKey}`;
    const current = (await this.redis.get<number>(audioKey)) ?? 0;
    if (current + estimatedSeconds > this.MAX_DAILY_AUDIO_SECONDS) {
      throw new HttpException('Daily audio quota reached. Try again tomorrow.', 429);
    }
  }
}
