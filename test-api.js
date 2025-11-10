#!/usr/bin/env node

/**
 * Test Script for Ivanti Asset Import Service
 * Tests all API endpoints and validates responses
 */

const http = require('http');
const https = require('https');

// Configuration
const SERVICE_URL = process.env.TEST_SERVICE_URL || 'http://localhost:3000';
const IVANTI_URL = process.env.TEST_IVANTI_URL || 'https://demo.ivanticloud.com/HEAT/';
const IVANTI_API_KEY = process.env.TEST_IVANTI_API_KEY || 'test-api-key';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

let passedTests = 0;
let failedTests = 0;

/**
 * Make HTTP request
 */
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, SERVICE_URL);
    const protocol = url.protocol === 'https:' ? https : http;

    const options = {
      method,
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = protocol.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsedBody = body ? JSON.parse(body) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: parsedBody
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * Log test result
 */
function logTest(name, passed, message = '') {
  if (passed) {
    console.log(`${colors.green}✓${colors.reset} ${name}`);
    if (message) console.log(`  ${colors.blue}${message}${colors.reset}`);
    passedTests++;
  } else {
    console.log(`${colors.red}✗${colors.reset} ${name}`);
    if (message) console.log(`  ${colors.red}${message}${colors.reset}`);
    failedTests++;
  }
}

/**
 * Test health endpoint
 */
async function testHealthEndpoint() {
  console.log('\n' + colors.yellow + '='.repeat(60) + colors.reset);
  console.log(colors.yellow + 'Testing Health Endpoint' + colors.reset);
  console.log(colors.yellow + '='.repeat(60) + colors.reset + '\n');

  try {
    const response = await makeRequest('GET', '/health');
    
    logTest(
      'GET /health returns 200',
      response.status === 200,
      `Status: ${response.status}`
    );

    logTest(
      'Health response contains status',
      response.body && response.body.status === 'OK',
      response.body ? `Status: ${response.body.status}` : 'No body'
    );

    logTest(
      'Health response contains timestamp',
      response.body && response.body.timestamp,
      response.body ? `Timestamp: ${response.body.timestamp}` : 'No timestamp'
    );

  } catch (error) {
    logTest('GET /health', false, `Error: ${error.message}`);
  }
}

/**
 * Test supported sources endpoint
 */
async function testSourcesEndpoint() {
  console.log('\n' + colors.yellow + '='.repeat(60) + colors.reset);
  console.log(colors.yellow + 'Testing Supported Sources Endpoint' + colors.reset);
  console.log(colors.yellow + '='.repeat(60) + colors.reset + '\n');

  try {
    const response = await makeRequest('GET', '/api/sources');
    
    logTest(
      'GET /api/sources returns 200',
      response.status === 200,
      `Status: ${response.status}`
    );

    logTest(
      'Sources response contains supportedSources array',
      response.body && Array.isArray(response.body.supportedSources),
      response.body ? `Count: ${response.body.count}` : 'No body'
    );

    if (response.body && response.body.supportedSources) {
      console.log(`  ${colors.blue}Supported sources: ${response.body.supportedSources.join(', ')}${colors.reset}`);
    }

  } catch (error) {
    logTest('GET /api/sources', false, `Error: ${error.message}`);
  }
}

/**
 * Test import endpoint validation
 */
async function testImportValidation() {
  console.log('\n' + colors.yellow + '='.repeat(60) + colors.reset);
  console.log(colors.yellow + 'Testing Import Endpoint Validation' + colors.reset);
  console.log(colors.yellow + '='.repeat(60) + colors.reset + '\n');

  // Test missing parameters
  try {
    const response = await makeRequest('POST', '/api/import', {});
    
    logTest(
      'POST /api/import without parameters returns 400',
      response.status === 400,
      `Status: ${response.status}`
    );

    logTest(
      'Error response contains error message',
      response.body && response.body.error,
      response.body ? `Error: ${response.body.error}` : 'No error message'
    );

  } catch (error) {
    logTest('POST /api/import validation', false, `Error: ${error.message}`);
  }

  // Test missing API key
  try {
    const response = await makeRequest('POST', '/api/import', {
      ivantiUrl: IVANTI_URL,
      integrationSourceType: 'vmware'
    });
    
    logTest(
      'POST /api/import without API key returns 400',
      response.status === 400,
      `Status: ${response.status}`
    );

  } catch (error) {
    logTest('POST /api/import API key validation', false, `Error: ${error.message}`);
  }
}

/**
 * Test import endpoint with mock data
 */
async function testImportEndpoint() {
  console.log('\n' + colors.yellow + '='.repeat(60) + colors.reset);
  console.log(colors.yellow + 'Testing Import Endpoint (Mock)' + colors.reset);
  console.log(colors.yellow + '='.repeat(60) + colors.reset + '\n');

  console.log(colors.blue + 'Note: This test will fail if Ivanti is not configured' + colors.reset);
  console.log(colors.blue + 'Set TEST_IVANTI_URL and TEST_IVANTI_API_KEY to test fully' + colors.reset + '\n');

  try {
    const response = await makeRequest('POST', '/api/import', {
      ivantiUrl: IVANTI_URL,
      ivantiApiKey: IVANTI_API_KEY,
      integrationSourceType: 'mock'
    });
    
    logTest(
      'POST /api/import returns 202 (Accepted)',
      response.status === 202,
      `Status: ${response.status}`
    );

    if (response.status === 202) {
      logTest(
        'Import response contains success flag',
        response.body && response.body.success,
        response.body ? `Success: ${response.body.success}` : 'No body'
      );

      logTest(
        'Import response contains message',
        response.body && response.body.message,
        response.body ? `Message: ${response.body.message}` : 'No message'
      );
    }

  } catch (error) {
    logTest('POST /api/import', false, `Error: ${error.message}`);
  }
}

/**
 * Test API key in header
 */
async function testApiKeyInHeader() {
  console.log('\n' + colors.yellow + '='.repeat(60) + colors.reset);
  console.log(colors.yellow + 'Testing API Key in Header' + colors.reset);
  console.log(colors.yellow + '='.repeat(60) + colors.reset + '\n');

  try {
    const url = new URL('/api/import', SERVICE_URL);
    const protocol = url.protocol === 'https:' ? https : http;

    const options = {
      method: 'POST',
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      headers: {
        'Content-Type': 'application/json',
        'X-Ivanti-API-Key': IVANTI_API_KEY
      }
    };

    const response = await new Promise((resolve, reject) => {
      const req = protocol.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            resolve({
              status: res.statusCode,
              body: JSON.parse(body)
            });
          } catch (e) {
            resolve({
              status: res.statusCode,
              body: body
            });
          }
        });
      });

      req.on('error', reject);
      req.write(JSON.stringify({
        ivantiUrl: IVANTI_URL,
        integrationSourceType: 'vmware'
      }));
      req.end();
    });

    logTest(
      'POST /api/import with X-Ivanti-API-Key header',
      response.status === 202 || response.status === 500,
      `Status: ${response.status} (202 = accepted, 500 = config not found)`
    );

  } catch (error) {
    logTest('API key in header', false, `Error: ${error.message}`);
  }
}

/**
 * Test root endpoint
 */
async function testRootEndpoint() {
  console.log('\n' + colors.yellow + '='.repeat(60) + colors.reset);
  console.log(colors.yellow + 'Testing Root Endpoint' + colors.reset);
  console.log(colors.yellow + '='.repeat(60) + colors.reset + '\n');

  try {
    const response = await makeRequest('GET', '/');
    
    logTest(
      'GET / returns 200 and HTML',
      response.status === 200,
      `Status: ${response.status}, Content-Type: ${response.headers['content-type']}`
    );

    logTest(
      'Root endpoint returns HTML content',
      response.headers['content-type'] && response.headers['content-type'].includes('text/html'),
      `Content-Type: ${response.headers['content-type']}`
    );

  } catch (error) {
    logTest('GET /', false, `Error: ${error.message}`);
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('\n');
  console.log(colors.blue + '╔' + '═'.repeat(58) + '╗' + colors.reset);
  console.log(colors.blue + '║' + ' '.repeat(58) + '║' + colors.reset);
  console.log(colors.blue + '║' + '  Ivanti Asset Import Service - API Tests'.padEnd(58) + '║' + colors.reset);
  console.log(colors.blue + '║' + ' '.repeat(58) + '║' + colors.reset);
  console.log(colors.blue + '╚' + '═'.repeat(58) + '╝' + colors.reset);
  console.log('');
  console.log(`Testing service at: ${colors.green}${SERVICE_URL}${colors.reset}`);

  // Run all tests
  await testHealthEndpoint();
  await testRootEndpoint();
  await testSourcesEndpoint();
  await testImportValidation();
  await testApiKeyInHeader();
  await testImportEndpoint();

  // Summary
  console.log('\n' + colors.blue + '='.repeat(60) + colors.reset);
  console.log(colors.blue + 'Test Summary' + colors.reset);
  console.log(colors.blue + '='.repeat(60) + colors.reset + '\n');

  const total = passedTests + failedTests;
  console.log(`Total tests: ${total}`);
  console.log(`${colors.green}Passed: ${passedTests}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failedTests}${colors.reset}`);
  
  if (failedTests === 0) {
    console.log(`\n${colors.green}✓ All tests passed!${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`\n${colors.red}✗ Some tests failed${colors.reset}\n`);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
  console.error(`${colors.red}Unhandled error: ${error.message}${colors.reset}`);
  process.exit(1);
});

// Run tests
runTests().catch(error => {
  console.error(`${colors.red}Test runner error: ${error.message}${colors.reset}`);
  process.exit(1);
});
