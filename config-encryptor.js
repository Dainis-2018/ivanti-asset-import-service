#!/usr/bin/env node

/**
 * Configuration Encryption Tool
 * 
 * This utility encrypts configuration data and stores it in Ivanti ITSM
 * 
 * Usage:
 *   node config-encryptor.js --mode encrypt --input config.json --apikey YOUR_API_KEY --nonce YOUR_NONCE
 *   node config-encryptor.js --mode decrypt --encrypted "..." --apikey YOUR_API_KEY --nonce YOUR_NONCE
 *   node config-encryptor.js --mode upload --input config.json --apikey YOUR_API_KEY --nonce YOUR_NONCE --ivanti-url https://... --record-id RecID
 */

const fs = require('fs');
const path = require('path');
const { encryptConfig, decryptConfig, testEncryption } = require('./src/utils/encryptionUtils');
const webRequestUtils = require('./src/utils/webRequestUtils');

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    mode: 'encrypt', // encrypt, decrypt, upload, test
    input: null,
    output: null,
    encrypted: null,
    apikey: null,
    nonce: null,
    ivantiUrl: null,
    recordId: null,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case '--mode':
      case '-m':
        options.mode = nextArg;
        i++;
        break;
      case '--input':
      case '-i':
        options.input = nextArg;
        i++;
        break;
      case '--output':
      case '-o':
        options.output = nextArg;
        i++;
        break;
      case '--encrypted':
      case '-e':
        options.encrypted = nextArg;
        i++;
        break;
      case '--apikey':
      case '-k':
        options.apikey = nextArg;
        i++;
        break;
      case '--nonce':
      case '-n':
        options.nonce = nextArg;
        i++;
        break;
      case '--ivanti-url':
      case '-u':
        options.ivantiUrl = nextArg;
        i++;
        break;
      case '--record-id':
      case '-r':
        options.recordId = nextArg;
        i++;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
    }
  }

  return options;
}

// Display help
function showHelp() {
  console.log(`
Configuration Encryption Tool
==============================

Usage:
  node config-encryptor.js [options]

Modes:
  test                  - Test encryption/decryption functionality
  encrypt               - Encrypt configuration file
  decrypt               - Decrypt encrypted configuration
  upload                - Encrypt and upload to Ivanti

Options:
  --mode, -m <mode>              Operation mode (test|encrypt|decrypt|upload)
  --input, -i <file>             Input JSON file with configuration
  --output, -o <file>            Output file for encrypted data
  --encrypted, -e <data>         Encrypted data string for decryption
  --apikey, -k <key>             Ivanti API key for encryption
  --nonce, -n <nonce>            Nonce value for encryption
  --ivanti-url, -u <url>         Ivanti ITSM URL (for upload mode)
  --record-id, -r <id>           Record ID in xsc_assetintegrationconfigs (for upload mode)
  --help, -h                     Show this help message

Examples:

  1. Test encryption functionality:
     node config-encryptor.js --mode test

  2. Encrypt a configuration file:
     node config-encryptor.js --mode encrypt \\
       --input config.json \\
       --apikey "your-ivanti-api-key" \\
       --nonce "your-unique-nonce"

  3. Decrypt configuration:
     node config-encryptor.js --mode decrypt \\
       --encrypted "salt:iv:tag:data" \\
       --apikey "your-ivanti-api-key" \\
       --nonce "your-unique-nonce"

  4. Encrypt and upload to Ivanti:
     node config-encryptor.js --mode upload \\
       --input config.json \\
       --apikey "your-ivanti-api-key" \\
       --nonce "your-unique-nonce" \\
       --ivanti-url "https://your-tenant.ivanticloud.com/HEAT/" \\
       --record-id "1234567890ABCDEF"

Configuration File Format:
  {
    "IntegrationSourceType": "vmware",
    "EndpointUrl": "https://vcenter.company.com",
    "Username": "service@vsphere.local",
    "Password": "SecurePassword123!",
    "ApiToken": "optional-api-token",
    "ClientAuthenticationKey": "your-client-auth-key",
    "TenantId": "your-tenant-id",
    "PageSize": 50,
    "LOG_LEVEL": "info"
  }

Security Notes:
  - Keep your API key and nonce secure
  - Use environment variables for sensitive data
  - The nonce should be unique per integration
  - Consider using: $(hostname)-$(date +%s) as nonce
`);
}

// Read JSON file
function readJsonFile(filePath) {
  try {
    const absolutePath = path.resolve(filePath);
    const content = fs.readFileSync(absolutePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error reading file ${filePath}: ${error.message}`);
    process.exit(1);
  }
}

// Write to file
function writeFile(filePath, content) {
  try {
    const absolutePath = path.resolve(filePath);
    fs.writeFileSync(absolutePath, content, 'utf8');
    console.log(`✓ Written to: ${absolutePath}`);
  } catch (error) {
    console.error(`Error writing file ${filePath}: ${error.message}`);
    process.exit(1);
  }
}

// Encrypt mode
async function encryptMode(options) {
  if (!options.input) {
    console.error('Error: --input is required for encrypt mode');
    process.exit(1);
  }
  if (!options.apikey) {
    console.error('Error: --apikey is required for encrypt mode');
    process.exit(1);
  }
  if (!options.nonce) {
    console.error('Error: --nonce is required for encrypt mode');
    process.exit(1);
  }

  console.log('Reading configuration file...');
  const config = readJsonFile(options.input);
  
  console.log('Configuration to encrypt:');
  console.log(JSON.stringify(config, null, 2));
  console.log();

  console.log('Encrypting...');
  const encrypted = encryptConfig(config, options.apikey, options.nonce);
  
  console.log('✓ Encryption successful!');
  console.log();
  console.log('Encrypted data:');
  console.log(encrypted);
  console.log();
  console.log(`Length: ${encrypted.length} characters`);
  
  if (options.output) {
    writeFile(options.output, encrypted);
  }
  
  console.log();
  console.log('To use this encrypted configuration:');
  console.log('1. Store this encrypted string in Ivanti field "EncryptedConfig"');
  console.log('2. The service will automatically decrypt it using the API key and nonce');
}

// Decrypt mode
async function decryptMode(options) {
  if (!options.encrypted) {
    console.error('Error: --encrypted is required for decrypt mode');
    process.exit(1);
  }
  if (!options.apikey) {
    console.error('Error: --apikey is required for decrypt mode');
    process.exit(1);
  }
  if (!options.nonce) {
    console.error('Error: --nonce is required for decrypt mode');
    process.exit(1);
  }

  console.log('Decrypting...');
  const decrypted = decryptConfig(options.encrypted, options.apikey, options.nonce);
  
  console.log('✓ Decryption successful!');
  console.log();
  console.log('Decrypted configuration:');
  console.log(JSON.stringify(decrypted, null, 2));
  
  if (options.output) {
    writeFile(options.output, JSON.stringify(decrypted, null, 2));
  }
}

// Upload mode
async function uploadMode(options) {
  if (!options.input) {
    console.error('Error: --input is required for upload mode');
    process.exit(1);
  }
  if (!options.apikey) {
    console.error('Error: --apikey is required for upload mode');
    process.exit(1);
  }
  if (!options.nonce) {
    console.error('Error: --nonce is required for upload mode');
    process.exit(1);
  }
  if (!options.ivantiUrl) {
    console.error('Error: --ivanti-url is required for upload mode');
    process.exit(1);
  }
  if (!options.recordId) {
    console.error('Error: --record-id is required for upload mode');
    process.exit(1);
  }

  console.log('Reading configuration file...');
  const config = readJsonFile(options.input);
  
  console.log('Configuration to encrypt and upload:');
  console.log(JSON.stringify(config, null, 2));
  console.log();

  console.log('Encrypting...');
  const encrypted = encryptConfig(config, options.apikey, options.nonce);
  console.log('✓ Encryption successful!');
  console.log();

  console.log('Uploading to Ivanti...');
  const updateUrl = `${options.ivantiUrl}api/odata/businessobject/xsc_assetintegrationconfigs('${options.recordId}')`;
  
  try {
    const response = await webRequestUtils.makeRequest(
      'PATCH',
      updateUrl,
      {
        EncryptedConfig: encrypted
      },
      {
        'Authorization': `rest_api_key=${options.apikey}`,
        'Content-Type': 'application/json'
      }
    );

    console.log('✓ Upload successful!');
    console.log();
    console.log('Record updated in Ivanti:');
    console.log(`  URL: ${updateUrl}`);
    console.log(`  RecId: ${options.recordId}`);
    console.log();
    console.log('The encrypted configuration is now stored in Ivanti.');
    console.log('The service will automatically decrypt it during import.');
    
  } catch (error) {
    console.error('✗ Upload failed!');
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Test mode
async function testMode() {
  console.log('Running encryption tests...');
  console.log();
  
  const success = testEncryption();
  
  if (success) {
    console.log();
    console.log('✓ All tests passed!');
    console.log();
    console.log('The encryption system is working correctly.');
  } else {
    console.log();
    console.log('✗ Tests failed!');
    process.exit(1);
  }
}

// Main function
async function main() {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    return;
  }

  console.log('═══════════════════════════════════════════════════════');
  console.log('  Configuration Encryption Tool');
  console.log('═══════════════════════════════════════════════════════');
  console.log();

  switch (options.mode) {
    case 'test':
      await testMode();
      break;
    case 'encrypt':
      await encryptMode(options);
      break;
    case 'decrypt':
      await decryptMode(options);
      break;
    case 'upload':
      await uploadMode(options);
      break;
    default:
      console.error(`Unknown mode: ${options.mode}`);
      console.error('Use --help for usage information');
      process.exit(1);
  }
}

// Run
main().catch(error => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
