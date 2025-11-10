const executeWebRequest = require('../utils/webRequestUtils');
const logger = require('../utils/logger');
const { compressAndEncode, escapeXmlAttr, escapeXml } = require('../utils/xmlUtils');

/**
 * Ivanti Integration Service
 * Handles all interactions with Ivanti ITSM
 */
class IvantiService {
  constructor(ivantiUrl, apiKey) {
    this.ivantiUrl = ivantiUrl.endsWith('/') ? ivantiUrl : `${ivantiUrl}/`;
    this.apiKey = apiKey;
    this.headers = {
      'Authorization': `rest_api_key=${apiKey}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Get integration configuration from Ivanti
   * @param {string} integrationSourceType - Type of integration source (e.g., 'vmware', 'ipfabric', 'snipeit')
   * @returns {Promise<object>} - Integration configuration object
   */
  async getIntegrationConfiguration(integrationSourceType) {
    try {
      const endpoint = `${this.ivantiUrl}api/odata/businessobject/xsc_assetintegration_configs?$filter=IntegrationSourceType eq '${integrationSourceType}' and IsActive eq true&$top=1`;
      
      logger.logDebug(`Fetching integration configuration for: ${integrationSourceType}`);
      
      const response = await executeWebRequest('GET', endpoint, null, this.headers);
      
      if (response.status === 200 && response.data.value && response.data.value.length > 0) {
        const config = response.data.value[0];
        logger.logInfo(`Integration configuration loaded: ${config.IntegrationName || integrationSourceType}`);
        return config;
      } else {
        throw new Error(`Integration configuration not found for source type: ${integrationSourceType}`);
      }
    } catch (error) {
      logger.logError(`Failed to get integration configuration: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all active integration configurations from Ivanti
   * @returns {Promise<Array>} - Array of integration configuration objects
   */
  async getIntegrationConfigurations() {
    try {
      const endpoint = `${this.ivantiUrl}api/odata/businessobject/xsc_assetintegration_configs?$filter=IsActive eq true`;
      
      logger.logDebug('Fetching all active integration configurations');
      
      const response = await executeWebRequest('GET', endpoint, null, this.headers);
      
      if (response.status === 200 && response.data.value) {
        const configs = response.data.value;
        logger.logInfo(`Found ${configs.length} active integration configuration(s)`);
        return configs;
      } else {
        logger.logWarning('No integration configurations found');
        return [];
      }
    } catch (error) {
      logger.logError(`Failed to get integration configurations: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get CI Types for an integration configuration
   * @param {string} configRecId - Parent configuration RecId
   * @returns {Promise<Array>} - Array of CI Type configurations
   */
  async getCITypes(configRecId) {
    try {
      const endpoint = `${this.ivantiUrl}api/odata/businessobject/xsc_assetintegration_citypes?$filter=ParentLink_RecID eq '${configRecId}' and IsActive eq true`;
      
      logger.logDebug(`Fetching CI Types for configuration: ${configRecId}`);
      
      const response = await executeWebRequest('GET', endpoint, null, this.headers);
      
      if (response.status === 200 && response.data.value) {
        const ciTypes = response.data.value;
        logger.logInfo(`Found ${ciTypes.length} active CI Type(s)`);
        return ciTypes;
      } else {
        logger.logWarning('No CI Types found');
        return [];
      }
    } catch (error) {
      logger.logError(`Failed to get CI Types: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get field mappings for a CI Type
   * @param {string} ciTypeRecId - CI Type RecId
   * @returns {Promise<Array>} - Array of field mapping configurations
   */
  async getFieldMappings(ciTypeRecId) {
    try {
      const endpoint = `${this.ivantiUrl}api/odata/businessobject/xsc_assetintegration_mappings?$filter=ParentLink_RecID eq '${ciTypeRecId}'`;
      
      logger.logDebug(`Fetching field mappings for CI Type: ${ciTypeRecId}`);
      
      const response = await executeWebRequest('GET', endpoint, null, this.headers);
      
      if (response.status === 200 && response.data.value) {
        const mappings = response.data.value;
        logger.logInfo(`Found ${mappings.length} field mapping(s)`);
        return mappings;
      } else {
        logger.logWarning('No field mappings found');
        return [];
      }
    } catch (error) {
      logger.logError(`Failed to get field mappings: ${error.message}`);
      throw error;
    }
  }

  /**
   * Post XML to Ivanti Integration Queue
   * @param {string} xmlPayload - XML payload string
   * @param {string} clientAuthenticationKey - Client authentication key from integration config
   * @param {string} tenantId - Tenant ID from integration config
   * @returns {Promise<object>} - Result of the post operation
   */
  async postToIntegrationQueue(xmlPayload, clientAuthenticationKey, tenantId) {
    try {
      // Compress and encode the XML
      const encodedXml = await compressAndEncode(xmlPayload);
      
      const queuePayload = {
        IntegrationObjectRecId: "",
        Status: 'Queued',
        HandlerName: 'AssetProcessor',
        ManagedByMessageQueue: true,
        IsPayloadCompressed: true,
        Payload: JSON.stringify({
          ClientAuthenticationKey: clientAuthenticationKey,
          CompressedMessageBody: encodedXml,
          MessageSubType: 'Full',
          MessageType: 'ASSET',
          SequenceNumber: '1',
          SequenceNumberFirst: '0',
          SequenceNumberLast: '1',
          TenantId: tenantId
        })
      };

      const endpoint = `${this.ivantiUrl}api/odata/businessobject/Frs_ops_integration_queues`;
      
      logger.logDebug('Posting to Ivanti integration queue...');
      
      const response = await executeWebRequest('POST', endpoint, queuePayload, this.headers);
      
      if (response.status === 200 || response.status === 201) {
        logger.logInfo('Successfully posted to Ivanti integration queue');
        return { success: true, data: response.data };
      } else {
        logger.logError(`Failed to post to queue. Status: ${response.status}`);
        return { 
          success: false, 
          message: `Status ${response.status}: ${JSON.stringify(response.data)}` 
        };
      }
    } catch (error) {
      logger.logError(`Error posting to integration queue: ${error.message}`);
      return { 
        success: false, 
        message: error.message 
      };
    }
  }

  /**
   * Update integration status record
   * @param {string} integrationRecId - Integration record RecId
   * @param {object} updates - Fields to update
   * @returns {Promise<boolean>} - Success status
   */
  async updateIntegrationStatus(integrationRecId, updates) {
    try {
      const endpoint = `${this.ivantiUrl}api/odata/businessobject/xsc_assetintegration_configs('${integrationRecId}')`;
      
      const response = await executeWebRequest('PUT', endpoint, updates, this.headers);
      
      if (response.status === 200 || response.status === 204) {
        logger.logDebug('Integration status updated successfully');
        return true;
      } else {
        logger.logWarning(`Failed to update integration status. Status: ${response.status}`);
        return false;
      }
    } catch (error) {
      logger.logError(`Error updating integration status: ${error.message}`);
      return false;
    }
  }

  /**
   * Create integration log entry
   * @param {string} integrationName - Name of the integration
   * @param {string} sourceType - Source type
   * @returns {Promise<string>} - Log record ID
   */
  async createIntegrationLog(integrationName, sourceType) {
    try {
      const logPayload = {
        IntegrationName: integrationName,
        SourceType: sourceType,
        StartTime: new Date().toISOString(),
        Status: 'Running',
        LogMessage: logger.getBufferedMessages()
      };

      const endpoint = `${this.ivantiUrl}api/odata/businessobject/frs_data_integration_logs`;
      
      const response = await executeWebRequest('POST', endpoint, logPayload, this.headers);
      
      if (response.status === 200 || response.status === 201) {
        const logRecId = response.data.RecId;
        logger.logInfo(`Integration log created: ${logRecId}`);
        return logRecId;
      } else {
        logger.logWarning('Failed to create integration log');
        return null;
      }
    } catch (error) {
      logger.logError(`Error creating integration log: ${error.message}`);
      return null;
    }
  }

  /**
   * Update integration log entry
   * @param {string} logRecId - Log record ID
   * @param {object} updates - Fields to update
   * @returns {Promise<boolean>} - Success status
   */
  async updateIntegrationLog(logRecId, updates) {
    try {
      updates.LogMessage = logger.getBufferedMessages();
      
      const endpoint = `${this.ivantiUrl}api/odata/businessobject/frs_data_integration_logs('${logRecId}')`;
      
      const response = await executeWebRequest('PUT', endpoint, updates, this.headers);
      
      if (response.status === 200 || response.status === 204) {
        logger.logDebug('Integration log updated successfully');
        return true;
      } else {
        logger.logWarning(`Failed to update integration log. Status: ${response.status}`);
        return false;
      }
    } catch (error) {
      logger.logError(`Error updating integration log: ${error.message}`);
      return false;
    }
  }

  /**
   * Build XML payload for asset import
   * @param {object|Array} sourceRecords - Single asset or array of assets
   * @param {Array} mappings - Field mappings
   * @param {string} ciType - CI Type value
   * @returns {string} - XML payload
   */
  buildAssetXml(sourceRecords, mappings, ciType) {
    // Convert single asset to array for consistent processing
    const records = Array.isArray(sourceRecords) ? sourceRecords : [sourceRecords];
    
    const timeStamp = new Date().toISOString().substring(0, 19);
    
    // Helper function to get nested value
    const getNestedValue = (obj, path) => {
      if (!path || typeof path !== 'string' || !obj) return null;
      const properties = path.split('.');
      let value = obj;
      for (let i = 0; i < properties.length; i++) {
        const prop = properties[i];
        if (value === null || typeof value === 'undefined' || !value.hasOwnProperty(prop)) {
          return null;
        }
        value = value[prop];
      }
      return (value === '' ? null : value);
    };

    // Helper function to resolve template
    const resolveTemplate = (template, obj) => {
      if (!template || typeof template !== 'string') return template;
      return template.replace(/\{([^}]+)\}/g, (match, path) => {
        const value = getNestedValue(obj, path);
        return value === null || typeof value === 'undefined' ? '' : String(value);
      });
    };

    // Build AssetData for each record
    let assetDataXml = '';
    
    for (const sourceRecord of records) {
      const sections = {};

      // Process each mapping
      for (const mapping of mappings) {
        try {
          let targetProperty = mapping.IvantiField;
          let value;

          // Determine value based on mapping type
          if (mapping.MappingType === 'Fixed') {
            value = mapping.SourceField;
          } else if (mapping.MappingType === 'Template') {
            value = resolveTemplate(mapping.SourceField, sourceRecord);
          } else {
            // Direct field mapping
            value = getNestedValue(sourceRecord, mapping.SourceField);
          }

          // Convert value types
          if (typeof value === 'boolean') {
            value = value ? 'true' : 'false';
          } else if (value instanceof Date) {
            value = value.toISOString().substring(0, 19);
          }

          // Add to appropriate section
          if (targetProperty && value !== null && typeof value !== 'undefined') {
            const section = mapping.Section || 'Identity';
            if (!sections[section]) {
              sections[section] = [];
            }
            sections[section].push({
              name: escapeXmlAttr(targetProperty),
              value: escapeXml(String(value))
            });
          }
        } catch (e) {
          logger.logError(`Error processing mapping for "${mapping.IvantiField}": ${e.message}`);
        }
      }

      // Add CI Type to Identity section
      if (!sections.Identity) {
        sections.Identity = [];
      }
      sections.Identity.push({
        name: 'CIType',
        value: escapeXml(ciType)
      });

      // Build properties XML for this asset
      let propertiesXml = '';
      for (const sectionName in sections) {
        propertiesXml += `    <${sectionName}>\n`;
        sections[sectionName].forEach(prop => {
          propertiesXml += `      <Property Name="${prop.name}">${prop.value}</Property>\n`;
        });
        propertiesXml += `    </${sectionName}>\n`;
      }

      // Add this asset's AssetData
      assetDataXml += `  <AssetData>
    <Audit>
      <TimeStamp>${timeStamp}</TimeStamp>
      <RequestId>0</RequestId>
      <FirstSequence>0</FirstSequence>
      <LastSequence>1</LastSequence>
      <Type>Full</Type>
    </Audit>
${propertiesXml}  </AssetData>
`;
    }

    // Build complete XML with all assets
    return `<?xml version="1.0" encoding="utf-8"?>
<AssetDataSequence SchemaVersion="0.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
${assetDataXml}</AssetDataSequence>`;
  }
}

module.exports = IvantiService;
