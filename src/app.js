const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const logger = require('./utils/logger');
const healthCheckPinger = require('./utils/healthCheckPinger');
const routes = require('./routes');

const app = express();
const port = process.env.PORT || 3000;

// Trust proxy for IIS environment
app.set('trust proxy', true);

// Middleware
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// CORS handling
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-API-Key, X-Ivanti-API-Key');
  res.status(200).send();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Static files
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));

// Index page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/index.html'));
});

// API routes
app.use('/api', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  logger.logError(`Unhandled error: ${err.message}`, err.stack);
  res.status(500).json({ error: 'Internal server error', message: err.message });
  // It's crucial to exit the process on unhandled errors in a server application
  // to prevent it from running in a potentially corrupted state.
  // In a production environment, a process manager (like PM2 or systemd)
  // should be configured to restart the application automatically.
  process.exit(1);
});

// Handle uncaught exceptions and unhandled promise rejections
// These are critical errors that indicate the application is in an unrecoverable state.
process.on('uncaughtException', (error) => {
  logger.logError('Uncaught Exception:', error);
  // Exit the process to prevent it from running in an undefined state.
  // A process manager should restart the application.
  process.exit(1);
});

// Start server
app.listen(port, () => {
  logger.logInfo('═══════════════════════════════════════════════════════');
  logger.logInfo('  Ivanti Asset Import Service Started');
  logger.logInfo('═══════════════════════════════════════════════════════');
  logger.logInfo(`  Port: ${port}`);
  logger.logInfo(`  Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.logInfo(`  Log Level: ${logger.logLevel}`);
  logger.logInfo('═══════════════════════════════════════════════════════');

  // Start health check pinger if configured
  const baseUrl = process.env.BASE_URL || `http://localhost:${port}`;  
  healthCheckPinger.initialize(baseUrl);
});

module.exports = app;
