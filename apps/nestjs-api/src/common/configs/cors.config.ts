import { EnvironmentVariables } from './env.config';

const DEFAULT_ORIGINS = ['http://localhost:4200', 'http://localhost:4201'];

export function getCorsOrigins(): string[] {
  const envOrigins = process.env[EnvironmentVariables.CORS_ORIGINS];
  if (!envOrigins) return DEFAULT_ORIGINS;
  return envOrigins.split(',').map((o) => o.trim());
}
