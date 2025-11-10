const crypto = require('crypto');
const logger = require('./logger');

/**
 * Encryption Utilities
 * Provides encryption/decryption for configuration data using AES-256-GCM
 * Uses the Ivanti API key as the encryption key and a nonce for security
 */

// Constants
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits authentication tag
const SALT_LENGTH = 32; // Salt for key derivation

/**
 * Derive a cryptographic key from the API key using PBKDF2
 * @param {string} apiKey - The Ivanti API key
 * @param {Buffer} salt - Salt for key derivation
 * @returns {Buffer} - Derived key
 */
function deriveKey(apiKey, salt) {
  if (!apiKey || typeof apiKey !== 'string') {
    throw new Error('API key must be a non-empty string');
  }
  
  // Use PBKDF2 to derive a key from the API key
  return crypto.pbkdf2Sync(
    apiKey,
    salt,
    100000, // iterations
    KEY_LENGTH,
    'sha256'
  );
}

/**
 * Encrypt configuration data
 * @param {object} configData - Configuration object to encrypt
 * @param {string} apiKey - Ivanti API key used as encryption key
 * @param {string} nonce - Nonce value for additional security
 * @returns {string} - Encrypted data as base64 string with format: salt:iv:authTag:encrypted
 */
function encryptConfig(configData, apiKey, nonce) {
  try {
    if (!configData || typeof configData !== 'object') {
      throw new Error('Configuration data must be a valid object');
    }
    
    if (!apiKey || typeof apiKey !== 'string') {
      throw new Error('API key must be a non-empty string');
    }
    
    if (!nonce || typeof nonce !== 'string') {
      throw new Error('Nonce must be a non-empty string');
    }

    // Convert config to JSON string
    const configJson = JSON.stringify(configData);
    
    // Generate random salt for key derivation
    const salt = crypto.randomBytes(SALT_LENGTH);
    
    // Derive encryption key from API key and salt
    const key = deriveKey(apiKey, salt);
    
    // Generate random IV
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Create cipher with nonce as additional authenticated data (AAD)
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    cipher.setAAD(Buffer.from(nonce, 'utf8'));
    
    // Encrypt the data
    let encrypted = cipher.update(configJson, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    // Get authentication tag
    const authTag = cipher.getAuthTag();
    
    // Combine salt, IV, auth tag, and encrypted data
    // Format: salt:iv:authTag:encrypted (all base64 encoded)
    const result = [
      salt.toString('base64'),
      iv.toString('base64'),
      authTag.toString('base64'),
      encrypted
    ].join(':');
    
    logger.logInfo('Configuration encrypted successfully');
    return result;
    
  } catch (error) {
    logger.logError(`Encryption error: ${error.message}`);
    throw new Error(`Failed to encrypt configuration: ${error.message}`);
  }
}

/**
 * Decrypt configuration data
 * @param {string} encryptedData - Encrypted data string (salt:iv:authTag:encrypted)
 * @param {string} apiKey - Ivanti API key used as encryption key
 * @param {string} nonce - Nonce value for additional security
 * @returns {object} - Decrypted configuration object
 */
function decryptConfig(encryptedData, apiKey, nonce) {
  try {
    if (!encryptedData || typeof encryptedData !== 'string') {
      throw new Error('Encrypted data must be a non-empty string');
    }
    
    if (!apiKey || typeof apiKey !== 'string') {
      throw new Error('API key must be a non-empty string');
    }
    
    if (!nonce || typeof nonce !== 'string') {
      throw new Error('Nonce must be a non-empty string');
    }

    // Parse the encrypted data format: salt:iv:authTag:encrypted
    const parts = encryptedData.split(':');
    if (parts.length !== 4) {
      throw new Error('Invalid encrypted data format. Expected: salt:iv:authTag:encrypted');
    }
    
    const [saltB64, ivB64, authTagB64, encrypted] = parts;
    
    // Decode base64 components
    const salt = Buffer.from(saltB64, 'base64');
    const iv = Buffer.from(ivB64, 'base64');
    const authTag = Buffer.from(authTagB64, 'base64');
    
    // Validate component lengths
    if (salt.length !== SALT_LENGTH) {
      throw new Error(`Invalid salt length: expected ${SALT_LENGTH}, got ${salt.length}`);
    }
    if (iv.length !== IV_LENGTH) {
      throw new Error(`Invalid IV length: expected ${IV_LENGTH}, got ${iv.length}`);
    }
    if (authTag.length !== AUTH_TAG_LENGTH) {
      throw new Error(`Invalid auth tag length: expected ${AUTH_TAG_LENGTH}, got ${authTag.length}`);
    }
    
    // Derive decryption key from API key and salt
    const key = deriveKey(apiKey, salt);
    
    // Create decipher with nonce as additional authenticated data (AAD)
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAAD(Buffer.from(nonce, 'utf8'));
    decipher.setAuthTag(authTag);
    
    // Decrypt the data
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    // Parse JSON
    const configData = JSON.parse(decrypted);
    
    logger.logInfo('Configuration decrypted successfully');
    return configData;
    
  } catch (error) {
    logger.logError(`Decryption error: ${error.message}`);
    throw new Error(`Failed to decrypt configuration: ${error.message}`);
  }
}

/**
 * Test encryption/decryption with sample data
 * @returns {boolean} - True if test passed
 */
function testEncryption() {
  try {
    const testData = {
      Username: 'testuser',
      Password: 'testpass',
      ApiToken: 'test-token-123',
      EndpointUrl: 'https://test.example.com',
      PageSize: 50
    };
    
    const testApiKey = 'test-api-key-12345';
    const testNonce = 'test-nonce-67890';
    
    // Encrypt
    const encrypted = encryptConfig(testData, testApiKey, testNonce);
    console.log('Encrypted:', encrypted);
    
    // Decrypt
    const decrypted = decryptConfig(encrypted, testApiKey, testNonce);
    console.log('Decrypted:', decrypted);
    
    // Verify
    const matches = JSON.stringify(testData) === JSON.stringify(decrypted);
    console.log('Test passed:', matches);
    
    return matches;
  } catch (error) {
    console.error('Test failed:', error.message);
    return false;
  }
}

module.exports = {
  encryptConfig,
  decryptConfig,
  testEncryption
};
