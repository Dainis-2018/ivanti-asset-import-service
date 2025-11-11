const BaseSourceAdapter = require('./BaseSourceAdapter');
const logger = require('../utils/logger');
const SyntheticDataGenerator = require('../../test-synthetic-data');

/**
 * Mock Adapter for Testing
 * Generates synthetic data without requiring external systems
 * 
 * Configuration via EndpointUrl:
 * Format: mock://[sourceType]?count=[number]
 * Examples:
 *   mock://vmware?count=50
 *   mock://ipfabric?count=100
 *   mock://snipeit?count=25
 */
class MockAdapter extends BaseSourceAdapter {
  constructor(config) {
    super(config);
    
    // Parse configuration from EndpointUrl
    this.parseConfiguration();
    
    this.mockData = [];
    this.currentPage = 0;
  }

  /**
   * Parse mock configuration from EndpointUrl
   * Format: mock://vmware?count=50
   */
  parseConfiguration() {
    try {
      const url = this.config.EndpointUrl || 'mock://vmware?count=10';
      
      // Parse URL
      const urlPattern = /^mock:\/\/([^?]+)(?:\?count=(\d+))?$/;
      const match = url.match(urlPattern);
      
      if (match) {
        this.sourceType = match[1] || 'vmware';
        this.recordCount = parseInt(match[2]) || 10;
      } else {
        // Fallback to defaults
        this.sourceType = 'vmware';
        this.recordCount = 10;
      }
      
      // Get page size from config
      this.pageSize = parseInt(this.config.PageSize) || 50;
      
      logger.logInfo(`Mock Adapter configured: ${this.sourceType}, ${this.recordCount} records`);
    } catch (error) {
      logger.logWarning(`Failed to parse mock configuration: ${error.message}`);
      this.sourceType = 'vmware';
      this.recordCount = 10;
      this.pageSize = 50;
    }
  }

  /**
   * Initialize mock data
   */
  async authenticate() {
    try {
      logger.logInfo(`Mock Adapter: Generating ${this.recordCount} synthetic ${this.sourceType} records`);
      
      // Generate synthetic data
      this.mockData = SyntheticDataGenerator.generateTestData(this.sourceType, this.recordCount);
      
      logger.logInfo(`Mock Adapter: Generated ${this.mockData.length} records successfully`);
      return true;
    } catch (error) {
      logger.logError(`Mock Adapter authentication failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Get assets with pagination
   */
  async getAssets(pageSize, pageNumber) {
    try {
      const startIndex = pageNumber * pageSize;
      const endIndex = startIndex + pageSize;
      
      const assets = this.mockData.slice(startIndex, endIndex);
      const hasMore = endIndex < this.mockData.length;
      
      logger.logDebug(`Mock Adapter: Returning ${assets.length} assets (page ${pageNumber + 1})`);
      
      // Simulate network delay
      await this.sleep(100);
      
      return {
        assets,
        hasMore,
        totalCount: this.mockData.length
      };
    } catch (error) {
      logger.logError(`Mock Adapter getAssets failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get single asset by ID
   */
  async getAssetById(assetId) {
    try {
      // Search by multiple common identifier fields to be more realistic
      const asset = this.mockData.find(a => 
        String(a.id) === String(assetId) || 
        a.asset_tag === assetId ||
        a.hostname === assetId ||
        a.sn === assetId
      );
      
      if (!asset) {
        throw new Error(`Asset not found: ${assetId}`);
      }
      
      // Simulate network delay
      await this.sleep(50);
      
      return asset;
    } catch (error) {
      logger.logError(`Mock Adapter getAssetById failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get page size
   */
  getPageSize() {
    return this.pageSize;
  }

  /**
   * Log adapter information
   */
  logInfo() {
    logger.logInfo('='.repeat(55));
    logger.logInfo('  Mock Source Adapter (Test Mode)');
    logger.logInfo('='.repeat(55));
    logger.logInfo(`  Source Type: ${this.sourceType}`);
    logger.logInfo(`  Record Count: ${this.recordCount}`);
    logger.logInfo(`  Page Size: ${this.pageSize}`);
    logger.logInfo(`  Configuration: ${this.config.EndpointUrl}`);
    logger.logInfo('='.repeat(55));
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = MockAdapter;
