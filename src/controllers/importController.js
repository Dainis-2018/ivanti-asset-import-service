const logger = require('../utils/logger');
const AssetImportService = require('../services/assetImportService');
const healthCheckPinger = require('../utils/healthCheckPinger');
const { encryptConfig, decryptConfig } = require('../utils/encryptionUtils');

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
        singleAssetId,
        dryRun = false
      } = req.body;

      const effectiveApiKey = ImportController._getApiKey(req);

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
      if (dryRun) {
        logger.logInfo('  Mode: DRY RUN');
      }
      logger.logInfo('═══════════════════════════════════════════════════════');

      // Return immediate response to Ivanti
      res.status(202).json({
        success: true,
        message: 'Asset import started',
        timestamp: startTime.toISOString(),
        integrationSourceType,
        singleAsset: !!singleAssetId
      });

      // Execute the import asynchronously. It's crucial to add a catch block here
      // to prevent unhandled promise rejections from background tasks from affecting
      // the main Express error handling flow.
      ImportController.executeImport(ivantiUrl, effectiveApiKey, integrationSourceType, singleAssetId, { dryRun }).catch(error => {
        logger.logError(`Background import execution failed: ${error.message}`, error.stack);
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
  static async executeImport(ivantiUrl, ivantiApiKey, integrationSourceType, singleAssetId, options = {}) {
    const importService = new AssetImportService();
    
    try {
      // Signal the start of a long-running process to activate the health check pinger
      healthCheckPinger.startProcess();

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
        await importService.importAssets(integrationConfig, options);
      }

      logger.logInfo('Import execution completed successfully');
    } catch (error) {
      logger.logError(`Import execution failed: ${error.message}`, error.stack);
    } finally {
      // Always signal the end of the process to allow the pinger to stop
      // This is crucial for async operations
      healthCheckPinger.endProcess();
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
        singleAssetId,
        dryRun = false
      } = req.body;

      const effectiveApiKey = ImportController._getApiKey(req);

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
        result = await importService.importAssets(integrationConfig, { dryRun });
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

  /**
   * Encrypt a configuration object via API request.
   * This is useful for generating encrypted strings from Ivanti or other tools.
   */
  static async encryptConfiguration(req, res) {
    try {
      const { configData, nonce } = req.body;
      const effectiveApiKey = ImportController._getApiKey(req);

      // Validate required parameters
      if (!configData || typeof configData !== 'object') {
        return res.status(400).json({ success: false, error: 'Missing or invalid required parameter: configData (must be a JSON object)' });
      }
      if (!effectiveApiKey) {
        return res.status(400).json({ success: false, error: 'Missing required parameter: ivantiApiKey (in body or X-Ivanti-API-Key header)' });
      }
      if (!nonce) {
        return res.status(400).json({ success: false, error: 'Missing required parameter: nonce' });
      }

      logger.logInfo('Encrypt configuration request received...');

      // Encrypt the configuration using the utility function
      const encryptedConfig = encryptConfig(
        configData,
        effectiveApiKey,
        nonce
      );

      logger.logInfo('Configuration encrypted successfully via API.');

      res.status(200).json({
        success: true,
        message: 'Encryption successful',
        encryptedConfig,
        nonce
      });

    } catch (error) {
      logger.logError(`Configuration encryption failed: ${error.message}`);
      res.status(500).json({
        success: false,
        error: 'Encryption failed.',
        message: error.message
      });
    }
  }

  /**
   * Get API key from body or header
   * @private
   */
  static _getApiKey(req) {
    const apiKeyFromHeader = req.headers['x-ivanti-api-key'];
    return req.body.ivantiApiKey || apiKeyFromHeader;
  }
}

module.exports = ImportController;
