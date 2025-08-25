import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import fs from "fs";
import path from "path";

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define custom log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Define the base format for file logging
const baseFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DDTHH:mm:ss.SSSZ" }), // ISO format
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Define console format for development with level visibility
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.printf(
    (info) => `${info.timestamp} [${info.level.toUpperCase()}]: ${info.message}`
  )
);

// Create the logger
const logger = winston.createLogger({
  levels,
  format: baseFormat,
  defaultMeta: { service: "skiddly-ai" },
  transports: [],
});

// Add transports based on environment
if (process.env.NODE_ENV !== "production") {
  // Development: Console transport + File transport for debugging
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
      level: "debug",
    })
  );
  // Add file transport for development as well
  logger.add(
    new DailyRotateFile({
      filename: "logs/combined-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      maxFiles: "7d", // Keep 7 days in development
      level: "debug",
      format: baseFormat,
    })
  );
  // Error file transport for development
  logger.add(
    new DailyRotateFile({
      filename: "logs/error-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      maxFiles: "7d", // Keep 7 days in development
      level: "error",
      format: baseFormat,
    })
  );
} else {
  // Production: File transports only (no console)
  // Daily rotate file transport
  logger.add(
    new DailyRotateFile({
      filename: "logs/combined-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      maxFiles: "30d",
      level: "info",
      format: baseFormat,
    })
  );
  // Error file transport (separate file for errors)
  logger.add(
    new DailyRotateFile({
      filename: "logs/error-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      maxFiles: "30d",
      level: "error",
      format: baseFormat,
    })
  );
  // Sentry transport (only for errors)
  if (process.env.SENTRY_DSN) {
    const SentryTransport = require("winston-transport-sentry-node");
    logger.add(
      new SentryTransport({
        sentry: {
          dsn: process.env.SENTRY_DSN,
          environment: process.env.NODE_ENV,
        },
        level: "error",
      })
    );
  }
}

// Create a stream object for Morgan HTTP logging
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

export default logger;
