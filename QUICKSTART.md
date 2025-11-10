# Quick Start Guide

Get the Ivanti Asset Import Service up and running in 15 minutes.

## Prerequisites

- Node.js 14.x or higher installed
- Access to Ivanti ITSM with admin rights
- API credentials for at least one source system (VMware, IP Fabric, or Snipe-IT)

## Installation (5 minutes)

### Windows

```bash
# Run installation script
install.bat

# Or manually:
npm install
copy .env.example .env
```

### Linux/Mac

```bash
# Make script executable and run
chmod +x install.sh
./install.sh

# Or manually:
npm install
cp .env.example .env
```

## Configuration (5 minutes)

### Step 1: Configure Service

Edit `.env` file:

```bash
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
LOG_PATH=./logs
```

### Step 2: Configure Ivanti ITSM

Create three business objects in Ivanti Configuration Console:

1. **xsc_assetintegration_config** - Integration configurations
2. **xsc_assetintegration_citype** - CI Types
3. **xsc_assetintegration_mapping** - Field mappings

See `ivanti-setup/README.md` for detailed field definitions.

### Step 3: Add Integration Configuration

In Ivanti, create a record in `xsc_assetintegration_config`:

**For VMware:**
```
IntegrationName: VMware vCenter
IntegrationSourceType: vmware
EndpointUrl: https://vcenter.company.com
Credentials: {"username":"user@vsphere.local","password":"pass"}
PageSize: 50
IsActive: true
```

**For IP Fabric:**
```
IntegrationName: IP Fabric
IntegrationSourceType: ipfabric
EndpointUrl: https://ipfabric.company.com
Credentials: {"token":"your-api-token"}
PageSize: 100
IsActive: true
```

**For Snipe-IT:**
```
IntegrationName: Snipe-IT
IntegrationSourceType: snipeit
EndpointUrl: https://assets.company.com
Credentials: {"apiToken":"your-api-token"}
PageSize: 100
IsActive: true
```

### Step 4: Add CI Type

Create a record in `xsc_assetintegration_citype`:

```
CIType: Computer
CITypeName: Virtual Machine
ParentLink_RecID: [Link to your integration config]
IsActive: true
```

### Step 5: Add Field Mappings

Create records in `xsc_assetintegration_mapping`:

**Minimum required mappings:**

| SourceField | IvantiField | MappingType | Section |
|-------------|-------------|-------------|---------|
| id | SourceAssetId | Field | Identity |
| name | AssetName | Field | Identity |

See `INTEGRATION_GUIDE.md` for complete mapping examples.

## Testing (3 minutes)

### Step 1: Start Service

```bash
npm start
```

You should see:
```
[INFO] Ivanti Asset Import Service Started
[INFO] Port: 3000
[INFO] Log Level: info
```

### Step 2: Test Health Check

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "OK",
  "service": "Ivanti Asset Import Service",
  "timestamp": "2025-11-04T10:30:00.000Z",
  "uptime": 10
}
```

### Step 3: Test Supported Sources

```bash
curl http://localhost:3000/api/sources
```

Expected response:
```json
{
  "success": true,
  "supportedSources": ["vmware", "vcenter", "ipfabric", "snipeit"],
  "count": 4
}
```

### Step 4: Run API Tests

```bash
node test-api.js
```

## First Import (2 minutes)

### Test with Single Asset

```bash
curl -X POST http://localhost:3000/api/import/sync \
  -H "Content-Type: application/json" \
  -d '{
    "ivantiUrl": "https://your-tenant.ivanticloud.com/HEAT/",
    "ivantiApiKey": "your-api-key",
    "integrationSourceType": "vmware",
    "singleAssetId": "vm-123"
  }'
```

### Full Import

```bash
curl -X POST http://localhost:3000/api/import \
  -H "Content-Type: application/json" \
  -H "X-Ivanti-API-Key: your-api-key" \
  -d '{
    "ivantiUrl": "https://your-tenant.ivanticloud.com/HEAT/",
    "integrationSourceType": "vmware"
  }'
```

## Verify Results

1. **Check Service Logs**:
   ```bash
   # Windows
   type logs\asset-import-*.log

   # Linux/Mac
   cat logs/asset-import-*.log
   ```

2. **Check Ivanti Integration Log**:
   - Open Ivanti ITSM
   - Navigate to `frs_data_integration_log`
   - Find latest record
   - Check status and statistics

3. **Check Integration Queue**:
   - Navigate to `Frs_ops_integration_queue`
   - Verify records are being processed
   - Check for any errors

4. **Check Assets**:
   - Navigate to Configuration Items
   - Filter by CI Type
   - Verify imported assets appear

## Common Issues

### Service Won't Start

**Check Node.js version:**
```bash
node --version  # Should be 14.x or higher
```

**Check dependencies:**
```bash
npm install
```

### Authentication Fails

**Test source credentials directly:**

**VMware:**
```bash
curl -u 'user@vsphere.local:password' \
  https://vcenter.company.com/rest/com/vmware/cis/session \
  -X POST
```

**IP Fabric:**
```bash
curl -H "X-API-Token: your-token" \
  https://ipfabric.company.com/api/v1/tables/inventory/devices \
  -X POST -d '{"snapshot":"$last"}'
```

**Snipe-IT:**
```bash
curl -H "Authorization: Bearer your-token" \
  https://assets.company.com/api/v1/hardware
```

### No Assets Imported

1. Check field mappings exist in Ivanti
2. Verify CI Type is active
3. Enable debug logging: `LOG_LEVEL=debug` in `.env`
4. Check logs for detailed error messages
5. Verify source system returns data

### Can't Find Configuration

**Verify business objects exist:**
1. Open Ivanti Configuration Console
2. Navigate to Business Objects
3. Check for:
   - `xsc_assetintegrationconfig`
   - `xsc_assetintegration_citype`
   - `xsc_assetintegration_mapping`

**Verify IntegrationSourceType matches exactly:**
- Must be lowercase
- Check for typos
- Case-sensitive

## Next Steps

1. **Configure Additional Sources**:
   - Add more integration configurations
   - Add more CI types
   - Expand field mappings

2. **Set Up Scheduling**:
   - Create Ivanti workflow to call service
   - Schedule regular imports
   - Set up monitoring

3. **Production Deployment**:
   - Follow IIS deployment guide in README.md
   - Configure logging directory
   - Set up health monitoring
   - Review security settings

4. **Customize**:
   - Add new source adapters
   - Customize field mappings
   - Add custom transformations

## Need More Help?

- **Full Documentation**: See README.md
- **Integration Details**: See INTEGRATION_GUIDE.md
- **Architecture**: See PROJECT_STRUCTURE.md
- **Ivanti Setup**: See ivanti-setup/README.md

## Support

For issues or questions:
- Check service logs in `logs/` directory
- Check Ivanti integration logs
- Review troubleshooting section in README.md
- Contact your system administrator

---

**Congratulations!** You now have a working asset import service. 🎉

Start with small imports and gradually expand to more sources and CI types.
