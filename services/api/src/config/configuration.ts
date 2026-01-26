import * as Joi from 'joi';

export interface AppConfig {
  nodeEnv: string;
  port: number;
  database: {
    url: string;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
  };
  meilisearch: {
    host: string;
    apiKey: string;
  };
  storage: {
    endpoint: string;
    accessKey: string;
    secretKey: string;
    bucket: string;
    publicUrl: string;
  };
  cors: {
    origins: string[];
  };
}

export const configuration = (): AppConfig => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    url: process.env.DATABASE_URL || '',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
  },
  jwt: {
    secret: process.env.JWT_SECRET || '',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET || '',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  meilisearch: {
    host: process.env.MEILISEARCH_HOST || 'http://localhost:7700',
    apiKey: process.env.MEILISEARCH_API_KEY || '',
  },
  storage: {
    endpoint: process.env.STORAGE_ENDPOINT || '',
    accessKey: process.env.STORAGE_ACCESS_KEY || '',
    secretKey: process.env.STORAGE_SECRET_KEY || '',
    bucket: process.env.STORAGE_BUCKET || 'hypermarket',
    publicUrl: process.env.STORAGE_PUBLIC_URL || '',
  },
  cors: {
    origins: (process.env.CORS_ORIGINS || '').split(',').filter(Boolean),
  },
});

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'staging', 'production').default('development'),
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().required(),
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().optional().allow(''),
  JWT_SECRET: Joi.string().required().min(32),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().required().min(32),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
  MEILISEARCH_HOST: Joi.string().default('http://localhost:7700'),
  MEILISEARCH_API_KEY: Joi.string().optional().allow(''),
  STORAGE_ENDPOINT: Joi.string().optional().allow(''),
  STORAGE_ACCESS_KEY: Joi.string().optional().allow(''),
  STORAGE_SECRET_KEY: Joi.string().optional().allow(''),
  STORAGE_BUCKET: Joi.string().default('hypermarket'),
  STORAGE_PUBLIC_URL: Joi.string().optional().allow(''),
  CORS_ORIGINS: Joi.string().optional().allow(''),
});
