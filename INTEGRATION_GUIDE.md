# Integration Guide

Complete guide for integrating the Ivanti Asset Import Service with your environment.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Ivanti ITSM Configuration](#ivanti-itsm-configuration)
3. [Source System Setup](#source-system-setup)
4. [Field Mapping Examples](#field-mapping-examples)
5. [Testing](#testing)
6. [Production Deployment](#production-deployment)
7. [Monitoring](#monitoring)

## Prerequisites

### Required Access

- **Ivanti ITSM**: Administrator access to create business objects and configurations
- **Source Systems**: API credentials with read access to asset data
- **Windows Server**: Administrator access for IIS deployment (if using IIS)
- **Network**: Connectivity from service to both Ivanti and source systems

### Technical Requirements

- Node.js 14.x or higher
- Windows Server 2016+ (for IIS deployment)
- IIS 10+ with HttpPlatformHandler module
- 2GB RAM minimum (4GB recommended for large datasets)
- 10GB disk space for logs and temporary files

## Ivanti ITSM Configuration

### Step 1: Create Business Objects

#### 1.1 Integration Configuration Object

Create business object: **xsc_assetintegrationconfigs**

```sql
-- Fields
IntegrationName: Text(200)
IntegrationSourceType: Text(50)
EndpointUrl: Text(500)
Credentials: Text(2000)
PageSize: Number
IsActive: Boolean
RecId: Auto-generated
```

#### 1.2 CI Type Object

Create business object: **xsc_assetintegration_citypes**

```sql
-- Fields
CIType: Text(100)
CITypeName: Text(200)
Description: Text(1000)
ParentLink_RecID: Link to xsc_assetintegrationconfigs
IsActive: Boolean
RecId: Auto-generated
```

#### 1.3 Field Mapping Object

Create business object: **xsc_assetintegration_mappings**

```sql
-- Fields
SourceField: Text(500)
IvantiField: Text(200)
MappingType: Text(20)  -- Values: Field, Template, Fixed
Section: Text(50)      -- Values: Identity, ComputerSystem, Location, etc.
ParentLink_RecID: Link to xsc_assetintegration_citypes
SortOrder: Number
IsActive: Boolean
RecId: Auto-generated
```

### Step 2: Configure VMware Integration Example

#### 2.1 Create Integration Configuration

| Field | Value |
|-------|-------|
| IntegrationName | VMware vCenter Production |
| IntegrationSourceType | vmware |
| EndpointUrl | https://vcenter.company.com |
| Credentials | See below |
| PageSize | 50 |
| IsActive | true |

**Credentials JSON**:
```json
{
  "username": "service@vsphere.local",
  "password": "SecurePassword123!"
}
```

#### 2.2 Create CI Types

**CI Type 1: Virtual Machines**
| Field | Value |
|-------|-------|
| CIType | Computer |
| CITypeName | Virtual Machine |
| Description | VMware virtual machines |
| ParentLink_RecID | [Link to integration config] |
| IsActive | true |

#### 2.3 Create Field Mappings for VM

| SourceField | IvantiField | MappingType | Section |
|-------------|-------------|-------------|---------|
| vm | SourceAssetId | Field | Identity |
| name | AssetName | Field | Identity |
| guest.hostName | HostName | Field | ComputerSystem |
| guest.ipAddress | IPAddress | Field | ComputerSystem |
| config.hardware.numCPU | CPUCount | Field | ComputerSystem |
| config.hardware.memoryMB | MemoryMB | Field | ComputerSystem |
| guest.guestFullName | OperatingSystem | Field | ComputerSystem |
| power_state | PowerState | Field | ComputerSystem |
| {name} - {guest.hostName} | Description | Template | Identity |
| Virtual Machine | AssetType | Fixed | Identity |
| VMware | Source | Fixed | Identity |

### Step 3: Configure IP Fabric Integration Example

#### 3.1 Create Integration Configuration

| Field | Value |
|-------|-------|
| IntegrationName | IP Fabric Network Discovery |
| IntegrationSourceType | ipfabric |
| EndpointUrl | https://ipfabric.company.com |
| Credentials | See below |
| PageSize | 100 |
| IsActive | true |

**Credentials JSON**:
```json
{
  "token": "your-ipfabric-api-token-here"
}
```

#### 3.2 Create CI Types

**CI Type 1: Network Devices**
| Field | Value |
|-------|-------|
| CIType | NetworkDevice |
| CITypeName | Network Device |
| Description | Switches, routers, and other network equipment |
| ParentLink_RecID | [Link to integration config] |
| IsActive | true |

#### 3.3 Create Field Mappings for Network Devices

| SourceField | IvantiField | MappingType | Section |
|-------------|-------------|-------------|---------|
| sn | SerialNumber | Field | Identity |
| sn | SourceAssetId | Field | Identity |
| hostname | AssetName | Field | Identity |
| hostname | HostName | Field | ComputerSystem |
| vendor | Manufacturer | Field | Identity |
| platform | Model | Field | Identity |
| version | FirmwareVersion | Field | ComputerSystem |
| siteName | LocationName | Field | Location |
| loginIp | ManagementIP | Field | ComputerSystem |
| {vendor} {model} | Description | Template | Identity |
| Network Device | AssetType | Fixed | Identity |
| IP Fabric | Source | Fixed | Identity |

### Step 4: Configure Snipe-IT Integration Example

#### 4.1 Create Integration Configuration

| Field | Value |
|-------|-------|
| IntegrationName | Snipe-IT Asset Management |
| IntegrationSourceType | snipeit |
| EndpointUrl | https://assets.company.com |
| Credentials | See below |
| PageSize | 100 |
| IsActive | true |

**Credentials JSON**:
```json
{
  "apiToken": "your-snipeit-api-token-here"
}
```

#### 4.2 Create CI Types

**CI Type 1: Hardware Assets**
| Field | Value |
|-------|-------|
| CIType | Computer |
| CITypeName | Hardware Asset |
| Description | Physical computers and equipment |
| ParentLink_RecID | [Link to integration config] |
| IsActive | true |

#### 4.3 Create Field Mappings for Hardware

| SourceField | IvantiField | MappingType | Section |
|-------------|-------------|-------------|---------|
| id | SourceAssetId | Field | Identity |
| asset_tag | AssetTag | Field | Identity |
| name | AssetName | Field | Identity |
| serial | SerialNumber | Field | Identity |
| model.name | Model | Field | Identity |
| model.manufacturer.name | Manufacturer | Field | Identity |
| assigned_to.name | AssignedUser | Field | Identity |
| location.name | LocationName | Field | Location |
| status_label.name | Status | Field | Identity |
| {asset_tag} - {name} | Description | Template | Identity |
| Hardware | AssetType | Fixed | Identity |

### Step 5: Create Web Service Connection

1. Navigate to Ivanti ITSM Configuration Console
2. Create new Web Service Connection:
   - **Name**: Asset Import Service
   - **URL**: `http://your-server:3000/api/import`
   - **Method**: POST
   - **Content-Type**: application/json

3. **Body Template** (for VMware example):
```json
{
  "ivantiUrl": "https://your-tenant.ivanticloud.com/HEAT/",
  "ivantiApiKey": "$(ConfigItem:IvantiAPIKey)",
  "integrationSourceType": "vmware"
}
```

### Step 6: Create Scheduled Task or Workflow

#### Option A: Scheduled Task (Recommended)

1. Create new Business Rule
2. Trigger: Schedule (e.g., daily at 2 AM)
3. Action: Call Web Service Connection
4. Parameters: None (all in body template)

#### Option B: Manual Workflow

1. Create custom action on appropriate object
2. Action calls Web Service Connection
3. User can trigger manually when needed

## Source System Setup

### VMware vCenter Setup

1. **Create Service Account**:
   ```
   Username: service@vsphere.local
   Role: Read-Only
   Scope: All VMs
   ```

2. **Test API Access**:
   ```bash
   curl -u 'service@vsphere.local:password' \
     https://vcenter.company.com/rest/com/vmware/cis/session \
     -X POST
   ```

3. **Grant Permissions**:
   - Read permission on all VM folders
   - Read permission on datacenter objects

### IP Fabric Setup

1. **Generate API Token**:
   - Log into IP Fabric
   - Settings → API Tokens
   - Create new token with read access

2. **Test API Access**:
   ```bash
   curl -H "X-API-Token: your-token" \
     https://ipfabric.company.com/api/v1/tables/inventory/devices \
     -X POST -d '{"snapshot":"$last"}'
   ```

### Snipe-IT Setup

1. **Generate API Token**:
   - Log into Snipe-IT as admin
   - Account Settings → API Keys
   - Generate new token

2. **Test API Access**:
   ```bash
   curl -H "Authorization: Bearer your-token" \
     https://assets.company.com/api/v1/hardware
   ```

## Field Mapping Examples

### Mapping Types

#### 1. Field Mapping (Direct)
Maps source field directly to Ivanti field.

**Example**:
```
SourceField: "name"
IvantiField: "AssetName"
MappingType: "Field"
```

Result: `sourceData.name` → `AssetName`

#### 2. Template Mapping
Uses template with placeholders.

**Example**:
```
SourceField: "{vendor} {model} ({serial})"
IvantiField: "Description"
MappingType: "Template"
```

Result: `sourceData.vendor sourceData.model (sourceData.serial)` → `Description`

#### 3. Fixed Value
Sets a constant value.

**Example**:
```
SourceField: "Virtual Machine"
IvantiField: "AssetType"
MappingType: "Fixed"
```

Result: `"Virtual Machine"` → `AssetType`

### Common Mapping Patterns

#### Pattern 1: Unique Identifier
```
SourceField: "id"
IvantiField: "SourceAssetId"
Section: "Identity"
```

#### Pattern 2: Concatenated Name
```
SourceField: "{firstName} {lastName}"
IvantiField: "FullName"
MappingType: "Template"
Section: "Identity"
```

#### Pattern 3: Nested Object Access
```
SourceField: "location.building.name"
IvantiField: "BuildingName"
Section: "Location"
```

#### Pattern 4: Boolean Conversion
```
SourceField: "isActive"
IvantiField: "Active"
Section: "Identity"
```
(Service automatically converts true/false to "true"/"false")

## Testing

### 1. Test Service Locally

```bash
# Start service
npm start

# Test health endpoint
curl http://localhost:3000/health

# Test supported sources
curl http://localhost:3000/api/sources
```

### 2. Test Single Asset Import

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

### 3. Test Full Import (Async)

```bash
curl -X POST http://localhost:3000/api/import \
  -H "Content-Type: application/json" \
  -H "X-Ivanti-API-Key: your-api-key" \
  -d '{
    "ivantiUrl": "https://your-tenant.ivanticloud.com/HEAT/",
    "integrationSourceType": "ipfabric"
  }'
```

### 4. Verify in Ivanti

1. Check **frs_data_integration_logs** for import status
2. Check **Frs_ops_integration_queues** for queued items
3. Verify assets appear in appropriate CI type

### 5. Check Logs

```bash
# View service logs
tail -f logs/asset-import-*.log

# Windows (IIS deployment)
Get-Content D:\Ivanti\logs\asset-import\asset-import-*.log -Wait
```

## Production Deployment

### Deployment Checklist

- [ ] Node.js installed on server
- [ ] IIS configured with HttpPlatformHandler
- [ ] Service files copied to deployment directory
- [ ] Log directory created with write permissions
- [ ] web.config configured with correct paths
- [ ] Firewall rules configured
- [ ] Service tested locally
- [ ] Ivanti configuration complete
- [ ] Source system credentials tested
- [ ] Monitoring configured

### Security Recommendations

1. **API Keys**: Never commit API keys to source control
2. **Credentials**: Store in Ivanti configuration, not in files
3. **Network**: Use HTTPS for all API communications
4. **Access**: Restrict service account permissions to minimum required
5. **Logs**: Ensure logs don't contain sensitive data
6. **IIS**: Use application pool with minimal permissions

### Performance Tuning

1. **Page Size**: Start with 50-100, adjust based on performance
2. **Memory**: Increase Node.js memory for large datasets
3. **Concurrency**: Use single process for IIS deployment
4. **Scheduling**: Run imports during off-peak hours
5. **CI Types**: Process separately if experiencing timeouts

## Monitoring

### Key Metrics

- Import duration
- Success/failure rates
- Assets processed per import
- API response times
- Memory usage

### Log Analysis

Look for these patterns:

**Success**:
```
INFO: Asset import completed
INFO: Total Received: 150
INFO: Total Processed: 148
INFO: Total Failed: 2
```

**Authentication Issues**:
```
ERROR: Authentication failed
ERROR: VMware authentication error
```

**Configuration Issues**:
```
ERROR: Integration configuration not found
ERROR: No field mappings found
```

### Alerts

Set up alerts for:

- Import failures (> 5% failure rate)
- Service unavailable (health check fails)
- Long-running imports (> 30 minutes)
- Authentication failures
- Disk space issues (log directory)

### Health Check Integration

The service automatically pings its health endpoint every 5 minutes. You can also:

1. **External Monitoring**: Use monitoring tools to check `/health` endpoint
2. **Ivanti Integration**: Create scheduled check in Ivanti
3. **Windows Services**: Use Windows Service Monitor

Example PowerShell health check:
```powershell
$response = Invoke-WebRequest -Uri "http://localhost:3000/health"
if ($response.StatusCode -ne 200) {
    Write-Error "Service health check failed"
    # Send alert
}
```

---

## Need Help?

- Review service logs in configured LOG_PATH
- Check Ivanti integration logs
- Verify source system connectivity
- Test API credentials directly
- Review this guide's troubleshooting sections

For additional support, contact your system administrator.
