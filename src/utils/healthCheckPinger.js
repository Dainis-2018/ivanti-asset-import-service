const axios = require('axios');
const logger = require('./logger');

class HealthCheckPinger {
  constructor() {
    this.intervalId = null;
    this.baseUrl = null;
    this.pingInterval = 5 * 60 * 1000; // 5 minutes
    this.isRunning = false;
    this.pingCount = 0;
  }

  /**
   * Start the health check pinger
   * @param {string} baseUrl - Base URL of the service
   */
  start(baseUrl) {
    // Check if health check is disabled
    const enableHealthCheck = process.env.ENABLE_HEALTH_CHECK_PINGER !== 'false';
    
    if (!enableHealthCheck) {
      logger.logInfo('Health check pinger is disabled (ENABLE_HEALTH_CHECK_PINGER=false)');
      return;
    }

    if (this.isRunning) {
      logger.logWarning('Health check pinger is already running');
      return;
    }

    this.baseUrl = baseUrl;
    this.isRunning = true;
    this.pingCount = 0;

    logger.logInfo(`Health check pinger started - will ping ${baseUrl}/health every 5 minutes`);

    // Initial ping after 30 seconds
    setTimeout(() => this.ping(), 30000);

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
        logger.logInfo(`Health check ping #${this.pingCount}: OK`);
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
