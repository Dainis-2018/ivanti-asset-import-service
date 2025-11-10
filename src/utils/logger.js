const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Determine log directory from environment variable or use default
const logDirectory = process.env.LOG_PATH || path.join(__dirname, '../../logs');
const logLevel = process.env.LOG_LEVEL || 'info';

// Custom format for console and file
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message }) => {
    return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
  })
);

// Create logger
const logger = winston.createLogger({
  level: logLevel,
  format: customFormat,
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        customFormat
      )
    }),
    // Daily rotate file transport
    new DailyRotateFile({
      dirname: logDirectory,
      filename: 'asset-import-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      format: customFormat
    })
  ]
});

// Log message buffer for Ivanti logging
let logMessageBuffer = [];
const MAX_BUFFER_SIZE = 1000;

/**
 * Add message to buffer for Ivanti logging
 */
const addToBuffer = (message) => {
  logMessageBuffer.push(message);
  if (logMessageBuffer.length > MAX_BUFFER_SIZE) {
    logMessageBuffer.shift(); // Remove oldest message
  }
};

/**
 * Get all buffered messages
 */
const getBufferedMessages = () => {
  return logMessageBuffer.join('\n');
};

/**
 * Clear the message buffer
 */
const clearBuffer = () => {
  logMessageBuffer = [];
};

/**
 * Enhanced logging methods that also add to buffer
 */
const enhancedLogger = {
  logInfo: (message) => {
    logger.info(message);
    addToBuffer(`INFO: ${message}`);
  },
  logDebug: (message) => {
    logger.debug(message);
    addToBuffer(`DEBUG: ${message}`);
  },
  logWarning: (message) => {
    logger.warn(message);
    addToBuffer(`WARNING: ${message}`);
  },
  logError: (message, stack = '') => {
    const fullMessage = stack ? `${message}\n${stack}` : message;
    logger.error(fullMessage);
    addToBuffer(`ERROR: ${fullMessage}`);
  },
  setLogLevel: (level) => {
    const validLevels = ['error', 'warn', 'info', 'debug'];
    const lowerLevel = level.toLowerCase();
    if (validLevels.includes(lowerLevel)) {
      logger.level = lowerLevel;
    } else {
      logger.warn(`Invalid log level: ${level}. Using current level.`);
    }
  },
  getBufferedMessages,
  clearBuffer,
  logLevel
};

module.exports = enhancedLogger;
