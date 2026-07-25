import * as winston from 'winston';
import 'winston-daily-rotate-file';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
    return `[${timestamp}] ${level}: ${stack || message}${metaStr}`;
  }),
);

const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json(),
);

const dailyRotateTransport = new (winston.transports as any).DailyRotateFile({
  filename: 'logs/unicampus-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '30d',
});

const errorRotateTransport = new (winston.transports as any).DailyRotateFile({
  filename: 'logs/unicampus-error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '30d',
});

export const winstonLogger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: process.env.NODE_ENV === 'production' ? prodFormat : devFormat,
  defaultMeta: { service: 'unicampus-erp' },
  transports: [
    new winston.transports.Console(),
    dailyRotateTransport,
    errorRotateTransport,
  ],
  // NEVER log sensitive fields
  silent: false,
});

/** Redact sensitive fields before logging */
export function sanitizeForLog(obj: Record<string, any>): Record<string, any> {
  const SENSITIVE_KEYS = ['password', 'password_hash', 'token', 'secret', 'authorization', 'cookie'];
  const result = { ...obj };
  for (const key of SENSITIVE_KEYS) {
    if (result[key]) result[key] = '[REDACTED]';
  }
  return result;
}
