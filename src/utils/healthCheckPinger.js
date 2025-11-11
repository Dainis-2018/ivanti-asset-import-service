const axios = require('axios');
const logger = require('./logger');

class HealthCheckPinger {
  constructor() {
    this.intervalId = null;
    this.baseUrl = null; // Will be set during start()
    this.pingInterval = 5 * 60 * 1000; // 5 minutes
    this.isRunning = false;
    this.pingCount = 0;
  }

  /**
   * Start the health check pinger
   * @param {string} baseUrl - Base URL of the service
   */
  start(baseUrl) {
    // Check if health check is explicitly disabled via environment variable
    if (process.env.ENABLE_HEALTH_CHECK_PINGER === 'false') {
      logger.logInfo('Health check pinger is disabled by configuration.');
      return;
    }

    if (this.isRunning) {
      logger.logWarning('Health check pinger is already running.');
      return;
    }

    // Make ping interval configurable via environment variable
    const configuredIntervalMinutes = parseInt(process.env.HEALTH_CHECK_PING_INTERVAL_MINUTES, 10);
    if (!isNaN(configuredIntervalMinutes) && configuredIntervalMinutes > 0) {
      this.pingInterval = configuredIntervalMinutes * 60 * 1000;
    }

    // Initialize state
    this.baseUrl = baseUrl;
    this.isRunning = true;
    this.pingCount = 0;

    logger.logInfo(`Health check pinger started - will ping ${baseUrl}/health every 5 minutes`);

    // Initial ping after 30 seconds
    setTimeout(() => {
      logger.logInfo('Performing initial health check ping...');
      this.ping();
    }, 30000);

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
      logger.logInfo('Health check pinger stopped');
    }
  }

  /**
   * Execute a health check ping
   */
  async ping() {
    if (!this.baseUrl) {
      return;
    }

    this.pingCount = (this.pingCount || 0) + 1;

    try {
      const response = await axios.get(`${this.baseUrl}/health`, {
        timeout: 5000,
        validateStatus: () => true
      });

      if (response.status === 200) {
        logger.logInfo(`Health check ping #${this.pingCount}: OK`); // Changed to debug for less verbose info logs
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
