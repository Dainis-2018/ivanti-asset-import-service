# Troubleshooting Guide

Comprehensive troubleshooting guide for common issues and their solutions.

## Table of Contents

1. [Installation Issues](#installation-issues)
2. [Configuration Issues](#configuration-issues)
3. [Authentication Issues](#authentication-issues)
4. [Import Issues](#import-issues)
5. [Performance Issues](#performance-issues)
6. [IIS Deployment Issues](#iis-deployment-issues)
7. [Network Issues](#network-issues)
8. [Data Issues](#data-issues)
9. [Logging Issues](#logging-issues)
10. [Advanced Troubleshooting](#advanced-troubleshooting)

---

## Installation Issues

### Issue: npm install fails

**Symptoms**:
```
npm ERR! code ENOTFOUND
npm ERR! errno ENOTFOUND
```

**Solutions**:

1. **Check internet connection**:
   ```bash
   ping registry.npmjs.org
   ```

2. **Configure npm proxy** (if behind corporate firewall):
   ```bash
   npm config set proxy http://proxy.company.com:8080
   npm config set https-proxy http://proxy.company.com:8080
   ```

3. **Clear npm cache**:
   ```bash
   npm cache clean --force
   npm install
   ```

4. **Use alternate registry**:
   ```bash
   npm config set registry https://registry.npmjs.org/
   ```

### Issue: Node.js version incompatible

**Symptoms**:
```
Error: The engine "node" is incompatible
```

**Solutions**:

1. **Check Node.js version**:
   ```bash
   node --version  # Should be 14.x or higher
   ```

2. **Upgrade Node.js**:
   - Windows: Download from https://nodejs.org/
   - Linux: Use nvm or package manager
   ```bash
   # Using nvm
   nvm install 18
   nvm use 18
   ```

### Issue: Permission errors during installation

**Symptoms**:
```
EACCES: permission denied
```

**Solutions**:

1. **Windows**: Run command prompt as Administrator

2. **Linux/Mac**: Fix npm permissions:
   ```bash
   sudo chown -R $USER:$(id -gn $USER) ~/.config
   ```

3. **Don't use sudo with npm** (unless necessary)

---

## Configuration Issues

### Issue: Service can't find Ivanti configuration

**Symptoms**:
```
ERROR: Integration configuration not found for source type: vmware
```

**Diagnosis**:
```bash
# Check business objects exist
# In Ivanti, verify:
# 1. xsc_assetintegrationconfigs exists
# 2. Record exists with IntegrationSourceType = 'vmware'
# 3. IsActive = true
```

**Solutions**:

1. **Verify business object names** (case-sensitive):
   - xsc_assetintegrationconfigs (not XSC_AssetIntegrationConfigs)
   - xsc_assetintegration_citypes
   - xsc_assetintegration_mappings

2. **Check IntegrationSourceType** (must be lowercase):
   - ✅ Correct: `vmware`, `ipfabric`, `snipeit`
   - ❌ Wrong: `VMware`, `VMWare`, `VMWARE`

3. **Verify IsActive is true**

4. **Check Ivanti API key permissions**:
   - Must have read access to business objects
   - Test with Postman or curl

### Issue: Field mappings not applied

**Symptoms**:
- Assets imported but fields are empty
- Log shows: "No field mappings found"

**Solutions**:

1. **Check ParentLink_RecID**:
   - Mappings must link to correct CI Type
   - CI Type must link to correct Integration Config

2. **Verify field names**:
   - Ivanti field names are case-sensitive
   - Check: `AssetName` vs `assetname`

3. **Check mapping types**:
   - Field, Template, or Fixed (case-sensitive)

4. **Enable debug logging**:
   ```bash
   LOG_LEVEL=debug
   ```
   Check logs for mapping processing details

### Issue: Invalid JSON in Credentials field

**Symptoms**:
```
ERROR: Failed to parse credentials
```

**Solutions**:

1. **Use valid JSON**:
   ```json
   ✅ Correct: {"username":"user","password":"pass"}
   ❌ Wrong: {'username':'user','password':'pass'}
   ❌ Wrong: {username:user,password:pass}
   ```

2. **Escape quotes in Ivanti**:
   - If entering in Ivanti UI, use: `{\"username\":\"user\"}`

3. **Validate JSON**:
   - Use online JSON validator
   - Test in JSON.parse() before saving

---

## Authentication Issues

### Issue: VMware authentication fails

**Symptoms**:
```
ERROR: VMware authentication failed: 401
ERROR: Horizon Auth Failed
```

**Diagnosis**:
```bash
# Test VMware credentials directly
curl -u 'service@vsphere.local:password' \
  -X POST \
  https://vcenter.company.com/rest/com/vmware/cis/session
```

**Solutions**:

1. **Verify credentials**:
   - Username format: `user@vsphere.local` or `DOMAIN\user`
   - Password: Check for special characters

2. **Check vCenter accessibility**:
   ```bash
   ping vcenter.company.com
   telnet vcenter.company.com 443
   ```

3. **Verify user permissions**:
   - Read-only access to VMs required
   - Check vCenter role assignments

4. **Check SSL certificate**:
   - Self-signed certificates may cause issues
   - Consider using IP instead of hostname

### Issue: IP Fabric authentication fails

**Symptoms**:
```
ERROR: IP Fabric authentication failed: 401
```

**Diagnosis**:
```bash
# Test IP Fabric token
curl -H "X-API-Token: your-token" \
  https://ipfabric.company.com/api/v1/users/me
```

**Solutions**:

1. **Regenerate API token**:
   - Log into IP Fabric
   - Settings → API Tokens
   - Create new token

2. **Check token format**:
   - Should be 32-character string
   - No spaces or special characters

3. **Verify token permissions**:
   - Needs read access to inventory tables

### Issue: Snipe-IT authentication fails

**Symptoms**:
```
ERROR: Snipe-IT authentication failed: 401
```

**Diagnosis**:
```bash
# Test Snipe-IT token
curl -H "Authorization: Bearer your-token" \
  https://assets.company.com/api/v1/users/me
```

**Solutions**:

1. **Regenerate API token**:
   - Log into Snipe-IT as admin
   - Account Settings → API Keys
   - Generate new token

2. **Check Snipe-IT version**:
   - Service requires Snipe-IT v5.0+
   - Update if necessary

3. **Verify API enabled**:
   - Settings → API Settings
   - Ensure API is enabled

---

## Import Issues

### Issue: No assets being imported

**Symptoms**:
- Import completes successfully
- Log shows "Total Received: 0"
- No assets in Ivanti

**Diagnosis**:
```bash
# Check if source returns data
# Enable debug logging
LOG_LEVEL=debug npm start
```

**Solutions**:

1. **Verify source system has data**:
   - Check VMware has VMs
   - Check IP Fabric has devices
   - Check Snipe-IT has assets

2. **Check filters in source adapter**:
   - Some adapters may filter by default
   - Review adapter code if needed

3. **Test with single asset**:
   ```bash
   curl -X POST .../api/import/sync \
     -d '{"singleAssetId": "known-asset-id"}'
   ```

### Issue: Assets received but not processed

**Symptoms**:
- Log shows "Total Received: 100"
- Log shows "Total Processed: 0"
- Check Ivanti integration queue

**Solutions**:

1. **Check Ivanti integration queue**:
   - Navigate to `Frs_ops_integration_queues`
   - Look for records with Status = "Failed"
   - Check error messages

2. **Verify XML format**:
   - Enable debug logging
   - Check XML structure in logs
   - Ensure all required fields present

3. **Check CI Type exists in Ivanti**:
   - Asset must have valid CI Type
   - CI Type must exist in CMDB

### Issue: Some assets fail to import

**Symptoms**:
```
Total Received: 100
Total Processed: 95
Total Failed: 5
```

**Solutions**:

1. **Check logs for specific errors**:
   ```bash
   grep "Failed to process asset" logs/asset-import-*.log
   ```

2. **Common causes**:
   - Missing required fields
   - Invalid data format
   - Duplicate asset IDs

3. **Review failed assets**:
   - Enable debug logging
   - Identify patterns in failures
   - Adjust field mappings if needed

---

## Performance Issues

### Issue: Import takes too long

**Symptoms**:
- Import of 1000 assets takes >30 minutes
- High memory usage
- Service becomes unresponsive

**Solutions**:

1. **Reduce page size**:
   ```json
   {
     "PageSize": 25  // Reduce from 50 or 100
   }
   ```

2. **Increase Node.js memory**:
   ```bash
   node --max-old-space-size=4096 src/app.js
   ```

3. **Process CI types separately**:
   - Create separate schedules for each CI type
   - Spread out import times

4. **Schedule during off-peak hours**:
   - Run imports at night
   - Avoid business hours

### Issue: High memory usage

**Symptoms**:
```
FATAL ERROR: Ineffective mark-compacts near heap limit
```

**Solutions**:

1. **Increase heap size**:
   ```bash
   # In package.json scripts
   "start": "node --max-old-space-size=4096 src/app.js"
   ```

2. **Reduce page size**:
   - Smaller pages = less memory per batch

3. **Monitor with**:
   ```bash
   node --inspect src/app.js
   # Then open chrome://inspect
   ```

### Issue: Timeouts

**Symptoms**:
```
ERROR: Request timeout
ERROR: ETIMEDOUT
```

**Solutions**:

1. **Increase timeout** in webRequestUtils.js:
   ```javascript
   timeout: 120000  // 2 minutes
   ```

2. **Check network connectivity**:
   ```bash
   ping source-system.com
   traceroute source-system.com
   ```

3. **Verify source system performance**:
   - Check if source API is slow
   - Monitor source system load

---

## IIS Deployment Issues

### Issue: Application pool stops

**Symptoms**:
- Service works for a while then stops
- 503 Service Unavailable error

**Solutions**:

1. **Disable idle timeout**:
   - IIS Manager → Application Pools
   - Select pool → Advanced Settings
   - Set Idle Time-out to 0

2. **Verify health check pinger**:
   ```xml
   <add key="ENABLE_HEALTH_CHECK_PINGER" value="true" />
   ```

3. **Check application pool recycle settings**:
   - Disable regular time interval recycle
   - Or set to run during off-hours

### Issue: iisnode errors

**Symptoms**:
```
iisnode was unable to locate node.exe
```

**Solutions**:

1. **Install HttpPlatformHandler**:
   - Download from Microsoft
   - Install on server
   - Restart IIS

2. **Check node.exe path**:
   ```bash
   where node  # Should show path
   ```

3. **Update web.config**:
   ```xml
   <add name="iisnode" path="src/app.js" verb="*" modules="iisnode" />
   ```

### Issue: Logging not working in IIS

**Symptoms**:
- No log files created
- Empty log directory

**Solutions**:

1. **Check directory permissions**:
   - IIS application pool identity needs write access
   - Grant permissions to log directory

2. **Verify LOG_PATH**:
   ```xml
   <add key="LOG_PATH" value="D:\Ivanti\logs\asset-import" />
   ```

3. **Create directory manually**:
   ```powershell
   New-Item -ItemType Directory -Path "D:\Ivanti\logs\asset-import"
   icacls "D:\Ivanti\logs\asset-import" /grant "IIS AppPool\YourPoolName:(OI)(CI)M"
   ```

---

## Network Issues

### Issue: Cannot reach source system

**Symptoms**:
```
ERROR: ENOTFOUND
ERROR: getaddrinfo ENOTFOUND vcenter.company.com
```

**Solutions**:

1. **Check DNS resolution**:
   ```bash
   nslookup vcenter.company.com
   ```

2. **Try IP address** instead of hostname:
   ```json
   {
     "EndpointUrl": "https://192.168.1.100"
   }
   ```

3. **Check firewall rules**:
   - Service needs outbound access to source systems
   - Check both server and network firewalls

4. **Verify VPN** (if source is remote):
   - Ensure VPN is active
   - Check routing tables

### Issue: SSL certificate errors

**Symptoms**:
```
ERROR: unable to verify the first certificate
ERROR: self signed certificate in certificate chain
```

**Solutions**:

1. **For development only** (not recommended for production):
   ```bash
   # Set environment variable
   NODE_TLS_REJECT_UNAUTHORIZED=0
   ```

2. **Install certificate**:
   - Export certificate from source system
   - Install in Windows/Linux certificate store

3. **Use IP address**:
   - May bypass certificate validation

---

## Data Issues

### Issue: Missing data in imported assets

**Symptoms**:
- Assets imported but fields empty
- Only some fields populated

**Solutions**:

1. **Check source data**:
   - Verify source system has the data
   - Test API directly

2. **Review field mappings**:
   - Check SourceField paths correct
   - Verify template syntax

3. **Enable debug logging**:
   ```bash
   LOG_LEVEL=debug
   ```
   Review what data is received from source

### Issue: Incorrect data format

**Symptoms**:
- Dates in wrong format
- Numbers as strings
- Boolean values incorrect

**Solutions**:

1. **Check field mapping types**:
   - Service auto-converts booleans to "true"/"false"
   - Dates converted to ISO format

2. **Use templates for formatting**:
   ```
   SourceField: {field1} - {field2}
   MappingType: Template
   ```

3. **Create custom adapter** if complex transformation needed

---

## Logging Issues

### Issue: Log file not created

**Symptoms**:
- No logs directory
- No log files

**Solutions**:

1. **Check LOG_PATH**:
   ```bash
   # In .env or web.config
   LOG_PATH=./logs
   ```

2. **Create directory**:
   ```bash
   mkdir -p logs
   ```

3. **Check permissions**:
   ```bash
   # Linux/Mac
   chmod 755 logs
   
   # Windows
   # Right-click → Properties → Security → Add write permission
   ```

### Issue: Logs growing too large

**Symptoms**:
- Log files >1GB
- Disk space issues

**Solutions**:

1. **Reduce log level**:
   ```bash
   LOG_LEVEL=info  # Instead of debug
   ```

2. **Adjust rotation settings** in logger.js:
   ```javascript
   maxSize: '20m',  // Max 20MB per file
   maxFiles: '14d'  // Keep 14 days
   ```

3. **Manual cleanup**:
   ```bash
   # Delete logs older than 30 days
   find logs -name "*.log" -mtime +30 -delete
   ```

---

## Advanced Troubleshooting

### Enable verbose debug logging

**Method 1: Environment variable**
```bash
LOG_LEVEL=debug npm start
```

**Method 2: web.config**
```xml
<add key="LOG_LEVEL" value="debug" />
```

### Capture network traffic

**Using curl**:
```bash
curl -v -X POST https://source-system/api/endpoint
```

**Using Postman**:
- Enable console
- Check network requests
- Verify headers and body

### Check Ivanti API responses

**Test configuration retrieval**:
```bash
curl -H "Authorization: rest_api_key=YOUR_KEY" \
  "https://your-tenant.ivanticloud.com/HEAT/api/odata/businessobject/xsc_assetintegrationconfigs"
```

### Monitor with Node.js inspector

```bash
node --inspect src/app.js
```

Then open `chrome://inspect` in Chrome.

### Performance profiling

```bash
node --prof src/app.js
# After run completes:
node --prof-process isolate-*.log > processed.txt
```

---

## Getting Additional Help

### Log Collection

Before requesting support, collect:

1. **Service logs**:
   ```bash
   # Last 100 lines
   tail -n 100 logs/asset-import-*.log
   ```

2. **Configuration** (sanitize passwords):
   - .env file
   - web.config (without passwords)
   - Ivanti configuration records

3. **Error messages**:
   - Full error stack traces
   - HTTP status codes
   - Timestamps

### Debug Checklist

- [ ] Check service logs
- [ ] Check Ivanti integration logs
- [ ] Verify source system connectivity
- [ ] Test API credentials directly
- [ ] Enable debug logging
- [ ] Try single asset import
- [ ] Review configuration
- [ ] Check network/firewall
- [ ] Verify Ivanti business objects
- [ ] Test with synchronous endpoint

### Support Resources

1. **Documentation**:
   - README.md - Complete reference
   - INTEGRATION_GUIDE.md - Setup instructions
   - PROJECT_STRUCTURE.md - Architecture
   - CONFIGURATION_EXAMPLES.md - Examples

2. **Code Review**:
   - Check adapter implementation
   - Review service logs for errors
   - Examine field mapping configuration

3. **Community**:
   - Review similar issues
   - Check source system documentation
   - Consult Ivanti support if needed

---

## Quick Reference: Common Error Messages

| Error | Likely Cause | Quick Fix |
|-------|-------------|-----------|
| `ENOTFOUND` | DNS/Network issue | Check hostname, try IP |
| `ETIMEDOUT` | Network/Firewall | Check connectivity, increase timeout |
| `401 Unauthorized` | Bad credentials | Verify username/password/token |
| `404 Not Found` | Wrong URL | Check endpoint URL |
| `500 Internal Server Error` | Server issue | Check source system logs |
| `Integration configuration not found` | Missing Ivanti config | Create business object records |
| `No field mappings found` | Missing mappings | Add mapping records |
| `Authentication failed` | Bad credentials | Test credentials directly |

---

**Remember**: Always start with the logs. 90% of issues can be diagnosed from log files.
