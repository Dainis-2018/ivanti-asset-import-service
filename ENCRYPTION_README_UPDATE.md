# Encrypted Configuration Feature - README Update

Add this section to your existing README.md file.

---

## 🔐 Encrypted Configuration Support (NEW)

### Overview

The service now supports **encrypted configuration storage** for enhanced security. Instead of storing sensitive credentials in separate unencrypted fields, you can encrypt all configuration data into a single field using AES-256-GCM encryption.

### Key Features

- **AES-256-GCM Encryption**: Military-grade encryption for configuration data
- **API Key-Based**: Uses your Ivanti API key as the encryption key
- **Nonce Protection**: Additional security layer with unique nonces
- **Backward Compatible**: Works alongside traditional unencrypted fields
- **Easy Migration**: Simple tools for encrypting existing configurations

### Quick Start with Encryption

#### 1. Test the Encryption System

```bash
node config-encryptor.js --mode test
```

#### 2. Create Configuration File

```bash
cat > my-config.json <<EOF
{
  "IntegrationSourceType": "vmware",
  "EndpointUrl": "https://vcenter.company.com",
  "Username": "service@vsphere.local",
  "Password": "SecurePassword123!",
  "ClientAuthenticationKey": "your-client-auth-key",
  "TenantId": "your-tenant-id",
  "PageSize": 50
}
EOF
```

#### 3. Encrypt the Configuration

```bash
node config-encryptor.js \
  --mode encrypt \
  --input my-config.json \
  --apikey "your-ivanti-api-key" \
  --nonce "vmware-prod-integration"
```

**Output:**
```
Encrypted data:
Qf2h3k8L...base64-encoded-encrypted-data...9Xa2pM==

Length: 512 characters
```

#### 4. Add EncryptedConfig Field to Ivanti

In your `xsc_assetintegrationconfigs` business object, add:

- **Field Name**: `EncryptedConfig`
- **Type**: Text (4000 characters)
- **Description**: Encrypted configuration data

#### 5. Store Encrypted Data in Ivanti

##### Manual Method:
1. Open Ivanti Configuration Console
2. Navigate to your integration record
3. Paste encrypted string into `EncryptedConfig` field
4. Save

##### Automated Method:
```bash
node config-encryptor.js \
  --mode upload \
  --input my-config.json \
  --apikey "your-ivanti-api-key" \
  --nonce "vmware-prod-integration" \
  --ivanti-url "https://your-tenant.ivanticloud.com/HEAT/" \
  --record-id "YOUR_RECORD_ID"
```

#### 6. Update Service Code

```bash
# Backup existing file
cp src/services/ivantiService.js src/services/ivantiService.js.backup

# Use encrypted version
cp src/services/ivantiService-updated.js src/services/ivantiService.js

# Restart service
npm start
```

### Configuration Structure Comparison

#### Traditional (Unencrypted) Configuration:

**Ivanti Record:**
```
IntegrationName: "VMware vCenter Production"
IntegrationSourceType: "vmware"
EndpointUrl: "https://vcenter.company.com"
Username: "service@vsphere.local"
Password: "SecurePassword123!"
ApiToken: ""
ClientAuthenticationKey: "auth-key-123"
TenantId: "tenant-456"
PageSize: 50
IsActive: true
```

#### New (Encrypted) Configuration:

**Ivanti Record:**
```
IntegrationName: "VMware vCenter Production"
IntegrationSourceType: "vmware"
EncryptedConfig: "Qf2h3k8L9...encrypted-data...Xa2pM=="
IsActive: true
```

**Encrypted Data Contains:**
```json
{
  "EndpointUrl": "https://vcenter.company.com",
  "Username": "service@vsphere.local",
  "Password": "SecurePassword123!",
  "ClientAuthenticationKey": "auth-key-123",
  "TenantId": "tenant-456",
  "PageSize": 50,
  "LOG_LEVEL": "info"
}
```

### Benefits

| Feature | Traditional | Encrypted |
|---------|-------------|-----------|
| Security | ⚠️ Plaintext in database | ✅ AES-256-GCM encrypted |
| API Exposure | ⚠️ Fields readable via API | ✅ Encrypted blob only |
| Credential Rotation | ❌ Manual field updates | ✅ Re-encrypt and upload |
| Audit Trail | ⚠️ Individual field changes | ✅ Single field change |
| Compliance | ⚠️ May not meet requirements | ✅ Encryption at rest |

### Security Details

- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Derivation**: PBKDF2 with 100,000 iterations
- **Encryption Key**: Derived from Ivanti API key + salt
- **Authentication**: AEAD (Authenticated Encryption with Associated Data)
- **Nonce**: Unique identifier per integration (e.g., RecId, integration name)

### Command-Line Tool Usage

The `config-encryptor.js` utility provides four modes:

#### Test Mode
```bash
node config-encryptor.js --mode test
```
Validates encryption/decryption functionality.

#### Encrypt Mode
```bash
node config-encryptor.js \
  --mode encrypt \
  --input config.json \
  --apikey "your-ivanti-api-key" \
  --nonce "unique-nonce" \
  [--output encrypted.txt]
```
Encrypts a configuration file.

#### Decrypt Mode
```bash
node config-encryptor.js \
  --mode decrypt \
  --encrypted "encrypted-string" \
  --apikey "your-ivanti-api-key" \
  --nonce "unique-nonce" \
  [--output decrypted.json]
```
Decrypts an encrypted configuration (for testing/verification).

#### Upload Mode
```bash
node config-encryptor.js \
  --mode upload \
  --input config.json \
  --apikey "your-ivanti-api-key" \
  --nonce "unique-nonce" \
  --ivanti-url "https://tenant.ivanticloud.com/HEAT/" \
  --record-id "RECORD_ID"
```
Encrypts and uploads directly to Ivanti.

### Complete Example: VMware Integration with Encryption

```bash
# Step 1: Create configuration file
cat > vmware-config.json <<'EOF'
{
  "IntegrationSourceType": "vmware",
  "EndpointUrl": "https://vcenter.company.com",
  "Username": "service@vsphere.local",
  "Password": "YourSecurePassword123!",
  "ClientAuthenticationKey": "ivanti-client-auth-key",
  "TenantId": "ivanti-tenant-id",
  "PageSize": 50,
  "LOG_LEVEL": "info"
}
EOF

# Step 2: Encrypt configuration
node config-encryptor.js \
  --mode encrypt \
  --input vmware-config.json \
  --apikey "your-ivanti-api-key" \
  --nonce "vmware-prod-dc1" \
  --output encrypted.txt

# Step 3: View encrypted data
cat encrypted.txt

# Step 4: Upload to Ivanti
node config-encryptor.js \
  --mode upload \
  --input vmware-config.json \
  --apikey "your-ivanti-api-key" \
  --nonce "vmware-prod-dc1" \
  --ivanti-url "https://yourcompany.ivanticloud.com/HEAT/" \
  --record-id "ABC123XYZ"

# Step 5: Test the integration
curl -X POST http://localhost:3000/api/import \
  -H "Content-Type: application/json" \
  -H "X-Ivanti-API-Key: your-ivanti-api-key" \
  -d '{
    "ivantiUrl": "https://yourcompany.ivanticloud.com/HEAT/",
    "integrationSourceType": "vmware"
  }'
```

### Migration Guide

To migrate from unencrypted to encrypted configuration:

1. **Export existing configuration** from Ivanti
2. **Create JSON file** with configuration values
3. **Encrypt the JSON** using config-encryptor
4. **Add EncryptedConfig field** to business object
5. **Store encrypted data** in Ivanti record
6. **Update service code** to use encrypted version
7. **Test the integration**
8. **Remove old unencrypted fields** (optional)

See [ENCRYPTION_GUIDE.md](ENCRYPTION_GUIDE.md) for detailed migration steps.

### Backward Compatibility

The service automatically detects which configuration method to use:

```javascript
// Service logic:
if (config.EncryptedConfig exists and has data) {
  // Decrypt and use encrypted configuration
  decryptedConfig = decrypt(config.EncryptedConfig, apiKey, nonce);
  useConfiguration(decryptedConfig);
} else {
  // Use traditional unencrypted fields
  useConfiguration({
    Username: config.Username,
    Password: config.Password,
    // ... other fields
  });
}
```

This allows:
- ✅ Gradual migration (integrate by integration)
- ✅ Testing encrypted config without affecting others
- ✅ Rollback capability if needed

### Troubleshooting Encrypted Configuration

#### Decryption Failed

**Error**: `Failed to decrypt configuration: Invalid auth tag`

**Solutions**:
1. Verify API key is correct
2. Verify nonce is correct (must match encryption nonce)
3. Check encrypted data wasn't corrupted
4. Re-encrypt if necessary

#### Service Falls Back to Unencrypted

**Log**: `No encrypted configuration found, using standard fields`

**Causes**:
1. `EncryptedConfig` field is empty
2. `EncryptedConfig` field doesn't exist
3. Decryption failed (check logs for errors)

#### Authentication Still Fails

**Error**: `Failed to authenticate with source system`

**Debug Steps**:
```bash
# 1. Enable debug logging
LOG_LEVEL=debug npm start

# 2. Check if decryption succeeded
grep "Configuration decrypted" logs/asset-import-*.log

# 3. Verify decrypted fields
grep "Decrypted fields" logs/asset-import-*.log

# 4. Test credentials manually
# For VMware:
curl -k -u "username:password" https://vcenter.company.com/rest/com/vmware/cis/session
```

### Best Practices

1. **Nonce Selection**:
   - Use consistent, memorable nonces (e.g., RecId, integration name)
   - Format: `{environment}-{source}-{identifier}`
   - Example: `prod-vmware-datacenter1`

2. **API Key Management**:
   - Use environment variables for API keys
   - Rotate keys every 90 days
   - Never commit keys to source control

3. **Backup and Recovery**:
   - Keep backups of encrypted configurations
   - Document nonces used per integration
   - Test decryption process regularly

4. **Access Control**:
   - Limit access to Ivanti configuration records
   - Audit configuration changes
   - Use Ivanti permissions for EncryptedConfig field

### Documentation

- **[ENCRYPTION_GUIDE.md](ENCRYPTION_GUIDE.md)** - Complete encryption guide
- **[examples/CONFIG_ENCRYPTION_EXAMPLES.md](examples/CONFIG_ENCRYPTION_EXAMPLES.md)** - Configuration examples
- **Example templates** in `examples/` directory

### Support

For encryption-related issues:

1. Review [ENCRYPTION_GUIDE.md](ENCRYPTION_GUIDE.md)
2. Check service logs for decryption errors
3. Test with `--mode test`
4. Verify API key and nonce
5. Try decrypting manually to verify encrypted data

---

## Command Reference for Encryption

```bash
# Test encryption system
node config-encryptor.js --mode test

# Encrypt configuration file
node config-encryptor.js -m encrypt -i config.json -k "api-key" -n "nonce"

# Decrypt configuration
node config-encryptor.js -m decrypt -e "encrypted-data" -k "api-key" -n "nonce"

# Upload to Ivanti
node config-encryptor.js -m upload -i config.json -k "api-key" -n "nonce" -u "url" -r "record-id"

# Get help
node config-encryptor.js --help
```

---

This encrypted configuration feature provides enterprise-grade security for your integration credentials while maintaining ease of use and backward compatibility.
