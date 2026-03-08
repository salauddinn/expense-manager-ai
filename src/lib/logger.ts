/**
 * Centralized logger with log levels.
 *
 * In production, only 'error' level logs are emitted.
 * In development, all levels are active.
 *
 * Usage:
 *   import { logger } from '@/lib/logger';
 *   logger.info('User action', { detail: 'value' });
 *   logger.error('Something failed', error);
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const IS_PROD = import.meta.env.PROD;
const MIN_LEVEL: LogLevel = IS_PROD ? 'error' : 'debug';

function shouldLog(level: LogLevel): boolean {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[MIN_LEVEL];
}

function formatMessage(level: LogLevel, message: string): string {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
}

export const logger = {
  debug(message: string, ...args: unknown[]) {
    if (shouldLog('debug')) console.debug(formatMessage('debug', message), ...args);
  },

  info(message: string, ...args: unknown[]) {
    if (shouldLog('info')) console.info(formatMessage('info', message), ...args);
  },

  warn(message: string, ...args: unknown[]) {
    if (shouldLog('warn')) console.warn(formatMessage('warn', message), ...args);
  },

  error(message: string, ...args: unknown[]) {
    if (shouldLog('error')) console.error(formatMessage('error', message), ...args);
  },
};
