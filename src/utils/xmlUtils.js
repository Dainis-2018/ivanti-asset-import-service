const zlib = require('zlib');
const logger = require('./logger');

/**
 * Compress and Base64 encode XML payload for Ivanti
 * @param {string} xmlString - XML string to compress and encode
 * @returns {Promise<string>} - Base64 encoded compressed string
 */
const compressAndEncode = async (xmlString) => {
  return new Promise((resolve, reject) => {
    try {
      // Compress using gzip
      zlib.gzip(Buffer.from(xmlString, 'utf8'), (err, compressed) => {
        if (err) {
          logger.logError(`Compression error: ${err.message}`);
          reject(err);
          return;
        }

        // Encode to Base64
        const encoded = compressed.toString('base64');
        logger.logDebug(`XML compressed and encoded. Original size: ${xmlString.length}, Compressed size: ${compressed.length}, Encoded size: ${encoded.length}`);
        resolve(encoded);
      });
    } catch (error) {
      logger.logError(`Error in compressAndEncode: ${error.message}`);
      reject(error);
    }
  });
};

/**
 * Decode and decompress Base64 encoded gzipped data
 * @param {string} encodedString - Base64 encoded string
 * @returns {Promise<string>} - Decompressed string
 */
const decodeAndDecompress = async (encodedString) => {
  return new Promise((resolve, reject) => {
    try {
      // Decode from Base64
      const compressed = Buffer.from(encodedString, 'base64');

      // Decompress using gunzip
      zlib.gunzip(compressed, (err, decompressed) => {
        if (err) {
          logger.logError(`Decompression error: ${err.message}`);
          reject(err);
          return;
        }

        const decoded = decompressed.toString('utf8');
        resolve(decoded);
      });
    } catch (error) {
      logger.logError(`Error in decodeAndDecompress: ${error.message}`);
      reject(error);
    }
  });
};

/**
 * Escape XML special characters
 * @param {string} unsafe - String to escape
 * @returns {string} - Escaped string
 */
const escapeXml = (unsafe) => {
  if (unsafe === null || unsafe === undefined) {
    return '';
  }
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

/**
 * Escape XML attribute values
 * @param {string} unsafe - String to escape
 * @returns {string} - Escaped string
 */
const escapeXmlAttr = (unsafe) => {
  if (unsafe === null || unsafe === undefined) {
    return '';
  }
  return String(unsafe)
    .replace(/[<>&"']/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '"': return '&quot;';
        case "'": return '&apos;';
        default: return c;
      }
    });
};

module.exports = {
  compressAndEncode,
  decodeAndDecompress,
  escapeXml,
  escapeXmlAttr
};
