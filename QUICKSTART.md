# Quick Start Guide

Get the Ivanti Asset Import Service up and running in 15 minutes.

---

## Prerequisites

- **Node.js** 14.x or higher installed
- **npm** 6+
- Access to **Ivanti ITSM** with admin rights
- API credentials for at least one source system (VMware, IP Fabric, Snipe-IT, or use Mock for testing)

---

## Installation (5 minutes)

### Windows

```bash
# Run installation script
install.bat

# Or manually:
npm install
npm run build
copy .env.example .env
```

### Linux/Mac

```bash
# Make script executable and run
chmod +x install.sh
./install.sh

# Or manually:
npm install
npm run build
cp .env.example .env
```

**Note**: `npm run build` creates the `dist/` directory with production-ready bundles.

---

## Configuration (5 minutes)

### Step 1: Configure Service

Edit `.env` file:

```bash
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
LOG_PATH=./logs

# Optional: For standalone mode only
IVANTI_URL=https://your-tenant.ivanticloud.com/HEAT/
IVANTI_API_KEY=your_api_key_here
```

### Step 2: Configure Ivanti ITSM

Create three business objects in Ivanti Configuration Console:

1. **xsc_assetintegrationconfigs** - Integration configurations
2. **xsc_assetintegration_citypes** - CI Types
3. **xsc_assetintegration_mappings** - Field mappings

See [ivanti-setup/README.md](ivanti-setup/README.md) for detailed field definitions.

### Step 3: Add Integration Configuration

In Ivanti, create a record in `xsc_assetintegrationconfigs`:

**For VMware:**
```json
{
  "IntegrationName": "VMware vCenter",
  "IntegrationSourceType": "vmware",
  "EndpointUrl": "https://vcenter.company.com",
  "Username": "service@vsphere.local",
  "Password": "your-password",
  "ApiToken": "",
  "PageSize": 50,
  "IsActive": true
}
```

**For IP Fabric:**
```json
{
  "IntegrationName": "IP Fabric",
  "IntegrationSourceType": "ipfabric",
  "EndpointUrl": "https://ipfabric.company.com",
  "Username": "",
  "Password": "",
  "ApiToken": "your-api-token",
  "PageSize": 100,
  "IsActive": true
}
```

**For Snipe-IT:**
```json
{
  "IntegrationName": "Snipe-IT",
  "IntegrationSourceType": "snipeit",
  "EndpointUrl": "https://assets.company.com",
  "Username": "",
  "Password": "",
  "ApiToken": "your-api-token",
  "PageSize": 100,
  "IsActive": true
}
```

**For Testing (Mock Data):**
```json
{
  "IntegrationName": "Test - Mock VMware",
  "IntegrationSourceType": "mock",
  "EndpointUrl": "mock://vmware?count=50",
  "Username": "test",
  "Password": "test",
  "ApiToken": "",
  "PageSize": 10,
  "IsActive": true
}
```

**Note**: For more details on Mock adapter, see [TESTING_GUIDE.md](TESTING_GUIDE.md).

### Step 4: Add CI Type

Create a record in `xsc_assetintegration_citypes`:

```json
{
  "CIType": "Computer",
  "CITypeName": "Virtual Machine",
  "ParentLink_RecID": "[Link to your integration config]",
  "IsActive": true
}
```

### Step 5: Add Field Mappings

Create records in `xsc_assetintegration_mappings`:

**Minimum required mappings:**

| SourceField | IvantiField | MappingType | Section |
|-------------|-------------|-------------|---------|
| id | SourceAssetId | Field | Identity |
| name | AssetName | Field | Identity |

See [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) for complete mapping examples.

---

## Running the Service (2 minutes)

### Option 1: API Mode (Default)

Start the service as an API that Ivanti can call:

```bash
# Development
npm run start:dev

# Production (from dist/)
npm start
```

**Service will be available at**: `http://localhost:3000`

**Ivanti calls the service** via web service connection:
```
POST http://your-server:3000/api/import
{
  "ivantiUrl": "https://tenant.ivanticloud.com/HEAT/",
  "ivantiApiKey": "your-key",
  "integrationSourceType": "vmware"
}
```

---

### Option 2: Standalone Mode

Run imports independently on a schedule (no API calls from Ivanti):

```bash
# Run immediately
node dist/standalone-runner.js

# Run specific source only
node dist/standalone-runner.js --source vmware

# Test mode (no data sent to Ivanti)
node dist/standalone-runner.js --dry-run

# Get help
node dist/standalone-runner.js --help
```

**Use Cases for Standalone Mode**:
- Scheduled imports via cron or systemd
- Isolated networks (only outbound connections allowed)
- Batch processing during off-hours

**Setup for Scheduling**:
- **Linux**: See [REDHAT_DEPLOYMENT.md](REDHAT_DEPLOYMENT.md) for systemd/cron setup
- **Windows**: Use Task Scheduler

---

## Testing (3 minutes)

### Test Health Endpoint

```bash
curl http://localhost:3000/health
```

**Expected Response**:
```json
{
  "status": "ok",
  "timestamp": "2025-11-13T10:30:00.000Z",
  "uptime": 120
}
```

### Test Import (Single Asset)

```bash
curl -X POST http://localhost:3000/api/import \
  -H "Content-Type: application/json" \
  -d '{
    "ivantiUrl": "https://your-tenant.ivanticloud.com/HEAT/",
    "ivantiApiKey": "your-api-key",
    "integrationSourceType": "vmware",
    "singleAssetId": "vm-123"
  }'
```

**Expected Response**:
```json
{
  "message": "Import process started",
  "integrationSourceType": "vmware",
  "timestamp": "2025-11-13T10:35:00.000Z"
}
```

### Check Logs

```bash
# View latest log
tail -f logs/asset-import-*.log

# Check for errors
grep "ERROR" logs/asset-import-*.log
```

### Test with Mock Data (Recommended for First Test)

```bash
# In standalone mode
node dist/standalone-runner.js --source mock --dry-run
```

This tests the service without connecting to real systems or Ivanti.

---

## Troubleshooting

### Service Won't Start

**Check Node.js version:**
```bash
node --version  # Should be 14+
```

**Install dependencies:**
```bash
npm install
```

**Build the project:**
```bash
npm run build
```

### No Assets Imported

**Common Issues:**

1. **Check integration is active in Ivanti**
   - Verify `IsActive = true` in `xsc_assetintegrationconfigs`

2. **Check field mappings exist**
   - Verify records in `xsc_assetintegration_mappings`

3. **Check CI Type is active**
   - Verify `IsActive = true` in `xsc_assetintegration_citypes`

4. **Enable debug logging**
   - Set `LOG_LEVEL=debug` in `.env`
   - Restart service
   - Check logs for detailed error messages

5. **Verify source system returns data**
   - Test credentials manually
   - Check endpoint URLs are correct

### Can't Find Configuration

**Verify business objects exist:**
1. Open Ivanti Configuration Console
2. Navigate to Business Objects
3. Check for:
   - `xsc_assetintegrationconfigs`
   - `xsc_assetintegration_citypes`
   - `xsc_assetintegration_mappings`

**Verify IntegrationSourceType matches exactly:**
- Must be lowercase
- Check for typos
- Case-sensitive matching

---

## Next Steps

### 1. Configure Additional Sources

- Add more integration configurations in Ivanti
- Add more CI types
- Expand field mappings

### 2. Set Up Scheduling

**Option A: API-Triggered (Recommended)**
- Create Ivanti workflow to call service
- Schedule regular imports via Ivanti
- Set up monitoring in Ivanti

**Option B: Standalone Mode**
- Set up cron job (Linux) or Task Scheduler (Windows)
- See [REDHAT_DEPLOYMENT.md](REDHAT_DEPLOYMENT.md) for details

### 3. Production Deployment

- Follow IIS deployment guide in [README.md](README.md)
- Configure logging directory
- Set up health monitoring
- Review security settings
- See [REDHAT_DEPLOYMENT.md](REDHAT_DEPLOYMENT.md) for Linux

### 4. Customize

- Add new source adapters (see [README.md](README.md) → Adding New Sources)
- Customize field mappings
- Add custom transformations

---

## Operating Modes Summary

| Feature | API Mode | Standalone Mode |
|---------|----------|-----------------|
| **Startup** | `npm start` | `node standalone-runner.js` |
| **Trigger** | Ivanti calls service | Scheduled (cron/systemd) |
| **Network** | Inbound required | Only outbound |
| **Use Case** | Normal environment | Isolated network |
| **Configuration** | Via API parameters | Via .env file |
| **Best For** | Most deployments | Firewall restrictions |

Both modes use the same Ivanti configuration and support all features.

---

## Quick Reference

### Start Service
```bash
# API mode (development)
npm run start:dev

# API mode (production)
npm start

# Standalone mode
node dist/standalone-runner.js
```

### Test Service
```bash
# Health check
curl http://localhost:3000/health

# Full test suite
node test-api.js

# Standalone dry-run
node dist/standalone-runner.js --dry-run
```

### Check Logs
```bash
# View logs
tail -f logs/asset-import-*.log

# Search errors
grep "ERROR" logs/asset-import-*.log
```

---

## Need More Help?

### Documentation
- **Complete Guide**: [README.md](README.md)
- **Integration Details**: [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)
- **Architecture**: [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)
- **Ivanti Setup**: [ivanti-setup/README.md](ivanti-setup/README.md)
- **Testing**: [TESTING_GUIDE.md](TESTING_GUIDE.md)
- **Linux Deployment**: [REDHAT_DEPLOYMENT.md](REDHAT_DEPLOYMENT.md)
- **Examples**: [examples/CONFIGURATION_EXAMPLES.md](examples/CONFIGURATION_EXAMPLES.md)
- **Troubleshooting**: [examples/TROUBLESHOOTING.md](examples/TROUBLESHOOTING.md)

### Support
- Check service logs in `logs/` directory
- Check Ivanti integration logs
- Review troubleshooting guide
- Contact your system administrator

---

## 🎉 Congratulations!

You now have a working asset import service!

**Next steps**:
1. ✅ Start with small imports (single asset or mock data)
2. ✅ Gradually expand to more sources
3. ✅ Add more CI types as needed
4. ✅ Schedule regular imports
5. ✅ Monitor and optimize

**Success!** Your service is ready to import assets into Ivanti ITSM. 🚀
