const BaseSourceAdapter = require('./BaseSourceAdapter');
const executeWebRequest = require('../utils/webRequestUtils');
const logger = require('../utils/logger');

/**
 * VMware vCenter Source Adapter
 * Connects to vCenter and retrieves VM information
 */
class VMwareAdapter extends BaseSourceAdapter {
  constructor(config) {
    super(config);
    this.name = 'VMware vCenter';
    this.sessionToken = null;
  }

  /**
   * Authenticate with vCenter
   * @returns {Promise<boolean>}
   */
  async authenticate() {
    try {
      const credentials = this.parseCredentials();
      const baseUrl = this.getBaseUrl();

      if (!credentials.username || !credentials.password) {
        logger.logError('VMware credentials missing username or password');
        return false;
      }

      const authString = Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64');
      const headers = {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/json'
      };

      // vCenter REST API session creation
      const endpoint = `${baseUrl}/rest/com/vmware/cis/session`;
      const response = await executeWebRequest('POST', endpoint, {}, headers);

      if (response.status === 200 && response.data && response.data.value) {
        this.sessionToken = response.data.value;
        logger.logInfo('VMware vCenter authentication successful');
        return true;
      } else {
        logger.logError(`VMware authentication failed: ${response.status}`);
        return false;
      }
    } catch (error) {
      logger.logError(`VMware authentication error: ${error.message}`);
      return false;
    }
  }

  /**
   * Get VMs from vCenter with paging
   * @param {number} pageSize
   * @param {number} pageNumber
   * @returns {Promise<object>}
   */
  async getAssets(pageSize, pageNumber) {
    try {
      if (!this.sessionToken) {
        throw new Error('Not authenticated. Call authenticate() first.');
      }

      const baseUrl = this.getBaseUrl();
      const headers = {
        'vmware-api-session-id': this.sessionToken,
        'Content-Type': 'application/json'
      };

      // Get list of VMs
      const vmListEndpoint = `${baseUrl}/rest/vcenter/vm`;
      const vmListResponse = await executeWebRequest('GET', vmListEndpoint, null, headers);

      if (vmListResponse.status !== 200) {
        throw new Error(`Failed to get VM list: ${vmListResponse.status}`);
      }

      const allVms = vmListResponse.data.value || [];
      
      // Implement paging
      const startIndex = pageNumber * pageSize;
      const endIndex = startIndex + pageSize;
      const pagedVms = allVms.slice(startIndex, endIndex);
      const hasMore = endIndex < allVms.length;

      // Get detailed information for each VM
      const assets = [];
      for (const vm of pagedVms) {
        try {
          const vmDetailEndpoint = `${baseUrl}/rest/vcenter/vm/${vm.vm}`;
          const vmDetailResponse = await executeWebRequest('GET', vmDetailEndpoint, null, headers);

          if (vmDetailResponse.status === 200) {
            const vmDetail = vmDetailResponse.data.value || vmDetailResponse.data;
            assets.push({
              id: vm.vm,
              name: vm.name,
              powerState: vm.power_state,
              ...vmDetail
            });
          }
        } catch (vmError) {
          logger.logWarning(`Failed to get details for VM ${vm.vm}: ${vmError.message}`);
        }
      }

      logger.logInfo(`Retrieved ${assets.length} VMs from vCenter (page ${pageNumber + 1})`);

      return {
        assets,
        hasMore,
        totalCount: allVms.length
      };
    } catch (error) {
      logger.logError(`Error getting VMs from vCenter: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get single VM by ID
   * @param {string} assetId
   * @returns {Promise<object>}
   */
  async getAssetById(assetId) {
    try {
      if (!this.sessionToken) {
        throw new Error('Not authenticated. Call authenticate() first.');
      }

      const baseUrl = this.getBaseUrl();
      const headers = {
        'vmware-api-session-id': this.sessionToken,
        'Content-Type': 'application/json'
      };

      const endpoint = `${baseUrl}/rest/vcenter/vm/${assetId}`;
      const response = await executeWebRequest('GET', endpoint, null, headers);

      if (response.status === 404) {
        logger.logWarning(`VM not found with ID: ${assetId}`);
        return null;
      } else if (response.status === 200) {
        const vmData = response.data.value || response.data;
        return {
          id: assetId,
          ...vmData
        };
      } else {
        throw new Error(`Failed to get VM ${assetId}: ${response.status}`);
      }
    } catch (error) {
      logger.logError(`Error getting VM by ID: ${error.message}`);
      throw error;
    }
  }
}

module.exports = VMwareAdapter;
