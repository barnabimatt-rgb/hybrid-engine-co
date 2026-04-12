import pino from 'pino';
import config from '../config.js';

const logger = pino({
  level: config.logLevel,
  transport: config.isDev
    ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:HH:MM:ss' } }
    : undefined,
  base: { service: 'hybrid-engine-co' },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export function createLogger(module) {
  return logger.child({ module });
}

export default logger;
