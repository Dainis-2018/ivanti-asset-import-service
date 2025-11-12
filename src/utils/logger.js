const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Determine log directory from environment variable or use default
const logDirectory = process.env.LOG_PATH || path.join(__dirname, '../../logs');
const logLevel = process.env.LOG_LEVEL || 'info';

// Store the initial global log level
const globalLogLevel = logLevel;

// Custom format for console and file
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...rest }) => {
    let logMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    
    // If there are other properties (like a stack trace), append them.
    const restString = JSON.stringify(rest);
    if (restString !== '{}') {
      logMessage += ` ${restString}`;
    }
    return logMessage;
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
let bufferTruncated = false;
const MAX_BUFFER_SIZE = 1000;

/**
 * Add message to buffer for Ivanti logging
 */
const addToBuffer = (message) => {
  if (logMessageBuffer.length >= MAX_BUFFER_SIZE) {
    logMessageBuffer.shift(); // Remove oldest message
    bufferTruncated = true;
  }
  logMessageBuffer.push(message);
};

/**
 * Get all buffered messages
 */
const getBufferedMessages = () => {
  const messages = [...logMessageBuffer];
  if (bufferTruncated) {
    messages.unshift('[...log truncated due to size limit...]\n');
  }
  return messages.join('\n');
};

/**
 * Clear the message buffer
 */
const clearBuffer = () => {
  logMessageBuffer = [];
  bufferTruncated = false;
};

/**
 * Enhanced logging methods that also add to buffer
 */
const enhancedLogger = {
  logInfo: (message) => {
    logger.info(message);
    // Only add to buffer if info level is enabled
    if (logger.levels[logger.level] >= logger.levels.info) {
      addToBuffer(`INFO: ${message}`);
    }
  },
  logDebug: (message) => {
    logger.debug(message);
    // Only add to buffer if debug level is enabled
    if (logger.levels[logger.level] >= logger.levels.debug) {
      addToBuffer(`DEBUG: ${message}`);
    }
  },
  logWarning: (message) => {
    logger.warn(message);
    // Only add to buffer if warn level is enabled
    if (logger.levels[logger.level] >= logger.levels.warn) {
      addToBuffer(`WARNING: ${message}`);
    }
  },
  logError: (message, stack = '') => {
    const fullMessage = stack ? `${message}\n${stack}` : message;
    logger.error(message, { stack });
    // Only add to buffer if error level is enabled
    if (logger.levels[logger.level] >= logger.levels.error) {
      addToBuffer(`ERROR: ${fullMessage}`);
    }
  },
  setLogLevel: (level) => {
    const validLevels = ['error', 'warn', 'info', 'debug'];
    const lowerLevel = level.toLowerCase();
    if (validLevels.includes(lowerLevel)) {
      logger.level = lowerLevel;
      enhancedLogger.logInfo(`Log level set to: ${lowerLevel}`);
    } else {
      logger.warn(`Invalid log level: ${level}. Using current level.`);
    }
  },
  getBufferedMessages,
  /**
   * Reset log level to the initial global default
   */
  resetLogLevel: () => {
    logger.level = globalLogLevel;
    // Use the enhanced logger to ensure the reset message is buffered
    enhancedLogger.logInfo(`Log level reset to global default: ${globalLogLevel}`);
  },
  /**
   * Gracefully close the logger and exit the process.
   * This ensures all logs are written to file before exiting.
   * @param {number} exitCode - The exit code for the process.
   */
  closeAndExit: (exitCode = 0) => {
    // Filter for transports that have a 'close' method (e.g., file transports)
    const closableTransports = logger.transports.filter(transport => typeof transport.close === 'function');
    let pendingTransports = closableTransports.length;

    if (pendingTransports === 0) {
      // If no closable transports, exit immediately
      process.exit(exitCode);
      return;
    }

    closableTransports.forEach(transport => {
      transport.on('finish', () => {
        pendingTransports--;
        if (pendingTransports === 0) {
          process.exit(exitCode);
        }
      });
      transport.on('error', (err) => { logger.error('Error closing transport:', err); process.exit(1); }); // Log error and exit
      transport.close();
    });
  },
  clearBuffer,
  logLevel
};

module.exports = enhancedLogger;
