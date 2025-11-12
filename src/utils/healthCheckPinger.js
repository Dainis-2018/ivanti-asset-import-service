const axios = require('axios');
const logger = require('./logger');

class HealthCheckPinger {
  constructor() {
    this.intervalId = null;
    this.baseUrl = null; // Will be set during start()
    this.pingInterval = 5 * 60 * 1000; // 5 minutes
    this.activeProcesses = 0;
    this.isRunning = false;
    this.pingCount = 0;
  }

  /**
   * Start the health check pinger
   * @param {string} baseUrl - Base URL of the service
   */  
  initialize(baseUrl) {
    // Check if health check is explicitly disabled via environment variable
    if (process.env.ENABLE_HEALTH_CHECK_PINGER === 'false') {
      logger.logInfo('Health check pinger is disabled by configuration.');
      return; // Do not initialize if disabled
    }

    // Make ping interval configurable via environment variable
    const configuredIntervalMinutes = parseInt(process.env.HEALTH_CHECK_PING_INTERVAL_MINUTES, 10);
    if (!isNaN(configuredIntervalMinutes) && configuredIntervalMinutes > 0) {
      this.pingInterval = configuredIntervalMinutes * 60 * 1000;
    }

    this.baseUrl = baseUrl;
  }

  /**
   * Signals the start of a long-running process.
   */
  startProcess() {
    if (!this.baseUrl) return; // Pinger not initialized or is disabled

    this.activeProcesses++;
    if (this.activeProcesses > 0) {
      this.start();
    }
  }

  /**
   * Signals the end of a long-running process.
   */
  endProcess() {
    if (!this.baseUrl) return; // Pinger not initialized or is disabled

    this.activeProcesses = Math.max(0, this.activeProcesses - 1);
    if (this.isRunning && this.activeProcesses === 0) {
      this.stop();
    }
  }

  start() {
    // This is the definitive idempotency check.
    // Only create the interval if one doesn't already exist.
    if (this.intervalId) {
      logger.logWarning('Pinger start() called, but an interval is already active. Ignoring.');
      return;
    }

    this.isRunning = true;
    this.pingCount = 0;
    logger.logInfo(`Health check pinger activated due to long-running process. Pinging every ${this.pingInterval / 60000} minutes.`);

    // Set up periodic pinging
    this.intervalId = setInterval(() => {
      this.ping();
    }, this.pingInterval);
  }

  /**
   * Stop the health check pinger
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isRunning = false;
      logger.logInfo('Health check pinger deactivated as all long-running processes have completed.');
    }
  }

  /**
   * Execute a health check ping
   */
  async ping() {
    // This try/catch is critical. Since ping() is called by setInterval, any unhandled
    // promise rejection here will crash the app or cause Express error handlers to misfire.
    // This block contains all errors within the pinger's own execution context.
    try {
      if (!this.baseUrl) {
        return;
      }

      this.pingCount = (this.pingCount || 0) + 1;

      const response = await axios.get(`${this.baseUrl}/health`, {
        timeout: 5000,
        validateStatus: () => true
      });

      if (response.status === 200) {
        logger.logDebug(`Health check ping #${this.pingCount}: OK`);
      } else {
        logger.logWarning(`Health check ping #${this.pingCount} returned status: ${response.status}`);
      }
    } catch (error) {
      logger.logError(`Health check ping #${this.pingCount} failed: ${error.message}`);
    }
  }

  /**
   * Check if pinger is running
   */
  isActive() {
    return this.isRunning;
  }
}

// Export singleton instance
module.exports = new HealthCheckPinger();
