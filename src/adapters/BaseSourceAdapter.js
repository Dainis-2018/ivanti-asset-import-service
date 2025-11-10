const logger = require('../utils/logger');

/**
 * Base class for all source adapters
 * All specific source adapters should extend this class
 */
class BaseSourceAdapter {
  constructor(config) {
    this.config = config;
    this.name = 'Base';
  }

  /**
   * Authenticate with the source system
   * Must be implemented by child classes
   * @returns {Promise<boolean>} - Authentication success
   */
  async authenticate() {
    throw new Error('authenticate() must be implemented by child class');
  }

  /**
   * Get assets from the source system with paging support
   * Must be implemented by child classes
   * @param {number} pageSize - Number of records per page
   * @param {number} pageNumber - Current page number (0-based)
   * @param {string} lastKey - Last key for cursor-based paging (optional)
   * @returns {Promise<object>} - { assets: [], hasMore: boolean, nextKey: string }
   */
  async getAssets(pageSize, pageNumber, lastKey = null) {
    throw new Error('getAssets() must be implemented by child class');
  }

  /**
   * Get a single asset by ID
   * Must be implemented by child classes
   * @param {string} assetId - Asset ID in the source system
   * @returns {Promise<object>} - Asset data
   */
  async getAssetById(assetId) {
    throw new Error('getAssetById() must be implemented by child class');
  }

  /**
   * Get credentials from configuration
   * Reads from separate fields (Username, Password, ApiToken) instead of JSON
   * @returns {object} - Credentials object
   */
  parseCredentials() {
    const credentials = {};
    
    // Get credentials from separate fields
    if (this.config.Username) {
      credentials.username = this.config.Username;
    }
    
    if (this.config.Password) {
      credentials.password = this.config.Password;
    }
    
    if (this.config.ApiToken) {
      credentials.apiToken = this.config.ApiToken;
      credentials.token = this.config.ApiToken; // Alias for backward compatibility
    }
    
    // For backward compatibility, still support JSON Credentials field if present
    if (this.config.Credentials) {
      try {
        const jsonCreds = JSON.parse(this.config.Credentials);
        // Merge JSON credentials (JSON takes precedence if both exist)
        Object.assign(credentials, jsonCreds);
        logger.logWarning('Using deprecated Credentials JSON field. Please migrate to separate fields (Username, Password, ApiToken).');
      } catch (error) {
        logger.logError(`Failed to parse Credentials JSON: ${error.message}`);
      }
    }
    
    return credentials;
  }

  /**
   * Get base URL from configuration
   * @returns {string} - Base URL
   */
  getBaseUrl() {
    return this.config.EndpointUrl || this.config.BaseUrl || '';
  }

  /**
   * Get paging size from configuration
   * @returns {number} - Page size
   */
  getPageSize() {
    return parseInt(this.config.PageSize) || 100;
  }

  /**
   * Validate required configuration
   * @param {Array<string>} requiredFields - Required configuration fields
   * @returns {boolean} - Validation result
   */
  validateConfig(requiredFields) {
    for (const field of requiredFields) {
      if (!this.config[field]) {
        logger.logError(`Missing required configuration field: ${field}`);
        return false;
      }
    }
    return true;
  }

  /**
   * Log adapter information
   */
  logInfo() {
    logger.logInfo(`Source Adapter: ${this.name}`);
    logger.logInfo(`Endpoint: ${this.getBaseUrl()}`);
    logger.logInfo(`Page Size: ${this.getPageSize()}`);
  }
}

module.exports = BaseSourceAdapter;
