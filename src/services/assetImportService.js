const logger = require('../utils/logger');
const IvantiService = require('./ivantiService');
const AdapterFactory = require('../adapters/AdapterFactory');

/**
 * Asset Import Service
 * Main service that orchestrates asset import from various sources to Ivanti
 */
class AssetImportService {
  constructor() {
    this.ivantiService = null;
    this.sourceAdapter = null;
    this.integrationConfig = null;
    this.importStats = {
      totalReceived: 0,
      totalProcessed: 0,
      totalFailed: 0,
      startTime: null,
      endTime: null
    };
  }

  /**
   * Initialize the import service
   * @param {string} ivantiUrl - Ivanti ITSM URL
   * @param {string} ivantiApiKey - Ivanti API key
   * @param {string} integrationSourceType - Source type (vmware, ipfabric, snipeit, etc.)
   * @param {object} [integrationConfig] - Optional pre-fetched integration configuration
   * @returns {Promise<object>} - The integration configuration
   */
  async initialize(ivantiUrl, ivantiApiKey, integrationSourceType, integrationConfig = null) {
    try {
      logger.logInfo('═══════════════════════════════════════════════════════');
      logger.logInfo('  Initializing Asset Import Service');
      logger.logInfo('═══════════════════════════════════════════════════════');

      // Clear previous log buffer
      logger.clearBuffer();

      // Reset stats
      this.importStats = { totalReceived: 0, totalProcessed: 0, totalFailed: 0, startTime: new Date(), endTime: null };

      try {
        // Initialize Ivanti service
        this.ivantiService = new IvantiService(ivantiUrl, ivantiApiKey);
        logger.logInfo('Ivanti service initialized');
      } catch (err) {
        logger.logError(`Ivanti service initialization failed: ${err.message}`);
        throw err;
      }

      // If config is not passed in, fetch it. Otherwise, use the provided one.
      if (!integrationConfig) {
        try {
          logger.logDebug('Integration config not provided, fetching from Ivanti...');
          integrationConfig = await this.ivantiService.getIntegrationConfiguration(integrationSourceType);
          if (!integrationConfig) {
            throw new Error(`Integration configuration not found for: ${integrationSourceType}`);
          }
        } catch (err) {
          // If fetching the config fails, we can't continue.
          const finalMessage = `Fetching integration configuration failed: ${err.message}`;
          logger.logError(finalMessage);
          throw err;
        }
      }

      // Apply LOG_LEVEL from integration config if specified. This is now the first thing we do with the config.
      if (integrationConfig.LOG_LEVEL) {
        logger.logInfo(`Detected integrationConfig.LOG_LEVEL: "${integrationConfig.LOG_LEVEL}"`);
        logger.setLogLevel(integrationConfig.LOG_LEVEL);
      }

      try {
        // Create source adapter
        this.sourceAdapter = AdapterFactory.getAdapter(integrationSourceType, integrationConfig);
      } catch (err) {
        logger.logError(`Creating source adapter failed: ${err.message}`);
        throw err;
      }

      this.sourceAdapter.logInfo();

      // Authenticate with source system
      const authSuccess = await this.sourceAdapter.authenticate();
      if (!authSuccess) {
        throw new Error(`Failed to authenticate with ${integrationSourceType}`);
      }


      return integrationConfig;
    } catch (error) {
      logger.logError(`Initialization failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Import all assets from source to Ivanti
   * @param {object} integrationConfig - Integration configuration from Ivanti
   * @param {object} options - Additional options like { dryRun: boolean }
   * @returns {Promise<object>} - Import statistics
   */
  async importAssets(integrationConfig, options = {}) {
    let logRecId = null;
    try {
      // Store integration config for use in other methods
      this.integrationConfig = integrationConfig;
      
      logger.logInfo('Starting asset import process...');

      // Validate required fields
      if (!integrationConfig.ClientAuthenticationKey) {
        throw new Error('ClientAuthenticationKey is required in integration configuration');
      }
      if (!integrationConfig.TenantId) {
        throw new Error('TenantId is required in integration configuration');
      }

      // Create integration log only if not in dry run mode
      if (!options.dryRun) {
        logRecId = await this.ivantiService.createIntegrationLog(
          integrationConfig.IntegrationSourceType,
          integrationConfig.IntegrationName || integrationConfig.IntegrationSourceType,
          'Asset import process started'
        );
      }

      // Get CI Types for this integration
      const ciTypes = await this.ivantiService.getCITypes(integrationConfig.RecId);

      if (ciTypes.length === 0) {
        logger.logWarning('No CI Types configured for this integration');
        await this.finalizeLog(logRecId, 'Stats'); // No errors, but no CI Types either
        return this.importStats;
      }

      // Process each CI Type
      for (const ciType of ciTypes) {
        await this.processCIType(ciType, options);
      }

      // Finalize
      this.importStats.endTime = new Date();
      
      // Determine final log type based on failures
      const finalLogType = this.importStats.totalFailed > 0 ? 'Error' : 'Stats'; // Still determine type for potential future use or if dryRun is false
      await this.finalizeLog(logRecId, finalLogType);

      logger.logInfo('═══════════════════════════════════════════════════════');
      logger.logInfo('  Asset Import Completed');
      logger.logInfo(`  Total Received: ${this.importStats.totalReceived}`);
      logger.logInfo(`  Total Processed: ${this.importStats.totalProcessed}`);
      logger.logInfo(`  Total Failed: ${this.importStats.totalFailed}`);
      logger.logInfo(`  Duration: ${this.getDuration()}`);
      logger.logInfo('═══════════════════════════════════════════════════════');

      return this.importStats;
    } catch (error) {
      logger.logError(`Asset import failed: ${error.message}`);
      this.importStats.endTime = new Date();
      // Ensure the log is updated to a failed state
      await this.finalizeLog(logRecId, 'Error');
      throw error;
    }
  }

  /**
   * Process a single CI Type
   * @param {object} ciType - CI Type configuration
   * @param {object} options - Additional options like { dryRun: boolean }
   * @returns {Promise<void>}
   */
  async processCIType(ciType, options = {}) {
    try {
      logger.logInfo(`Processing CI Type: ${ciType.CIType} (${ciType.CITypeName || 'N/A'})`);

      // Get field mappings for this CI Type
      const fieldMappings = await this.ivantiService.getFieldMappings(ciType.RecId);

      if (fieldMappings.length === 0) {
        logger.logWarning(`No field mappings found for CI Type: ${ciType.CIType}`);
        return;
      }

      // Get page size from adapter
      const pageSize = this.sourceAdapter.getPageSize();
      
      // Get batch size from config (default to page size, or use custom batch size)
      const batchSize = parseInt(this.integrationConfig.BatchSize) || pageSize;
      logger.logInfo(`Using batch size: ${batchSize} assets per queue post`);
      
      let pageNumber = 0;
      let hasMore = true;
      let assetBatch = [];

      // Process assets page by page
      while (hasMore) {
        logger.logInfo(`Fetching page ${pageNumber + 1} (${pageSize} records per page)...`);

        const result = await this.sourceAdapter.getAssets(pageSize, pageNumber);
        const assets = result.assets || [];

        logger.logInfo(`Received ${assets.length} asset(s)`);
        this.importStats.totalReceived += assets.length;

        // Add assets to batch
        for (const asset of assets) {
          assetBatch.push(asset);
          
          // When batch is full, process it
          if (assetBatch.length >= batchSize) {
            await this.processAssetBatch(assetBatch, fieldMappings, ciType.CIType, options);
            assetBatch = []; // Clear batch
          }
        }

        hasMore = result.hasMore;
        pageNumber++;

        // Safety check to prevent infinite loops
        if (pageNumber > 1000) {
          logger.logWarning('Maximum page limit reached (1000 pages). Stopping import.');
          break;
        }
      }

      // Process any remaining assets in batch
      if (assetBatch.length > 0) {
        await this.processAssetBatch(assetBatch, fieldMappings, ciType.CIType, options);
      }

      logger.logInfo(`Completed processing CI Type: ${ciType.CIType}`);
    } catch (error) {
      logger.logError(`Error processing CI Type ${ciType.CIType}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process a batch of assets
   * @param {Array} assets - Array of asset data from source
   * @param {Array} fieldMappings - Field mappings
   * @param {string} ciType - CI Type value
   * @param {object} options - Additional options like { dryRun: boolean }
   * @returns {Promise<void>}
   */
  async processAssetBatch(assets, fieldMappings, ciType, options = {}) {
    try {
      logger.logInfo(`Processing batch of ${assets.length} asset(s)...`);

      // Build XML payload for all assets in batch
      const xmlPayload = this.ivantiService.buildAssetXml(assets, fieldMappings, ciType);

      // If dry run, log the payload and skip posting
      if (options.dryRun) {
        logger.logInfo(`[DRY RUN] Skipping post to Ivanti queue.`);
        logger.logDebug(`[DRY RUN] XML Payload would be:\n${xmlPayload}`);
        this.importStats.totalProcessed += assets.length; // Still count as "processed" for stats
        return;
      }

      // Post to Ivanti queue with ClientAuthenticationKey and TenantId
      const result = await this.ivantiService.postToIntegrationQueue(
        xmlPayload,
        this.integrationConfig.ClientAuthenticationKey,
        this.integrationConfig.TenantId
      );

      if (result.success) {
        this.importStats.totalProcessed += assets.length;
        logger.logInfo(`Batch processed successfully: ${assets.length} asset(s) posted to queue`);
      } else {
        this.importStats.totalFailed += assets.length;
        logger.logError(`Failed to process batch: ${assets.length} asset(s) - ${result.message}`);
      }
    } catch (error) {
      this.importStats.totalFailed += assets.length;
      logger.logError(`Error processing asset batch: ${error.message}`);
    }
  }

  /**
   * Process a single asset
   * @param {object} asset - Asset data from source
   * @param {Array} fieldMappings - Field mappings
   * @param {string} ciType - CI Type value
   * @param {object} options - Additional options like { dryRun: boolean }
   * @returns {Promise<void>}
   */
  async processAsset(asset, fieldMappings, ciType, options = {}) {
    // Consolidate logic by using the batch processor for a single asset
    await this.processAssetBatch([asset], fieldMappings, ciType, options);
  }
  
  /**
   * Import a single asset by ID
   * @param {string} assetId - Asset ID in source system
   * @param {object} integrationConfig - Integration configuration
   * @returns {Promise<object>} - Import result
   */
  async importSingleAsset(assetId, integrationConfig) {
    try {
      logger.logInfo(`Importing single asset: ${assetId}`);

      // Create integration log only if not in dry run mode
      if (!options.dryRun) {
        this.logRecId = await this.ivantiService.createIntegrationLog(
          integrationConfig.IntegrationSourceType,
          integrationConfig.IntegrationName || integrationConfig.IntegrationSourceType,
          `Single asset import for ID: ${assetId}`
        );
      }

      // Get the asset from source
      const asset = await this.sourceAdapter.getAssetById(assetId);

      if (!asset) {
        throw new Error(`Asset not found: ${assetId}`);
      }

      this.importStats.totalReceived = 1;

      // Get CI Types
      const ciTypes = await this.ivantiService.getCITypes(integrationConfig.RecId);

      if (ciTypes.length === 0) {
        throw new Error('No CI Types configured');
      }

      // Use first CI Type (or implement logic to determine appropriate CI Type)
      const ciType = ciTypes[0];
      const fieldMappings = await this.ivantiService.getFieldMappings(ciType.RecId);

      // Process the asset
      await this.processAsset(asset, fieldMappings, ciType.CIType);

      // Finalize log
      this.importStats.endTime = new Date();
      await this.finalizeLog(this.logRecId, 'Stats');

      logger.logInfo(`Single asset import completed for: ${assetId}`);

      return {
        success: true,
        assetId,
        processed: this.importStats.totalProcessed > 0,
        failed: this.importStats.totalFailed > 0
      };
    } catch (error) {
      this.importStats.totalFailed = 1;
      this.importStats.endTime = new Date();
      await this.finalizeLog(this.logRecId, 'Error'); // Pass this.logRecId even if null

      logger.logError(`Single asset import failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Finalize integration log
   * @param {string} logRecId - Log record ID
   * @param {string} status - Final status
   * @returns {Promise<void>}
   */
  async finalizeLog(logRecId, logType) {
    if (!logRecId) {
      logger.logWarning('No log record ID available for finalization');
      return;
    }

    try {
      const endTime = this.importStats.endTime || new Date();
      const durationMs = endTime - this.importStats.startTime;
      const durationSeconds = Math.floor(durationMs / 1000);
      
      await this.ivantiService.updateIntegrationLog(
        logRecId,
        this.importStats.totalProcessed,
        this.importStats.totalReceived,
        this.importStats.totalFailed,
        logType,
        durationSeconds
      );
    } catch (error) {
      logger.logError(`Failed to finalize log: ${error.message}`);
    }
  }

  /**
   * Get import duration
   * @returns {string} - Duration string
   */
  getDuration() {
    if (!this.importStats.startTime) return 'N/A';
    
    const endTime = this.importStats.endTime || new Date();
    const durationMs = endTime - this.importStats.startTime;
    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Get import statistics
   * @returns {object} - Import statistics
   */
  getStats() {
    return {
      ...this.importStats,
      duration: this.getDuration()
    };
  }
}

module.exports = AssetImportService;