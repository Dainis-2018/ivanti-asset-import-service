const logger = require('../utils/logger');
const AssetImportService = require('../services/assetImportService');

/**
 * Import Controller
 * Handles HTTP requests for asset import operations
 */
class ImportController {
  /**
   * Handle full asset import request
   * Supports both Ivanti-triggered and independent execution modes
   */
  static async importAssets(req, res) {
    const startTime = new Date();
    
    try {
      // Extract parameters from request
      const {
        ivantiUrl,
        ivantiApiKey,
        integrationSourceType,
        singleAssetId
      } = req.body;

      // Also check headers for API key (alternative method)
      const apiKeyFromHeader = req.headers['x-ivanti-api-key'];
      const effectiveApiKey = ivantiApiKey || apiKeyFromHeader;

      // Validate required parameters
      if (!ivantiUrl) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameter: ivantiUrl'
        });
      }

      if (!effectiveApiKey) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameter: ivantiApiKey (in body or X-Ivanti-API-Key header)'
        });
      }

      if (!integrationSourceType) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameter: integrationSourceType'
        });
      }

      logger.logInfo('═══════════════════════════════════════════════════════');
      logger.logInfo('  Asset Import Request Received');
      logger.logInfo('═══════════════════════════════════════════════════════');
      logger.logInfo(`  Ivanti URL: ${ivantiUrl}`);
      logger.logInfo(`  Source Type: ${integrationSourceType}`);
      logger.logInfo(`  Single Asset: ${singleAssetId || 'No (full import)'}`);
      logger.logInfo('═══════════════════════════════════════════════════════');

      // Return immediate response to Ivanti
      res.status(202).json({
        success: true,
        message: 'Asset import started',
        timestamp: startTime.toISOString(),
        integrationSourceType,
        singleAsset: !!singleAssetId
      });

      // Execute import asynchronously
      this.executeImport(ivantiUrl, effectiveApiKey, integrationSourceType, singleAssetId)
        .catch(error => {
          logger.logError(`Async import execution failed: ${error.message}`);
        });

    } catch (error) {
      logger.logError(`Import request handling error: ${error.message}`);
      
      // Try to send error response if headers not sent
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: 'Internal server error',
          message: error.message
        });
      }
    }
  }

  /**
   * Execute the import process asynchronously
   */
  static async executeImport(ivantiUrl, ivantiApiKey, integrationSourceType, singleAssetId) {
    const importService = new AssetImportService();
    
    try {
      // Initialize the service
      const integrationConfig = await importService.initialize(
        ivantiUrl,
        ivantiApiKey,
        integrationSourceType
      );

      // Execute import
      if (singleAssetId) {
        // Single asset import
        await importService.importSingleAsset(singleAssetId, integrationConfig);
      } else {
        // Full import
        await importService.importAssets(integrationConfig);
      }

      logger.logInfo('Import execution completed successfully');
    } catch (error) {
      logger.logError(`Import execution failed: ${error.message}`, error.stack);
    }
  }

  /**
   * Handle synchronous import request (waits for completion)
   * Use this for debugging or when immediate results are needed
   */
  static async importAssetsSync(req, res) {
    const startTime = new Date();
    const importService = new AssetImportService();
    
    try {
      const {
        ivantiUrl,
        ivantiApiKey,
        integrationSourceType,
        singleAssetId
      } = req.body;

      const apiKeyFromHeader = req.headers['x-ivanti-api-key'];
      const effectiveApiKey = ivantiApiKey || apiKeyFromHeader;

      // Validate
      if (!ivantiUrl || !effectiveApiKey || !integrationSourceType) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameters'
        });
      }

      // Initialize
      const integrationConfig = await importService.initialize(
        ivantiUrl,
        effectiveApiKey,
        integrationSourceType
      );

      // Execute import
      let result;
      if (singleAssetId) {
        result = await importService.importSingleAsset(singleAssetId, integrationConfig);
      } else {
        result = await importService.importAssets(integrationConfig);
      }

      const endTime = new Date();
      const duration = Math.floor((endTime - startTime) / 1000);

      // Return result
      res.status(200).json({
        success: true,
        message: 'Asset import completed',
        stats: importService.getStats(),
        duration: `${duration}s`,
        timestamp: endTime.toISOString()
      });

    } catch (error) {
      logger.logError(`Sync import failed: ${error.message}`, error.stack);
      
      res.status(500).json({
        success: false,
        error: 'Import failed',
        message: error.message,
        stats: importService.getStats()
      });
    }
  }

  /**
   * Get supported source types
   */
  static async getSupportedSources(req, res) {
    try {
      const AdapterFactory = require('../adapters/AdapterFactory');
      const supportedTypes = AdapterFactory.getSupportedTypes();

      res.status(200).json({
        success: true,
        supportedSources: supportedTypes,
        count: supportedTypes.length
      });
    } catch (error) {
      logger.logError(`Error getting supported sources: ${error.message}`);
      res.status(500).json({
        success: false,
        error: 'Failed to get supported sources'
      });
    }
  }

  /**
   * Health check endpoint
   */
  static async healthCheck(req, res) {
    res.status(200).json({
      status: 'OK',
      service: 'Ivanti Asset Import Service',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  }
}

module.exports = ImportController;
