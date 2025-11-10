const logger = require('../utils/logger');

// Import all available adapters
const VMwareAdapter = require('./VMwareAdapter');
const IPFabricAdapter = require('./IPFabricAdapter');
const SnipeITAdapter = require('./SnipeITAdapter');
const MockAdapter = require('./MockAdapter');

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

    switch (sourceTypeLower) {
      case 'vmware':
      case 'vcenter':
      case 'vmware-vcenter':
        return new VMwareAdapter(config);

      case 'ipfabric':
      case 'ip-fabric':
      case 'ipf':
        return new IPFabricAdapter(config);

      case 'snipeit':
      case 'snipe-it':
      case 'snipe':
        return new SnipeITAdapter(config);

      case 'mock':
      case 'test':
      case 'synthetic':
        return new MockAdapter(config);

      default:
        throw new Error(`Unsupported source type: ${sourceType}. Supported types: vmware, ipfabric, snipeit, mock.`);
    }
  }

  /**
   * Get list of supported source types
   * @returns {Array<string>} - List of supported source types
   */
  static getSupportedTypes() {
    return [
      'vmware',
      'vcenter',
      'ipfabric',
      'ip-fabric',
      'snipeit',
      'snipe-it',
      'mock',
      'test',
      'synthetic'
    ];
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
