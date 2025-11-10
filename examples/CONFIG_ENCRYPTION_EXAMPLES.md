# Example Configuration Files for Encryption

This directory contains example configuration JSON files that can be encrypted and stored in Ivanti.

## VMware vCenter Example

**File: vmware-config.json**
```json
{
  "IntegrationSourceType": "vmware",
  "EndpointUrl": "https://vcenter.company.com",
  "Username": "service@vsphere.local",
  "Password": "YOUR_SECURE_PASSWORD",
  "ClientAuthenticationKey": "YOUR_CLIENT_AUTH_KEY",
  "TenantId": "YOUR_TENANT_ID",
  "PageSize": 50,
  "LOG_LEVEL": "info"
}
```

**To encrypt this configuration:**
```bash
node config-encryptor.js \
  --mode encrypt \
  --input examples/vmware-config.json \
  --apikey "your-ivanti-api-key" \
  --nonce "vmware-prod-integration"
```

## IP Fabric Example

**File: ipfabric-config.json**
```json
{
  "IntegrationSourceType": "ipfabric",
  "EndpointUrl": "https://ipfabric.company.com",
  "ApiToken": "YOUR_IPFABRIC_API_TOKEN",
  "ClientAuthenticationKey": "YOUR_CLIENT_AUTH_KEY",
  "TenantId": "YOUR_TENANT_ID",
  "PageSize": 100,
  "LOG_LEVEL": "info"
}
```

**To encrypt this configuration:**
```bash
node config-encryptor.js \
  --mode encrypt \
  --input examples/ipfabric-config.json \
  --apikey "your-ivanti-api-key" \
  --nonce "ipfabric-prod-integration"
```

## Snipe-IT Example

**File: snipeit-config.json**
```json
{
  "IntegrationSourceType": "snipeit",
  "EndpointUrl": "https://assets.company.com",
  "ApiToken": "YOUR_SNIPEIT_API_TOKEN",
  "ClientAuthenticationKey": "YOUR_CLIENT_AUTH_KEY",
  "TenantId": "YOUR_TENANT_ID",
  "PageSize": 100,
  "LOG_LEVEL": "info"
}
```

**To encrypt this configuration:**
```bash
node config-encryptor.js \
  --mode encrypt \
  --input examples/snipeit-config.json \
  --apikey "your-ivanti-api-key" \
  --nonce "snipeit-prod-integration"
```

## Complete Configuration Example (All Fields)

**File: complete-config.json**
```json
{
  "IntegrationSourceType": "vmware",
  "EndpointUrl": "https://vcenter.company.com",
  "Username": "service@vsphere.local",
  "Password": "SecurePassword123!",
  "ApiToken": "optional-api-token-if-needed",
  "ClientAuthenticationKey": "your-client-authentication-key-here",
  "TenantId": "your-tenant-id-here",
  "PageSize": 50,
  "LOG_LEVEL": "debug"
}
```

## Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| IntegrationSourceType | string | Yes | Source type: vmware, ipfabric, snipeit |
| EndpointUrl | string | Yes | Base URL of the source system API |
| Username | string | For VMware | Username for basic authentication |
| Password | string | For VMware | Password for basic authentication |
| ApiToken | string | For IP Fabric, Snipe-IT | API token for bearer authentication |
| ClientAuthenticationKey | string | Yes | Ivanti client authentication key for queue |
| TenantId | string | Yes | Ivanti tenant ID |
| PageSize | number | No | Number of records per page (default: 50) |
| LOG_LEVEL | string | No | Log level: error, warn, info, debug |

## Creating Your Configuration File

### Step 1: Copy Template

```bash
# Copy appropriate template
cp examples/vmware-config.json my-config.json
```

### Step 2: Edit Configuration

```bash
# Edit with your values
nano my-config.json
# or
code my-config.json
```

### Step 3: Validate JSON

```bash
# Validate JSON syntax
node -e "console.log(JSON.parse(require('fs').readFileSync('my-config.json', 'utf8')))"
```

### Step 4: Encrypt

```bash
node config-encryptor.js \
  --mode encrypt \
  --input my-config.json \
  --apikey "your-ivanti-api-key" \
  --nonce "unique-nonce-identifier"
```

### Step 5: Store in Ivanti

Copy the encrypted output and paste into the `EncryptedConfig` field in your Ivanti integration configuration record.

## Security Notes

1. **Never commit sensitive values to source control**
   - Use `.gitignore` to exclude config files with real credentials
   - Replace sensitive values with placeholders before committing

2. **Use environment variables for testing**
   ```bash
   export IVANTI_API_KEY="your-api-key"
   export VMWARE_PASSWORD="your-password"
   
   # Use in configuration
   {
     "Password": "${VMWARE_PASSWORD}"
   }
   ```

3. **Secure storage of encrypted configurations**
   - Keep backup of encrypted configurations
   - Document which nonce was used for each integration
   - Store API keys securely (password manager, vault)

4. **Regular rotation**
   - Rotate passwords/API tokens regularly
   - Re-encrypt configuration after credential changes
   - Update Ivanti records with new encrypted data

## Troubleshooting

### Invalid JSON Format

**Error**: `Unexpected token`

**Solution**: Validate JSON syntax
```bash
jsonlint my-config.json
# or
node -e "JSON.parse(require('fs').readFileSync('my-config.json', 'utf8'))"
```

### Missing Required Fields

**Error**: `Failed to authenticate with source system`

**Solution**: Ensure all required fields are present:
- VMware: EndpointUrl, Username, Password, ClientAuthenticationKey, TenantId
- IP Fabric: EndpointUrl, ApiToken, ClientAuthenticationKey, TenantId
- Snipe-IT: EndpointUrl, ApiToken, ClientAuthenticationKey, TenantId

### Encrypted Data Too Long

**Error**: Field length exceeded in Ivanti

**Solution**: 
- Reduce configuration size (remove optional fields)
- Increase EncryptedConfig field length to 4000 characters

## Quick Reference

**Test encryption:**
```bash
node config-encryptor.js --mode test
```

**Encrypt file:**
```bash
node config-encryptor.js -m encrypt -i config.json -k "api-key" -n "nonce"
```

**Decrypt string:**
```bash
node config-encryptor.js -m decrypt -e "encrypted-string" -k "api-key" -n "nonce"
```

**Upload to Ivanti:**
```bash
node config-encryptor.js -m upload -i config.json -k "api-key" -n "nonce" -u "ivanti-url" -r "record-id"
```

---

For complete documentation, see [ENCRYPTION_GUIDE.md](../ENCRYPTION_GUIDE.md)
