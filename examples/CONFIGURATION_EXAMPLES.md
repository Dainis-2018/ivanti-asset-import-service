# Example Configurations

This directory contains complete example configurations for common scenarios.

## Example 1: VMware vCenter Integration

### Ivanti Configuration (xsc_assetintegrationconfigs)

```json
{
  "IntegrationName": "VMware vCenter Production",
  "IntegrationSourceType": "vmware",
  "EndpointUrl": "https://vcenter.company.com",
  "Credentials": {
    "username": "service@vsphere.local",
    "password": "YourSecurePassword123!"
  },
  "PageSize": 50,
  "IsActive": true
}
```

### CI Type Configuration (xsc_assetintegration_citypes)

**Virtual Machines**:
```json
{
  "CIType": "Computer",
  "CITypeName": "Virtual Machine",
  "Description": "VMware virtual machines from vCenter",
  "ParentLink_RecID": "[Link to VMware integration config]",
  "IsActive": true
}
```

### Field Mappings (xsc_assetintegration_mappings)

| SourceField | IvantiField | MappingType | Section | Description |
|-------------|-------------|-------------|---------|-------------|
| vm | SourceAssetId | Field | Identity | Unique VM identifier |
| name | AssetName | Field | Identity | VM name |
| guest.hostName | HostName | Field | ComputerSystem | Guest OS hostname |
| guest.ipAddress | IPAddress | Field | ComputerSystem | Primary IP address |
| config.hardware.numCPU | CPUCount | Field | ComputerSystem | Number of CPUs |
| config.hardware.memoryMB | MemoryMB | Field | ComputerSystem | Memory in MB |
| guest.guestFullName | OperatingSystem | Field | ComputerSystem | OS name |
| power_state | PowerState | Field | ComputerSystem | Current power state |
| config.uuid | UUID | Field | Identity | VM UUID |
| {name} ({guest.hostName}) | Description | Template | Identity | Combined description |
| Virtual Machine | AssetType | Fixed | Identity | Asset type marker |
| VMware vCenter | Source | Fixed | Identity | Source system name |

### API Call Example

```bash
curl -X POST http://your-service:3000/api/import \
  -H "Content-Type: application/json" \
  -H "X-Ivanti-API-Key: your-ivanti-api-key" \
  -d '{
    "ivantiUrl": "https://your-tenant.ivanticloud.com/HEAT/",
    "integrationSourceType": "vmware"
  }'
```

---

## Example 2: IP Fabric Network Discovery

### Ivanti Configuration

```json
{
  "IntegrationName": "IP Fabric Network Infrastructure",
  "IntegrationSourceType": "ipfabric",
  "EndpointUrl": "https://ipfabric.company.com",
  "Credentials": {
    "token": "your-ipfabric-api-token-here-32-chars"
  },
  "PageSize": 100,
  "IsActive": true
}
```

### CI Type Configuration

**Network Devices**:
```json
{
  "CIType": "NetworkDevice",
  "CITypeName": "Network Equipment",
  "Description": "Switches, routers, and firewalls discovered by IP Fabric",
  "ParentLink_RecID": "[Link to IP Fabric integration config]",
  "IsActive": true
}
```

### Field Mappings

| SourceField | IvantiField | MappingType | Section | Description |
|-------------|-------------|-------------|---------|-------------|
| sn | SerialNumber | Field | Identity | Device serial number |
| sn | SourceAssetId | Field | Identity | Unique identifier |
| hostname | AssetName | Field | Identity | Device hostname |
| hostname | HostName | Field | ComputerSystem | Network hostname |
| vendor | Manufacturer | Field | Identity | Equipment vendor |
| platform | Model | Field | Identity | Hardware model |
| model | ModelNumber | Field | Identity | Specific model number |
| version | FirmwareVersion | Field | ComputerSystem | Current firmware |
| siteName | LocationName | Field | Location | Site location |
| loginIp | ManagementIP | Field | ComputerSystem | Management interface IP |
| loginType | ManagementProtocol | Field | ComputerSystem | SSH/Telnet/etc |
| {vendor} {platform} | Description | Template | Identity | Device description |
| Network Device | AssetType | Fixed | Identity | Asset type |
| IP Fabric | Source | Fixed | Identity | Discovery source |

---

## Example 3: Snipe-IT Asset Management

### Ivanti Configuration

```json
{
  "IntegrationName": "Snipe-IT Asset Inventory",
  "IntegrationSourceType": "snipeit",
  "EndpointUrl": "https://assets.company.com",
  "Credentials": {
    "apiToken": "your-snipeit-bearer-token-here"
  },
  "PageSize": 100,
  "IsActive": true
}
```

### CI Type Configuration

**Hardware Assets**:
```json
{
  "CIType": "Computer",
  "CITypeName": "Physical Asset",
  "Description": "Physical computers and equipment from Snipe-IT",
  "ParentLink_RecID": "[Link to Snipe-IT integration config]",
  "IsActive": true
}
```

**Mobile Devices**:
```json
{
  "CIType": "MobileDevice",
  "CITypeName": "Mobile Equipment",
  "Description": "Phones, tablets, and mobile devices",
  "ParentLink_RecID": "[Link to Snipe-IT integration config]",
  "IsActive": true
}
```

### Field Mappings (Hardware Assets)

| SourceField | IvantiField | MappingType | Section | Description |
|-------------|-------------|-------------|---------|-------------|
| id | SourceAssetId | Field | Identity | Snipe-IT asset ID |
| asset_tag | AssetTag | Field | Identity | Physical asset tag |
| name | AssetName | Field | Identity | Asset name |
| serial | SerialNumber | Field | Identity | Serial number |
| model.name | Model | Field | Identity | Model name |
| model.model_number | ModelNumber | Field | Identity | Model number |
| model.manufacturer.name | Manufacturer | Field | Identity | Manufacturer |
| assigned_to.name | AssignedUser | Field | Identity | Current user |
| assigned_to.employee_num | EmployeeNumber | Field | Identity | Employee ID |
| location.name | LocationName | Field | Location | Physical location |
| status_label.name | Status | Field | Identity | Asset status |
| purchase_date | PurchaseDate | Field | Financial | Purchase date |
| purchase_cost | PurchaseCost | Field | Financial | Original cost |
| warranty_months | WarrantyMonths | Field | Financial | Warranty period |
| notes | Notes | Field | Identity | Additional notes |
| {asset_tag} - {name} | Description | Template | Identity | Full description |
| Hardware | AssetType | Fixed | Identity | Asset type |
| Snipe-IT | Source | Fixed | Identity | Source system |

---

## Example 4: Multi-Source, Multi-CI Type Configuration

### Scenario
Company has:
- VMware for virtual machines (Computer CI Type)
- IP Fabric for network devices (NetworkDevice CI Type)
- Snipe-IT for physical assets (Computer CI Type) and mobile devices (MobileDevice CI Type)

### Configuration Overview

```
Integration 1: VMware
├── CI Type: Computer (Virtual Machines)
│   └── 15 field mappings

Integration 2: IP Fabric
├── CI Type: NetworkDevice (Network Equipment)
│   └── 13 field mappings

Integration 3: Snipe-IT
├── CI Type: Computer (Physical Assets)
│   └── 16 field mappings
└── CI Type: MobileDevice (Mobile Devices)
    └── 12 field mappings
```

### Workflow Schedule

```bash
# Daily at 2:00 AM - VMware sync
POST /api/import
{
  "integrationSourceType": "vmware"
}

# Daily at 3:00 AM - IP Fabric sync
POST /api/import
{
  "integrationSourceType": "ipfabric"
}

# Daily at 4:00 AM - Snipe-IT sync (both CI types)
POST /api/import
{
  "integrationSourceType": "snipeit"
}
```

---

## Example 5: Single Asset Import

### Use Case
User updated a specific VM and wants to sync it immediately.

### API Call

```bash
curl -X POST http://your-service:3000/api/import \
  -H "Content-Type: application/json" \
  -d '{
    "ivantiUrl": "https://your-tenant.ivanticloud.com/HEAT/",
    "ivantiApiKey": "your-api-key",
    "integrationSourceType": "vmware",
    "singleAssetId": "vm-12345"
  }'
```

---

## Example 6: Development/Testing Configuration

### .env File for Development

```bash
# Server Configuration
PORT=3000
NODE_ENV=development
BASE_URL=http://localhost:3000

# Logging Configuration
LOG_LEVEL=debug
LOG_PATH=./logs

# Development Settings
ENABLE_HEALTH_CHECK_PINGER=false
```

### Testing with Mock Data

```bash
# Test with synchronous endpoint to see immediate results
curl -X POST http://localhost:3000/api/import/sync \
  -H "Content-Type: application/json" \
  -d '{
    "ivantiUrl": "https://demo.ivanticloud.com/HEAT/",
    "ivantiApiKey": "test-key",
    "integrationSourceType": "vmware",
    "singleAssetId": "vm-test-001"
  }'
```

---

## Example 7: Production IIS Configuration

### web.config Settings

```xml
<appSettings>
  <!-- Production Logging -->
  <add key="LOG_LEVEL" value="info" />
  <add key="LOG_PATH" value="D:\Ivanti\logs\asset-import" />
  
  <!-- Application Settings -->
  <add key="PORT" value="3000" />
  <add key="NODE_ENV" value="production" />
  
  <!-- Health Check -->
  <add key="BASE_URL" value="http://localhost:3000" />
  <add key="ENABLE_HEALTH_CHECK_PINGER" value="true" />
  
  <!-- Optional: Ivanti API Key for independent mode -->
  <!-- <add key="IVANTI_API_KEY" value="your-production-key" /> -->
</appSettings>
```

### IIS Application Pool Settings

```
Name: IvantiAssetImportPool
.NET CLR Version: No Managed Code
Identity: NetworkService (or custom service account)
Idle Timeout: 0 (Never timeout)
```

---

## Example 8: Field Mapping Patterns

### Pattern 1: Nested Object Access

**Source Data**:
```json
{
  "guest": {
    "hostName": "server01",
    "network": {
      "ipAddress": "192.168.1.10"
    }
  }
}
```

**Mapping**:
```
SourceField: guest.network.ipAddress
IvantiField: IPAddress
MappingType: Field
```

### Pattern 2: Template with Multiple Fields

**Source Data**:
```json
{
  "vendor": "Cisco",
  "model": "Catalyst 9300",
  "serial": "ABC123456"
}
```

**Mapping**:
```
SourceField: {vendor} {model} (S/N: {serial})
IvantiField: Description
MappingType: Template
Result: "Cisco Catalyst 9300 (S/N: ABC123456)"
```

### Pattern 3: Boolean Conversion

**Source Data**:
```json
{
  "isActive": true
}
```

**Mapping**:
```
SourceField: isActive
IvantiField: Active
MappingType: Field
Result: "true" (string)
```

### Pattern 4: Fixed Values for Classification

**Mapping**:
```
SourceField: Production
IvantiField: Environment
MappingType: Fixed
Result: "Production" (constant for all records)
```

---

## Example 9: Error Handling Configuration

### Scenario: Large Dataset Import

**Problem**: Timeouts with 5000+ assets

**Solution**: Adjust page size

```json
{
  "IntegrationName": "VMware Large Environment",
  "IntegrationSourceType": "vmware",
  "EndpointUrl": "https://vcenter.company.com",
  "Credentials": {...},
  "PageSize": 25,  // Reduced from 50
  "IsActive": true
}
```

### Scenario: Handling Missing Data

**Problem**: Some VMs don't have guest tools installed (missing hostname, IP, etc.)

**Solution**: Use conditional mappings and fixed values

```
SourceField: guest.hostName
IvantiField: HostName
MappingType: Field
Note: Service handles null/undefined gracefully - field will be omitted from XML
```

---

## Example 10: Scheduling in Ivanti

### Business Rule Configuration

```
Name: Daily Asset Import - VMware
Trigger: Schedule
Schedule: Daily at 2:00 AM
Condition: None
Action: Execute Web Service Connection
  - Connection: Asset Import Service
  - Body: {
      "ivantiUrl": "$(IvantiURL)",
      "ivantiApiKey": "$(ConfigItem:IvantiAPIKey)",
      "integrationSourceType": "vmware"
    }
```

### Multiple Scheduled Imports

```
2:00 AM - VMware VMs
3:00 AM - IP Fabric Network Devices  
4:00 AM - Snipe-IT Physical Assets
5:00 AM - Snipe-IT Mobile Devices
```

---

## Tips for Configuration

1. **Start Small**: Configure one source with minimal mappings first
2. **Test Single Asset**: Always test with `singleAssetId` before full import
3. **Use Debug Logging**: Set `LOG_LEVEL=debug` during configuration
4. **Verify Credentials**: Test source system access independently
5. **Check Field Names**: Ivanti field names are case-sensitive
6. **Review Logs**: Always check logs after configuration changes
7. **Backup Configuration**: Export Ivanti business objects before major changes

---

## Common Configuration Mistakes

### ❌ Mistake 1: Wrong IntegrationSourceType
```json
{
  "IntegrationSourceType": "VMware"  // Wrong: capital letters
}
```
✅ **Correct**:
```json
{
  "IntegrationSourceType": "vmware"  // Correct: lowercase
}
```

### ❌ Mistake 2: Invalid JSON in Credentials
```json
{
  "Credentials": "{'username': 'user'}"  // Wrong: single quotes
}
```
✅ **Correct**:
```json
{
  "Credentials": "{\"username\": \"user\"}"  // Correct: escaped double quotes
}
```

### ❌ Mistake 3: Missing Required Mappings
No `SourceAssetId` mapping → Assets can't be uniquely identified

✅ **Correct**: Always map unique identifier to `SourceAssetId`

### ❌ Mistake 4: Incorrect Template Syntax
```
SourceField: ${vendor} ${model}  // Wrong syntax
```
✅ **Correct**:
```
SourceField: {vendor} {model}  // Correct: curly braces only
```

---

For more examples and troubleshooting, see:
- INTEGRATION_GUIDE.md
- README.md
- PROJECT_STRUCTURE.md
