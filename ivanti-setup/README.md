# Ivanti ITSM Business Object Creation Scripts

This directory contains example SQL/metadata scripts for creating the required business objects in Ivanti ITSM.

## Required Business Objects

### 1. xsc_assetintegration_config
Integration configuration storage

**Fields:**
- `IntegrationName` (Text, 200) - Display name for the integration
- `IntegrationSourceType` (Text, 50) - Source type identifier (vmware, ipfabric, snipeit)
- `EndpointUrl` (Text, 255) - Base URL for the source API
- `Username` (Text, 100) - Username for authentication (for VMware, etc.)
- `Password` (Text, 100) - Password for authentication (encrypted/secured field)
- `ApiToken` (Text, 160) - API token for authentication (for IP Fabric, Snipe-IT, etc.)
- `IvantiApiKey` (Text, 160) - Ivanti API token for integration authentication
- `ClientAuthenticationKey` (Text, 160) - **REQUIRED** Client authentication key for Ivanti queue
- `TenantId` (Text, 100) - **REQUIRED** Tenant ID for Ivanti queue
- `LOG_LEVEL` (Text, 20) - Optional log level override (error, warn, info, debug)
- `PageSize` (Number) - Number of records to fetch per page
- `IsActive` (Boolean) - Enable/disable the integration
- `RecId` (Auto) - Unique record identifier

**Note**: Password field should be configured as encrypted/secured in Ivanti ITSM to protect credentials.

### 2. xsc_assetintegration_citype
CI Type definitions for each integration

**Fields:**
- `CIType` (Text, 100) - Ivanti CI Type value (e.g., "Computer", "NetworkDevice")
- `CITypeName` (Text, 200) - Display name for the CI Type
- `Description` (Text, 1000) - Description of what this CI Type represents
- `ParentLink_RecID` (Link to xsc_assetintegrationconfigs) - Parent integration
- `IsActive` (Boolean) - Enable/disable this CI Type
- `RecId` (Auto) - Unique record identifier

### 3. xsc_assetintegration_mappings
Field mapping definitions

**Fields:**
- `SourceField` (Text, 500) - Source field path, template, or fixed value
- `IvantiField` (Text, 200) - Target field name in Ivanti
- `MappingType` (Text, 20) - Type of mapping: "Field", "Template", or "Fixed"
- `Section` (Text, 50) - XML section name (Identity, ComputerSystem, Location, etc.)
- `ParentLink_RecID` (Link to xsc_assetintegration_citypes) - Parent CI Type
- `SortOrder` (Number) - Optional sort order for processing
- `IsActive` (Boolean) - Enable/disable this mapping
- `RecId` (Auto) - Unique record identifier

## Creating Business Objects in Ivanti ITSM

### Method 1: Using Ivanti Configuration Console

1. Open Ivanti Configuration Console
2. Navigate to "Configure Application" → "Business Objects"
3. Click "New" to create a new business object
4. Enter the object name (e.g., `xsc_assetintegration_config`)
5. Add fields as specified above
6. Save and publish the business object
7. Repeat for all three business objects

### Method 2: Using Metadata Import

If you have access to Ivanti's metadata import functionality:

1. Create a metadata patch file with the business object definitions
2. Import through Ivanti's package management
3. Publish the changes

### Method 3: Database Script (Advanced)

**WARNING**: Direct database modifications should only be performed by experienced Ivanti administrators and with proper backups.

For advanced users, you can create the objects directly in the Ivanti database. However, this approach requires:
- Deep knowledge of Ivanti's database schema
- Proper change management procedures
- Database backup before any modifications
- Testing in a non-production environment first

## Setting Up Relationships

After creating the business objects, ensure the relationships are properly configured:

1. **xsc_assetintegration_citypes** → **xsc_assetintegrationconfigs**
   - Create a relationship field: `ParentLink_RecID`
   - Type: Link/Relationship
   - Target: xsc_assetintegrationconfigs
   - Cardinality: Many-to-One

2. **xsc_assetintegration_mappings** → **xsc_assetintegration_citypes**
   - Create a relationship field: `ParentLink_RecID`
   - Type: Link/Relationship
   - Target: xsc_assetintegration_citypes
   - Cardinality: Many-to-One

## Example Configuration Data

### Integration Configuration (xsc_assetintegrationconfigs)

**VMware Example:**
```
IntegrationName: VMware vCenter Production
IntegrationSourceType: vmware
EndpointUrl: https://vcenter.company.com
Username: service@vsphere.local
Password: [Encrypted in Ivanti]
ClientAuthenticationKey: your-client-auth-key-here
TenantId: your-tenant-id-here
LOG_LEVEL: info
PageSize: 50
IsActive: true
```

**IP Fabric Example:**
```
IntegrationName: IP Fabric Network Discovery
IntegrationSourceType: ipfabric
EndpointUrl: https://ipfabric.company.com
ApiToken: [Encrypted in Ivanti]
ClientAuthenticationKey: your-client-auth-key-here
TenantId: your-tenant-id-here
LOG_LEVEL: info
PageSize: 100
IsActive: true
```

**Snipe-IT Example:**
```
IntegrationName: Snipe-IT Asset Management
IntegrationSourceType: snipeit
EndpointUrl: https://assets.company.com
ApiToken: [Encrypted in Ivanti]
ClientAuthenticationKey: your-client-auth-key-here
TenantId: your-tenant-id-here
LOG_LEVEL: info
PageSize: 100
IsActive: true
```

### CI Type Configuration (xsc_assetintegration_citypes)

**For VMware:**
```
CIType: Computer
CITypeName: Virtual Machine
Description: VMware virtual machines from vCenter
ParentLink_RecID: [Link to VMware integration config]
IsActive: true
```

**For IP Fabric:**
```
CIType: NetworkDevice
CITypeName: Network Device
Description: Network equipment discovered by IP Fabric
ParentLink_RecID: [Link to IP Fabric integration config]
IsActive: true
```

### Field Mapping Examples (xsc_assetintegration_mappings)

See INTEGRATION_GUIDE.md for detailed field mapping examples for each source type.

## Validation

After creating the business objects, validate:

1. ✓ All three business objects exist
2. ✓ All required fields are present
3. ✓ Relationships are properly configured
4. ✓ You can create test records
5. ✓ The service can retrieve the configuration

## Testing Configuration

Use the service's API to test configuration retrieval:

```bash
# Test that the service can read your configuration
curl -X POST http://your-service/api/import/sync \
  -H "Content-Type: application/json" \
  -d '{
    "ivantiUrl": "https://your-tenant.ivanticloud.com/HEAT/",
    "ivantiApiKey": "your-api-key",
    "integrationSourceType": "vmware"
  }'
```

Check the logs for any configuration retrieval errors.

## Troubleshooting

**Issue**: Service can't find integration configuration

**Solution**: 
- Verify business objects exist with correct names
- Check IntegrationSourceType matches exactly (case-sensitive)
- Ensure IsActive is set to true
- Verify Ivanti API key has read permissions

**Issue**: Field mappings not being applied

**Solution**:
- Check ParentLink_RecID relationships are correct
- Verify mapping records exist for the CI Type
- Ensure field names match exactly
- Check logs for mapping processing errors

## Need Help?

For assistance with:
- Ivanti Configuration Console: Consult Ivanti ITSM documentation
- Business object creation: Contact your Ivanti administrator
- Integration issues: Check service logs and README.md

---

**Note**: These business objects store configuration only. The actual asset data is posted to Ivanti's standard integration queue (`Frs_ops_integration_queues`) for processing by Ivanti's built-in asset processor.
