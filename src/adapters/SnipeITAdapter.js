const BaseSourceAdapter = require('./BaseSourceAdapter');
const executeWebRequest = require('../utils/webRequestUtils');
const logger = require('../utils/logger');

/**
 * Snipe-IT Source Adapter
 * Connects to Snipe-IT and retrieves asset information
 */
class SnipeITAdapter extends BaseSourceAdapter {
  constructor(config) {
    super(config);
    this.name = 'Snipe-IT';
    this.apiToken = null;
  }

  /**
   * Authenticate with Snipe-IT
   * @returns {Promise<boolean>}
   */
  async authenticate() {
    try {
      const credentials = this.parseCredentials();
      
      if (!credentials.apiToken && !credentials.token) {
        logger.logError('Snipe-IT API token missing');
        return false;
      }

      this.apiToken = credentials.apiToken || credentials.token;

      // Test authentication by getting user info
      const baseUrl = this.getBaseUrl();
      const headers = {
        'Authorization': `Bearer ${this.apiToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      };

      const endpoint = `${baseUrl}/api/v1/users/me`;
      const response = await executeWebRequest('GET', endpoint, null, headers);

      if (response.status === 200) {
        logger.logInfo('Snipe-IT authentication successful');
        return true;
      } else {
        logger.logError(`Snipe-IT authentication failed: ${response.status}`);
        return false;
      }
    } catch (error) {
      logger.logError(`Snipe-IT authentication error: ${error.message}`);
      return false;
    }
  }

  /**
   * Get assets from Snipe-IT with paging
   * @param {number} pageSize
   * @param {number} pageNumber
   * @returns {Promise<object>}
   */
  async getAssets(pageSize, pageNumber) {
    try {
      if (!this.apiToken) {
        throw new Error('Not authenticated. Call authenticate() first.');
      }

      const baseUrl = this.getBaseUrl();
      const headers = {
        'Authorization': `Bearer ${this.apiToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      };

      // Snipe-IT uses offset-based pagination
      const offset = pageNumber * pageSize;
      const endpoint = `${baseUrl}/api/v1/hardware?limit=${pageSize}&offset=${offset}`;

      const response = await executeWebRequest('GET', endpoint, null, headers);

      if (response.status !== 200) {
        throw new Error(`Failed to get assets: ${response.status}`);
      }

      const data = response.data;
      const assets = data.rows || [];
      const totalCount = data.total || 0;
      const hasMore = (offset + pageSize) < totalCount;

      logger.logInfo(`Retrieved ${assets.length} assets from Snipe-IT (page ${pageNumber + 1}, total: ${totalCount})`);

      return {
        assets,
        hasMore,
        totalCount,
        nextKey: null
      };
    } catch (error) {
      logger.logError(`Error getting assets from Snipe-IT: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get single asset by ID
   * @param {string} assetId
   * @returns {Promise<object>}
   */
  async getAssetById(assetId) {
    try {
      if (!this.apiToken) {
        throw new Error('Not authenticated. Call authenticate() first.');
      }

      const baseUrl = this.getBaseUrl();
      const headers = {
        'Authorization': `Bearer ${this.apiToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      };

      const endpoint = `${baseUrl}/api/v1/hardware/${assetId}`;
      const response = await executeWebRequest('GET', endpoint, null, headers);

      if (response.status === 200) {
        return response.data;
      } else {
        throw new Error(`Asset not found: ${assetId}`);
      }
    } catch (error) {
      logger.logError(`Error getting asset by ID: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get asset by asset tag
   * @param {string} assetTag
   * @returns {Promise<object>}
   */
  async getAssetByTag(assetTag) {
    try {
      if (!this.apiToken) {
        throw new Error('Not authenticated. Call authenticate() first.');
      }

      const baseUrl = this.getBaseUrl();
      const headers = {
        'Authorization': `Bearer ${this.apiToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      };

      const endpoint = `${baseUrl}/api/v1/hardware/bytag/${assetTag}`;
      const response = await executeWebRequest('GET', endpoint, null, headers);

      if (response.status === 200) {
        return response.data;
      } else {
        throw new Error(`Asset not found with tag: ${assetTag}`);
      }
    } catch (error) {
      logger.logError(`Error getting asset by tag: ${error.message}`);
      throw error;
    }
  }
}

module.exports = SnipeITAdapter;
