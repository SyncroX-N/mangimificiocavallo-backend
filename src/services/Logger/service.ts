import pino from "pino";

class LoggerService {
  private static instance: LoggerService;
  private readonly logger: pino.Logger;

  private constructor() {
    this.logger = pino({
      level: process.env.LOG_LEVEL || "info",
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
        },
      },
    });
  }

  static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
    }
    return LoggerService.instance;
  }

  error(message: string, error?: Error): void {
    if (error) {
      this.logger.error({ err: error }, message);
    } else {
      this.logger.error(message);
    }
  }

  warn(message: string): void {
    this.logger.warn(message);
  }

  info(message: string): void {
    this.logger.info(message);
  }

  http(message: string): void {
    this.logger.info({ type: "http" }, message);
  }

  debug(message: string): void {
    this.logger.debug(message);
  }
}

const Service = LoggerService.getInstance();

export { Service as LoggerService };
export const loggerService = Service;
