const express = require('express');
const ImportController = require('../controllers/importController');

const router = express.Router();

/**
 * API Routes
 */

// Main import endpoint (async - returns immediately)
router.post('/import', ImportController.importAssets);

// Synchronous import endpoint (waits for completion)
router.post('/import/sync', ImportController.importAssetsSync);

// Encrypt configuration (for testing/generation)
router.post('/encrypt-config', ImportController.encryptConfiguration);

// Get supported source types
router.get('/sources', ImportController.getSupportedSources);

// Health check
router.get('/health', ImportController.healthCheck);

module.exports = router;
