const BaseSourceAdapter = require('./BaseSourceAdapter');
const executeWebRequest = require('../utils/webRequestUtils');
const logger = require('../utils/logger');

/**
 * IP Fabric Source Adapter
 * Connects to IP Fabric and retrieves device information
 */
class IPFabricAdapter extends BaseSourceAdapter {
  constructor(config) {
    super(config);
    this.name = 'IP Fabric';
    this.token = null;
  }

  /**
   * Authenticate with IP Fabric
   * @returns {Promise<boolean>}
   */
  async authenticate() {
    try {
      const credentials = this.parseCredentials();
      const baseUrl = this.getBaseUrl();

      if (!credentials.token && !credentials.username) {
        logger.logError('IP Fabric credentials missing');
        return false;
      }

      // IP Fabric supports both token and username/password auth
      if (credentials.token) {
        this.token = credentials.token;
        logger.logInfo('Using IP Fabric API token');
        return true;
      } else {
        // Login with username/password to get token
        const loginEndpoint = `${baseUrl}/api/v1/auth/login`;
        const loginData = {
          username: credentials.username,
          password: credentials.password
        };

        const response = await executeWebRequest('POST', loginEndpoint, loginData);

        if (response.status === 200 && response.data && response.data.token) {
          this.token = response.data.token;
          logger.logInfo('IP Fabric authentication successful');
          return true;
        } else {
          logger.logError(`IP Fabric authentication failed: ${response.status}`);
          return false;
        }
      }
    } catch (error) {
      logger.logError(`IP Fabric authentication error: ${error.message}`);
      return false;
    }
  }

  /**
   * Get devices from IP Fabric with paging
   * @param {number} pageSize
   * @param {number} pageNumber
   * @returns {Promise<object>}
   */
  async getAssets(pageSize, pageNumber) {
    try {
      if (!this.token) {
        throw new Error('Not authenticated. Call authenticate() first.');
      }

      const baseUrl = this.getBaseUrl();
      const headers = {
        'X-API-Token': this.token,
        'Content-Type': 'application/json'
      };

      // IP Fabric uses POST for table queries with pagination
      const endpoint = `${baseUrl}/api/v1/tables/inventory/devices`;
      
      const queryData = {
        columns: ['hostname', 'sn', 'vendor', 'platform', 'model', 'version', 'siteName', 'loginIp', 'loginType'],
        pagination: {
          limit: pageSize,
          start: pageNumber * pageSize
        },
        snapshot: '$last' // Use latest snapshot
      };

      const response = await executeWebRequest('POST', endpoint, queryData, headers);

      if (response.status !== 200) {
        throw new Error(`Failed to get devices: ${response.status}`);
      }

      const data = response.data;
      const assets = data.data || [];
      const totalCount = data._meta?.count || 0;
      const hasMore = ((pageNumber + 1) * pageSize) < totalCount;

      logger.logInfo(`Retrieved ${assets.length} devices from IP Fabric (page ${pageNumber + 1}, total: ${totalCount})`);

      return {
        assets,
        hasMore,
        totalCount,
        nextKey: null
      };
    } catch (error) {
      logger.logError(`Error getting devices from IP Fabric: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get single device by serial number or hostname
   * @param {string} assetId
   * @returns {Promise<object>}
   */
  async getAssetById(assetId) {
    try {
      if (!this.token) {
        throw new Error('Not authenticated. Call authenticate() first.');
      }

      const baseUrl = this.getBaseUrl();
      const headers = {
        'X-API-Token': this.token,
        'Content-Type': 'application/json'
      };

      const endpoint = `${baseUrl}/api/v1/tables/inventory/devices`;
      
      const queryData = {
        columns: ['hostname', 'sn', 'vendor', 'platform', 'model', 'version', 'siteName', 'loginIp', 'loginType'],
        filters: {
          or: [
            { sn: ['eq', assetId] },
            { hostname: ['eq', assetId] }
          ]
        },
        snapshot: '$last'
      };

      const response = await executeWebRequest('POST', endpoint, queryData, headers);

      if (response.status === 200 && response.data.data && response.data.data.length > 0) {
        return response.data.data[0];
      } else {
        throw new Error(`Device not found: ${assetId}`);
      }
    } catch (error) {
      logger.logError(`Error getting device by ID: ${error.message}`);
      throw error;
    }
  }
}

module.exports = IPFabricAdapter;
