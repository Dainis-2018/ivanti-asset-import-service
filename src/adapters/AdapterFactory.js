const logger = require('../utils/logger');

// Import all available adapters
const VMwareAdapter = require('./VMwareAdapter');
const IPFabricAdapter = require('./IPFabricAdapter');
const SnipeITAdapter = require('./SnipeITAdapter');
const MockAdapter = require('./MockAdapter');

// Central registry for all adapters and their aliases
const ADAPTER_REGISTRY = {
  'vmware': VMwareAdapter,
  'vcenter': VMwareAdapter,
  'vmware-vcenter': VMwareAdapter,
  'ipfabric': IPFabricAdapter,
  'ip-fabric': IPFabricAdapter,
  'ipf': IPFabricAdapter,
  'snipeit': SnipeITAdapter,
  'snipe-it': SnipeITAdapter,
  'snipe': SnipeITAdapter,
  'mock': MockAdapter,
  'test': MockAdapter,
  'synthetic': MockAdapter,
};

/**
 * Adapter Factory
 * Creates appropriate source adapter based on integration type
 */
class AdapterFactory {
  /**
   * Get adapter instance for a given source type
   * @param {string} sourceType - Integration source type
   * @param {object} config - Integration configuration
   * @returns {BaseSourceAdapter} - Adapter instance
   */
  static getAdapter(sourceType, config) {
    const sourceTypeLower = sourceType.toLowerCase();

    logger.logInfo(`Creating adapter for source type: ${sourceType}`);

    const AdapterClass = ADAPTER_REGISTRY[sourceTypeLower];
    
    if (AdapterClass) {
      return new AdapterClass(config);
    }
    
    throw new Error(`Unsupported source type: ${sourceType}. Supported types: ${Object.keys(ADAPTER_REGISTRY).join(', ')}`);
  }

  /**
   * Get list of supported source types
   * @returns {Array<string>} - List of supported source types
   */
  static getSupportedTypes() {
    return Object.keys(ADAPTER_REGISTRY);
  }

  /**
   * Check if source type is supported
   * @param {string} sourceType - Source type to check
   * @returns {boolean} - True if supported
   */
  static isSupported(sourceType) {
    const supportedTypes = this.getSupportedTypes();
    return supportedTypes.includes(sourceType.toLowerCase());
  }
}

module.exports = AdapterFactory;
