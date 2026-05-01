import logger from 'jet-logger';
import { inspect } from 'node:util';

export const log = {
  info: (msg: string | Error, ...args: unknown[]) => {
    logger.info(msg instanceof Error ? msg.message : msg);
    args.forEach((arg) => {
      logger.info(inspect(arg, { depth: null, colors: true }));
    });
  },
  err: (msg: string | Error, ...args: unknown[]) => {
    logger.err(msg instanceof Error ? msg.message : msg, true);
    args.forEach((arg) => {
      logger.err(inspect(arg, { depth: null, colors: true }));
    });
  },
};
