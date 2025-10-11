import winston from "winston";

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "debug",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.simple(),
  ),
  transports: [
    new winston.transports.Console({
      level: process.env.LOG_LEVEL || "debug",
    }),
  ],
});

export default logger;
