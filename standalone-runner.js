#!/usr/bin/env node

/**
 * Standalone Runner for Ivanti Asset Import Service
 * 
 * This script runs imports independently without waiting for API calls.
 * Perfect for scheduled execution via cron or systemd timers.
 * 
 * Usage:
 *   node standalone-runner.js [options]
 * 
 * Options:
 *   --source <type>    Process only specific source type (vmware, ipfabric, snipeit)
 *   --config <path>    Path to configuration file (default: .env or /etc/ivanti-import/config.env)
 *   --dry-run          Run in test mode without actually sending to Ivanti
 * 
 * Examples:
 *   node standalone-runner.js
 *   node standalone-runner.js --source vmware
 *   node standalone-runner.js --config /etc/ivanti-import/config.env
 *   node standalone-runner.js --dry-run
 */

const path = require('path');
const fs = require('fs');

// Try to load dotenv from multiple possible config locations
const configPaths = [
  process.argv.find(arg => arg.startsWith('--config='))?.split('=')[1],
  '/etc/ivanti-import/config.env',
  path.join(__dirname, '.env'),
  path.join(__dirname, '../.env')
].filter(Boolean);

let configLoaded = false;
for (const configPath of configPaths) {
  if (fs.existsSync(configPath)) {
    require('dotenv').config({ path: configPath });
    console.log(`Configuration loaded from: ${configPath}`);
    configLoaded = true;
    break;
  }
}

if (!configLoaded) {
  console.warn('Warning: No configuration file found. Using environment variables only.');
}

const logger = require('./src/utils/logger');
const IvantiService = require('./src/services/ivantiService');
const AssetImportService = require('./src/services/assetImportService');
const AdapterFactory = require('./src/adapters/AdapterFactory');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  singleSource: null,
  dryRun: false
};

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--source' && args[i + 1]) {
    options.singleSource = args[i + 1].toLowerCase();
    i++;
  } else if (args[i] === '--dry-run') {
    options.dryRun = true;
  } else if (args[i] === '--help' || args[i] === '-h') {
    console.log(`
Ivanti Asset Import Service - Standalone Runner

Usage: node standalone-runner.js [options]

Options:
  --source <type>    Process only specific source (vmware, ipfabric, snipeit)
  --config <path>    Path to configuration file
  --dry-run          Test mode - don't send to Ivanti
  --help, -h         Show this help message

Examples:
  node standalone-runner.js
  node standalone-runner.js --source vmware
  node standalone-runner.js --config /etc/ivanti-import/config.env
  node standalone-runner.js --dry-run

Environment Variables Required:
  IVANTI_URL        - Ivanti ITSM URL (e.g., https://tenant.ivanticloud.com/HEAT/)
  IVANTI_API_KEY    - Ivanti API key for authentication

Optional Environment Variables:
  LOG_LEVEL         - Log level (debug, info, warn, error) [default: info]
  LOG_PATH          - Path to log directory [default: ./logs]
    `);
    process.exit(0);
  }
}

// Configuration validation
const IVANTI_URL = process.env.IVANTI_URL;
const IVANTI_API_KEY = process.env.IVANTI_API_KEY;

if (!IVANTI_URL || !IVANTI_API_KEY) {
  logger.logError('ERROR: IVANTI_URL and IVANTI_API_KEY must be set in configuration');
  logger.logError('Please configure /etc/ivanti-import/config.env or .env file');
  logger.logError('Required variables:');
  logger.logError('  IVANTI_URL=https://your-tenant.ivanticloud.com/HEAT/');
  logger.logError('  IVANTI_API_KEY=your_api_key_here');
  process.exit(1);
}

/**
 * Get all active integrations from Ivanti
 */
async function getActiveIntegrations() {
  const ivantiService = new IvantiService(IVANTI_URL, IVANTI_API_KEY);
  // Dynamically get supported sources from the factory
  const supportedSources = options.singleSource ? [options.singleSource] : AdapterFactory.getSupportedTypes();
  
  try {
    const integrations = await ivantiService.getIntegrationConfigurations();
    
    // Filter for active integrations that match our supported sources
    const activeIntegrations = integrations.filter(config => 
      config.IsActive && 
      supportedSources.includes(config.IntegrationSourceType?.toLowerCase())
    );
    
    return activeIntegrations;
  } catch (error) {
    logger.logError(`Failed to get integration configurations: ${error.message}`);
    throw error;
  }
}

/**
 * Run import for a specific integration
 */
async function runImport(integrationConfig) {
  const sourceType = integrationConfig.IntegrationSourceType;
  const integrationName = integrationConfig.IntegrationName || sourceType;
  
  logger.logInfo('═══════════════════════════════════════════════════════════════');
  logger.logInfo(`Starting import: ${integrationName}`);
  logger.logInfo(`Source Type: ${sourceType}`);
  logger.logInfo(`Integration ID: ${integrationConfig.RecId}`);
  if (options.dryRun) {
    logger.logInfo('DRY RUN MODE - No data will be sent to Ivanti');
  }
  logger.logInfo('═══════════════════════════════════════════════════════════════');

  const importService = new AssetImportService();
  const startTime = Date.now();
  
  try {
    // Initialize the import service
    await importService.initialize(
      IVANTI_URL,
      IVANTI_API_KEY,
      sourceType
    );

    // Execute the import
    const result = await importService.importAssets(integrationConfig, {
      dryRun: options.dryRun
    });

    const duration = Math.round((Date.now() - startTime) / 1000);
    
    logger.logInfo('───────────────────────────────────────────────────────────────');
    logger.logInfo(`Import completed: ${integrationName}`);
    logger.logInfo(`Duration: ${duration} seconds`);
    logger.logInfo(`Total Received: ${result.totalReceived || 0}`);
    logger.logInfo(`Total Processed: ${result.totalProcessed || 0}`);
    logger.logInfo(`Total Failed: ${result.totalFailed || 0}`);
    logger.logInfo('───────────────────────────────────────────────────────────────');

    return {
      success: true,
      integrationName,
      sourceType,
      duration,
      stats: result
    };
  } catch (error) {
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    logger.logError('───────────────────────────────────────────────────────────────');
    logger.logError(`Import failed: ${integrationName}`);
    logger.logError(`Error: ${error.message}`);
    logger.logError(`Duration: ${duration} seconds`);
    logger.logError('───────────────────────────────────────────────────────────────');

    return {
      success: false,
      integrationName,
      sourceType,
      duration,
      error: error.message
    };
  }
}

/**
 * Main execution function
 */
async function main() {
  const startTime = new Date();
  
  logger.logInfo('╔════════════════════════════════════════════════════════════════╗');
  logger.logInfo('║   Ivanti Asset Import Service - Standalone Execution           ║');
  logger.logInfo('╚════════════════════════════════════════════════════════════════╝');
  logger.logInfo(`Start Time: ${startTime.toISOString()}`);
  logger.logInfo(`Ivanti URL: ${IVANTI_URL}`);
  logger.logInfo(`Log Level: ${process.env.LOG_LEVEL || 'info'}`);
  if (options.singleSource) {
    logger.logInfo(`Single Source Mode: ${options.singleSource}`);
  }
  if (options.dryRun) {
    logger.logInfo('DRY RUN MODE: No data will be sent to Ivanti');
  }
  logger.logInfo('');

  try {
    // Get active integrations from Ivanti
    logger.logInfo('Fetching integration configurations from Ivanti...');
    const activeIntegrations = await getActiveIntegrations();

    if (activeIntegrations.length === 0) {
      logger.logWarning('No active integrations found in Ivanti');
      logger.logWarning('Please configure integrations in Ivanti ITSM:');
      logger.logWarning('  Business Object: xsc_assetintegration_configs');
      logger.logWarning('  Set IsActive = true');
      logger.logWarning(`  Supported IntegrationSourceType values: ${AdapterFactory.getSupportedTypes().join(', ')}`);
      process.exit(0);
    }

    logger.logInfo(`Found ${activeIntegrations.length} active integration(s)`);
    activeIntegrations.forEach(config => {
      logger.logInfo(`  • ${config.IntegrationName || config.IntegrationSourceType} (${config.IntegrationSourceType})`);
    });
    logger.logInfo('');

    const results = [];

    // Process each integration
    for (const integration of activeIntegrations) {
      const result = await runImport(integration);
      results.push(result);
      
      // Wait between integrations to avoid overloading systems
      const isLast = activeIntegrations.indexOf(integration) === activeIntegrations.length - 1;
      const delaySeconds = parseInt(process.env.STANDALONE_INTEGRATION_DELAY, 10) || 30;
      if (!isLast) {
        logger.logInfo(`Waiting ${delaySeconds} seconds before next integration...`);
        logger.logInfo('');
        await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
      }
    }

    // Final summary
    const endTime = new Date();
    const totalDuration = Math.round((endTime - startTime) / 1000);
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const totalReceived = results.reduce((sum, r) => sum + (r.stats?.totalReceived || 0), 0);
    const totalProcessed = results.reduce((sum, r) => sum + (r.stats?.totalProcessed || 0), 0);
    const totalFailed = results.reduce((sum, r) => sum + (r.stats?.totalFailed || 0), 0);

    logger.logInfo('');
    logger.logInfo('╔════════════════════════════════════════════════════════════════╗');
    logger.logInfo('║   Execution Summary                                            ║');
    logger.logInfo('╚════════════════════════════════════════════════════════════════╝');
    logger.logInfo(`End Time: ${endTime.toISOString()}`);
    logger.logInfo(`Total Duration: ${totalDuration} seconds (${Math.round(totalDuration / 60)} minutes)`);
    logger.logInfo('');
    logger.logInfo('Integration Results:');
    logger.logInfo(`  Total Integrations: ${results.length}`);
    logger.logInfo(`  Successful: ${successful}`);
    logger.logInfo(`  Failed: ${failed}`);
    logger.logInfo('');
    logger.logInfo('Asset Statistics:');
    logger.logInfo(`  Total Assets Received: ${totalReceived}`);
    logger.logInfo(`  Total Assets Processed: ${totalProcessed}`);
    logger.logInfo(`  Total Assets Failed: ${totalFailed}`);
    logger.logInfo('');

    // List results per integration
    if (results.length > 1) {
      logger.logInfo('Per-Integration Results:');
      results.forEach(result => {
        const status = result.success ? '✓' : '✗';
        const stats = result.success 
          ? `Received: ${result.stats.totalReceived || 0}, Processed: ${result.stats.totalProcessed || 0}`
          : `Error: ${result.error}`;
        logger.logInfo(`  ${status} ${result.integrationName}: ${stats} (${result.duration}s)`);
      });
      logger.logInfo('');
    }

    // Exit with appropriate code
    if (failed > 0) {
      logger.logWarning(`Execution completed with ${failed} failure(s)`);
      process.exit(1);
    } else {
      logger.logInfo('Execution completed successfully');
      process.exit(0);
    }

  } catch (error) {
    logger.logError('╔════════════════════════════════════════════════════════════════╗');
    logger.logError('║   Fatal Error                                                  ║');
    logger.logError('╚════════════════════════════════════════════════════════════════╝');
    logger.logError(`Error: ${error.message}`);
    logger.logError('');
    logger.logError('Stack trace:');
    logger.logError(error.stack);
    
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.logError('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.logError('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run main function
main();
