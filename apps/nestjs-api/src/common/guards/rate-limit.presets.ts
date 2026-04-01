import { RateLimit, RateLimitConfig } from './rate-limit.decorator';

/** 10 requests per 60s — for unauthenticated auth endpoints, keyed by IP */
export const RateLimitAuth = (override?: Partial<RateLimitConfig>) =>
  RateLimit({ limit: 10, windowSeconds: 60, ...override });

/** 60 requests per 60s — for GET / read endpoints */
export const RateLimitRead = (override?: Partial<RateLimitConfig>) =>
  RateLimit({ limit: 60, windowSeconds: 60, ...override });

/** 30 requests per 60s — for POST/PUT/DELETE mutations */
export const RateLimitWrite = (override?: Partial<RateLimitConfig>) =>
  RateLimit({ limit: 30, windowSeconds: 60, ...override });

/** 10 requests per 60s — for expensive operations like AI chat */
export const RateLimitExpensive = (override?: Partial<RateLimitConfig>) =>
  RateLimit({ limit: 10, windowSeconds: 60, ...override });
