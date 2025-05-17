import { BadRequestError } from './app/errors';
import z from 'zod';

export function validateWithSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new BadRequestError(JSON.parse(result.error.message));
  }
  return result.data;
}

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export const logEvent = (level: LogLevel, message: string, details?: any) => {
  const logMessage = `[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}`;

  switch (level) {
    case 'info':
      console.info(logMessage, details ? details : '');
      break;
    case 'warn':
      console.warn(logMessage, details ? details : '');
      break;
    case 'error':
      console.error(logMessage, details ? details : '');
      break;
    case 'debug':
      console.debug(logMessage, details ? details : '');
      break;
    default:
      console.log(logMessage, details ? details : '');
  }
};
