const axios = require('axios');
const https = require('https');
const logger = require('./logger');

// Flag to ensure SSL warning is logged only once
let sslWarningLogged = false;

/**
 * Execute a web request with error handling
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
 * @param {string} url - Request URL
 * @param {object} data - Request body data
 * @param {object} headers - Request headers
 * @param {number} timeout - Request timeout in milliseconds (default: 60000)
 * @param {object} options - Additional options (rejectUnauthorized, logPayload)
 * @returns {Promise<object>} - Response object with status, data, and headers
 */
const executeWebRequest = async (method, url, data = null, headers = {}, timeout = 60000, options = {}) => {
  try {
    const config = {
      method: method.toUpperCase(),
      url,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      timeout,
      validateStatus: () => true // Don't throw on any status code
    };

    // SSL/TLS certificate handling
    // Check environment variable or options
    const envVar = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    const isDisabledByEnv = envVar === '0' || envVar?.toLowerCase() === 'false';
    const rejectUnauthorized = !isDisabledByEnv &&
                               options.rejectUnauthorized !== false;

    if (!rejectUnauthorized) {
      if (!sslWarningLogged) {
        logger.logInfo('SSL certificate validation is disabled by configuration (NODE_TLS_REJECT_UNAUTHORIZED).');
        sslWarningLogged = true;
      }
      config.httpsAgent = new https.Agent({
        rejectUnauthorized: false
      });
    }

    if (data && (method.toUpperCase() === 'POST' || method.toUpperCase() === 'PUT' || method.toUpperCase() === 'PATCH')) {
      config.data = data;
    }

    if (method.toUpperCase() === 'GET' && data) {
      config.params = data;
    }

    const { logPayload = true } = options;

    logger.logDebug(`Executing ${method} request to: ${url}`);
    // For debugging, log the payload of POST/PUT requests
    if (config.data && logPayload) {
      logger.logDebug(`Request Payload: ${JSON.stringify(config.data)}`);
    }

    const response = await axios(config);

    logger.logDebug(`Response status: ${response.status}`);

    return {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      headers: response.headers
    };
  } catch (error) {
    logger.logError(`Web request failed: ${error.message}`, error.stack);
    
    if (error.response) {
      // Server responded with error status
      return {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers,
        error: true
      };
    } else if (error.request) {
      // Request made but no response received
      return {
        status: 0,
        statusText: 'No response',
        data: { error: 'No response from server', message: error.message },
        error: true
      };
    } else {
      // Error in request configuration
      return {
        status: 0,
        statusText: 'Request error',
        data: { error: 'Request configuration error', message: error.message },
        error: true
      };
    }
  }
};

module.exports = executeWebRequest;
