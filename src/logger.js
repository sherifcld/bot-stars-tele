import pino from "pino";
import { createLog } from "./repositories/logsRepo.js";

export const logger = pino({
  level: "info",
  transport:
    process.env.NODE_ENV === "production"
      ? undefined
      : {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
          },
        },
});

const originalError = logger.error.bind(logger);

logger.error = (obj, msg, ...args) => {
  const meta = typeof obj === "object" ? obj : {};
  const message = typeof obj === "string" && !msg ? obj : msg || "";
  try {
    createLog({
      level: "error",
      message,
      meta,
    }).catch(() => {});
  } catch {
  }
  return originalError(obj, msg, ...args);
};
