import { ConfigService } from '@nestjs/config';

const weakJwtSecrets = new Set(['change-this-secret', 'secret', 'jwt-secret']);
const allowedNodeEnvironments = new Set(['development', 'test', 'production']);
const jwtExpiresInPattern = /^(\d+)(s|m|h|d)$/;

type EnvironmentVariables = Record<string, unknown>;

export function validateEnvironment(config: EnvironmentVariables) {
  const nodeEnv = validateNodeEnv(config.NODE_ENV);
  const jwtSecret = validateJwtSecret(config.JWT_SECRET, nodeEnv);
  const corsOrigin = validateCorsOrigin(config.CORS_ORIGIN, nodeEnv);

  return {
    ...config,
    NODE_ENV: nodeEnv,
    DATABASE_URL: validateDatabaseUrl(config.DATABASE_URL),
    JWT_SECRET: jwtSecret,
    JWT_EXPIRES_IN: validateJwtExpiresIn(config.JWT_EXPIRES_IN),
    CORS_ORIGIN: corsOrigin,
  };
}

export function isProduction(configService: ConfigService) {
  return configService.get<string>('NODE_ENV') === 'production';
}

export function getJwtSecret(configService: ConfigService) {
  const jwtSecret = configService.get<string>('JWT_SECRET')?.trim();

  if (isProduction(configService)) {
    if (!jwtSecret) throw new Error('JWT_SECRET is required in production.');
    if (jwtSecret.length < 32 || weakJwtSecrets.has(jwtSecret)) throw new Error('JWT_SECRET is weak. Use a strong secret with at least 32 characters in production.');
  }

  if (!jwtSecret) throw new Error('JWT_SECRET is required. Define it in backend/.env.');
  if (weakJwtSecrets.has(jwtSecret)) throw new Error('JWT_SECRET uses an insecure default value. Replace it in backend/.env.');

  return jwtSecret;
}

export function getJwtExpiresIn(configService: ConfigService) {
  const jwtExpiresIn = configService.get<string>('JWT_EXPIRES_IN');
  if (!jwtExpiresIn) throw new Error('JWT_EXPIRES_IN is required. Define it in backend/.env.');
  return jwtExpiresIn;
}

export function getCorsOrigins(configService: ConfigService) {
  const corsOrigin = configService.get<string>('CORS_ORIGIN')?.trim();

  if (isProduction(configService) && !corsOrigin) throw new Error('CORS_ORIGIN is required in production.');

  if (corsOrigin) return corsOrigin.split(',').map((origin) => origin.trim()).filter(Boolean);

  return true;
}

function validateNodeEnv(value: unknown) {
  const nodeEnv = typeof value === 'string' && value.trim() ? value.trim() : 'development';
  if (!allowedNodeEnvironments.has(nodeEnv)) throw new Error('NODE_ENV must be one of: development, test, production.');
  return nodeEnv;
}

function validateDatabaseUrl(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) throw new Error('DATABASE_URL is required.');

  try {
    const databaseUrl = new URL(value);
    if (!['postgresql:', 'postgres:'].includes(databaseUrl.protocol)) throw new Error();
    return value.trim();
  } catch {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection URL.');
  }
}

function validateJwtSecret(value: unknown, nodeEnv: string) {
  if (typeof value !== 'string' || !value.trim()) throw new Error('JWT_SECRET is required.');
  const jwtSecret = value.trim();
  if (weakJwtSecrets.has(jwtSecret)) throw new Error('JWT_SECRET uses an insecure default value.');
  if (nodeEnv === 'production' && jwtSecret.length < 32) throw new Error('JWT_SECRET must have at least 32 characters in production.');
  return jwtSecret;
}

function validateJwtExpiresIn(value: unknown) {
  const jwtExpiresIn = typeof value === 'string' && value.trim() ? value.trim() : '8h';
  if (!jwtExpiresInPattern.test(jwtExpiresIn)) throw new Error('JWT_EXPIRES_IN must use a duration like 15m, 8h, or 7d.');
  return jwtExpiresIn;
}

function validateCorsOrigin(value: unknown, nodeEnv: string) {
  const corsOrigin = typeof value === 'string' ? value.trim() : '';
  if (nodeEnv === 'production' && !corsOrigin) throw new Error('CORS_ORIGIN is required in production.');
  if (!corsOrigin) return undefined;

  const origins = corsOrigin.split(',').map((origin) => origin.trim()).filter(Boolean);
  if (nodeEnv === 'production' && origins.includes('*')) throw new Error('CORS_ORIGIN cannot be "*" in production.');

  for (const origin of origins) {
    try {
      const url = new URL(origin);
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
    } catch {
      throw new Error(`CORS_ORIGIN contains an invalid origin: ${origin}`);
    }
  }

  return corsOrigin;
}
