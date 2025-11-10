# Testing Guide - Synthetic Data with Real Ivanti

## Overview

Test the integration service with **synthetic data sources** while connected to your **real Ivanti ITSM system**. This allows you to:

✅ Validate Ivanti configuration without real systems  
✅ Test field mappings with realistic data  
✅ Verify queue integration works correctly  
✅ Performance test with controlled data volumes  
✅ Train users on safe test data  

---

## Quick Start

### 1. Install faker Dependency

```bash
npm install faker@5.5.3 --save-dev
```

### 2. Create Test Integration in Ivanti

In Ivanti ITSM, create a new `xsc_assetintegrationconfigs` record:

```
IntegrationName: Test Integration - Mock VMware
IntegrationSourceType: mock
EndpointUrl: mock://vmware?count=50
Username: test
Password: test
ApiToken: (leave empty)
ClientAuthenticationKey: [your-real-key]
TenantId: [your-real-tenant-id]
LOG_LEVEL: debug
PageSize: 10
IsActive: true
```

**Key Configuration**: The `EndpointUrl` field contains the mock configuration:
- Format: `mock://[type]?count=[number]`
- Type: `vmware`, `ipfabric`, or `snipeit`
- Count: Number of records to generate (1-10000)

### 3. Create CI Type and Mappings

Follow normal setup process to create CI Types and field mappings.

### 4. Run Test

```bash
# Standalone mode
node standalone-runner.js --source mock --dry-run

# Without dry-run (writes to Ivanti queue)
node standalone-runner.js --source mock
```

---

## Mock Adapter Configuration

### Using Existing Ivanti Fields

The Mock Adapter uses **existing** `xsc_assetintegrationconfigs` fields - no custom fields needed!

**Configuration Method**: Encode test parameters in the `EndpointUrl` field.

### EndpointUrl Format

```
mock://[sourceType]?count=[recordCount]
```

**Components**:
- `mock://` - Protocol (required)
- `sourceType` - Data type: `vmware`, `ipfabric`, `snipeit`
- `count` - Number of records: 1-10000

**Examples**:
```
mock://vmware?count=50       - 50 VMware VMs
mock://ipfabric?count=100    - 100 network devices
mock://snipeit?count=25      - 25 assets
```

### Configuration Fields

| Field | Value | Purpose |
|-------|-------|---------|
| `IntegrationSourceType` | `mock` | Activates mock adapter |
| `EndpointUrl` | `mock://vmware?count=50` | Configures mock data |
| `Username` | `test` | Dummy credential |
| `Password` | `test` | Dummy credential |
| `ClientAuthenticationKey` | Real key | **Required** for queue |
| `TenantId` | Real ID | **Required** for queue |
| `PageSize` | `10` | Pagination size |
| `IsActive` | `true` | Enable integration |

### Complete Examples

#### Mock VMware vCenter

```javascript
{
  "IntegrationName": "Test - Mock VMware",
  "IntegrationSourceType": "mock",
  "EndpointUrl": "mock://vmware?count=100",
  "Username": "test",
  "Password": "test",
  "ClientAuthenticationKey": "your-key",
  "TenantId": "your-tenant-id",
  "PageSize": 20,
  "IsActive": true
}
```

#### Mock IP Fabric

```javascript
{
  "IntegrationName": "Test - Mock IP Fabric",
  "IntegrationSourceType": "mock",
  "EndpointUrl": "mock://ipfabric?count=75",
  "Username": "test",
  "Password": "test",
  "ClientAuthenticationKey": "your-key",
  "TenantId": "your-tenant-id",
  "PageSize": 25,
  "IsActive": true
}
```

#### Mock Snipe-IT

```javascript
{
  "IntegrationName": "Test - Mock Snipe-IT",
  "IntegrationSourceType": "mock",
  "EndpointUrl": "mock://snipeit?count=50",
  "Username": "test",
  "Password": "test",
  "ClientAuthenticationKey": "your-key",
  "TenantId": "your-tenant-id",
  "PageSize": 10,
  "IsActive": true
}
```

### Default Values

If `EndpointUrl` is malformed or missing parameters:
- **Default sourceType**: `vmware`
- **Default count**: `10`
- **Default pageSize**: `50`

**Example**:
```
EndpointUrl: mock://vmware    → Generates 10 VMware VMs
EndpointUrl: mock://ipfabric?count=100 → Generates 100 IP Fabric devices
```

---

## Synthetic Data Details

### VMware Data Structure

Generated fields match real vCenter API:

```javascript
{
  id: "vm-uuid",
  name: "Server-VM-1",
  hardware: {
    numCPU: 4,
    memoryMB: 16384,
    numCoresPerSocket: 2
  },
  guest: {
    guestFullName: "Microsoft Windows Server 2019 (64-bit)",
    hostName: "server01.domain.com",
    ipAddress: "192.168.1.10"
  },
  runtime: {
    powerState: "poweredOn",
    bootTime: "2025-11-01T10:00:00Z"
  },
  config: {
    uuid: "uuid-here",
    annotation: "Production web server"
  }
}
```

### IP Fabric Data Structure

```javascript
{
  id: "device-uuid",
  sn: "SN123ABC456",
  hostname: "switch-core-1",
  loginIp: "10.0.1.1",
  vendor: "Cisco",
  platform: "Catalyst 9300",
  model: "C9300-48P",
  version: "17.6",
  siteName: "HQ",
  devType: "switch"
}
```

### Snipe-IT Data Structure

```javascript
{
  id: 1001,
  name: "Dell-LAPTOP-1",
  asset_tag: "AT12345678",
  serial: "SN987654321",
  model: { name: "Dell Latitude 7420" },
  category: { name: "Laptop" },
  manufacturer: { name: "Dell" },
  status_label: { name: "Deployed" },
  assigned_to: {
    username: "jdoe",
    name: "John Doe"
  },
  purchase_date: "2024-01-15"
}
```

---

## Testing Scenarios

### Scenario 1: Configuration Validation

**Goal**: Verify Ivanti configuration is correct

```bash
# Step 1: Create mock integration with 10 records
EndpointUrl: mock://vmware?count=10

# Step 2: Run with dry-run
node standalone-runner.js --source mock --dry-run

# Step 3: Check logs
tail -f /var/log/ivanti-import/asset-import-*.log

# Expected: No errors, 10 assets processed
```

**Validates**:
- ✅ Ivanti API connection
- ✅ Integration config retrieval
- ✅ CI Types configured
- ✅ Field mappings working
- ✅ XML generation correct

### Scenario 2: Field Mapping Testing

**Goal**: Test specific field mappings

```bash
# Create test integration
EndpointUrl: mock://vmware?count=5

# Run and inspect generated XML
node standalone-runner.js --source mock --dry-run

# Check logs for XML output
grep "AssetData" /var/log/ivanti-import/asset-import-*.log
```

**Validates**:
- ✅ Source fields map correctly
- ✅ Templates work
- ✅ Fixed values applied
- ✅ Data transformations correct

### Scenario 3: Queue Integration Test

**Goal**: Verify assets reach Ivanti queue

```bash
# Run without dry-run
node standalone-runner.js --source mock

# Check Ivanti queue
SELECT COUNT(*) FROM Frs_ops_integration_queues 
WHERE HandlerName = 'AssetProcessor' 
  AND Status = 'Queued';
```

**Validates**:
- ✅ Queue payload structure
- ✅ ClientAuthenticationKey sent
- ✅ TenantId sent
- ✅ Payload compression works
- ✅ Queue accepts records

### Scenario 4: Performance Testing

**Goal**: Test with high volume

```bash
# Create large test set
EndpointUrl: mock://vmware?count=1000
PageSize: 50

# Run and measure
time node standalone-runner.js --source mock
```

**Validates**:
- ✅ Pagination works
- ✅ Performance acceptable
- ✅ Memory usage stable
- ✅ No timeouts

### Scenario 5: Error Handling

**Goal**: Test error scenarios

```bash
# Test with invalid TenantId
TenantId: "invalid-tenant"

# Run and observe
node standalone-runner.js --source mock

# Expected: Queue rejects records
```

**Validates**:
- ✅ Error logging works
- ✅ Failures reported correctly
- ✅ Service doesn't crash

---

## Field Mapping Examples

### Example: VMware CI Type

**CI Type**: Computer

**Field Mappings**:

| Source Field | Ivanti Field | Type | Section |
|--------------|--------------|------|---------|
| `name` | `Name` | Field | Identity |
| `config.uuid` | `UniqueId` | Field | Identity |
| `guest.ipAddress` | `IPAddress` | Field | Identity |
| `guest.hostName` | `HostName` | Field | ComputerSystem |
| `hardware.numCPU` | `CPUCount` | Field | ComputerSystem |
| `hardware.memoryMB` | `MemoryMB` | Field | ComputerSystem |
| `guest.guestFullName` | `OperatingSystem` | Field | ComputerSystem |
| `runtime.powerState` | `Status` | Field | Identity |
| `VMware vCenter` | `Source` | Fixed | Identity |

### Example: IP Fabric CI Type

**CI Type**: NetworkDevice

**Field Mappings**:

| Source Field | Ivanti Field | Type | Section |
|--------------|--------------|------|---------|
| `hostname` | `Name` | Field | Identity |
| `sn` | `SerialNumber` | Field | Identity |
| `loginIp` | `IPAddress` | Field | Identity |
| `vendor` | `Manufacturer` | Field | Identity |
| `model` | `Model` | Field | Identity |
| `platform` | `Platform` | Field | ComputerSystem |
| `version` | `OSVersion` | Field | ComputerSystem |
| `devType` | `DeviceType` | Field | Identity |
| `siteName` | `Location` | Field | Location |

---

## Troubleshooting

### Problem: Mock adapter not found

**Error**: "Unsupported source type: mock"

**Solution**:
```bash
# Check AdapterFactory includes MockAdapter
grep -r "MockAdapter" src/adapters/

# Ensure file exists
ls -la src/adapters/MockAdapter.js
```

### Problem: Faker not installed

**Error**: "Cannot find module 'faker'"

**Solution**:
```bash
npm install faker@5.5.3 --save-dev
```

### Problem: No data generated

**Check**:
```bash
# Verify EndpointUrl is correct format
# Should be: mock://vmware?count=50

# Check logs for generation message
grep "Generating.*synthetic" /var/log/ivanti-import/asset-import-*.log

# Verify count parameter is present
```

### Problem: Wrong data structure

**Solution**:
```bash
# Ensure EndpointUrl sourceType matches your CI Type mappings
EndpointUrl: mock://vmware?count=50     # For VMware mappings
EndpointUrl: mock://ipfabric?count=50   # For IP Fabric mappings
EndpointUrl: mock://snipeit?count=50    # For Snipe-IT mappings
```

### Problem: Invalid EndpointUrl format

**Error**: Mock adapter generates default 10 records

**Solution**:
```bash
# Correct format
EndpointUrl: mock://vmware?count=100

# Incorrect formats
EndpointUrl: mock://vmware count=100     ❌ Missing ?
EndpointUrl: http://mock/vmware?count=100 ❌ Wrong protocol
EndpointUrl: mock://vmware?records=100   ❌ Wrong parameter name
```

---

## Advanced Testing

### Custom Data Generation

Modify `test-synthetic-data.js` to add custom fields:

```javascript
// Add custom field
static generateVMwareVMs(count = 10) {
  // ... existing code ...
  
  vms.push({
    // ... existing fields ...
    
    // Add custom field
    customField1: faker.commerce.department(),
    customField2: faker.datatype.number({ min: 1, max: 100 })
  });
}
```

### Programmatic Testing

```javascript
const SyntheticDataGenerator = require('./test-synthetic-data');

// Generate specific test data
const testVMs = SyntheticDataGenerator.generateVMwareVMs(5);
console.log(JSON.stringify(testVMs, null, 2));

// Test with custom count
const testDevices = SyntheticDataGenerator.generateIPFabricDevices(20);
```

### Integration with Test Frameworks

```javascript
// test/integration.test.js
const { expect } = require('chai');
const SyntheticDataGenerator = require('../test-synthetic-data');

describe('Synthetic Data Generation', () => {
  it('should generate VMware VMs', () => {
    const vms = SyntheticDataGenerator.generateVMwareVMs(10);
    expect(vms).to.have.lengthOf(10);
    expect(vms[0]).to.have.property('name');
    expect(vms[0]).to.have.property('hardware');
  });
});
```

---

## Best Practices

### 1. Start Small

```bash
# Begin with 10 records
MockRecordCount: 10

# Validate everything works
# Then scale up
MockRecordCount: 100
```

### 2. Use Dry-Run First

```bash
# Always test with dry-run
node standalone-runner.js --source mock --dry-run

# Verify logs look correct
# Then run for real
node standalone-runner.js --source mock
```

### 3. Clean Queue Between Tests

```sql
-- Clear test records from queue
DELETE FROM Frs_ops_integration_queues
WHERE HandlerName = 'AssetProcessor'
  AND Status = 'Queued'
  AND CreatedDateTime > DATEADD(MINUTE, -30, GETDATE());
```

### 4. Monitor Performance

```bash
# Check processing time
time node standalone-runner.js --source mock

# Monitor memory
ps aux | grep node

# Check Ivanti queue
SELECT COUNT(*), Status 
FROM Frs_ops_integration_queues 
WHERE HandlerName = 'AssetProcessor'
GROUP BY Status;
```

### 5. Document Test Results

```bash
# Save test output
node standalone-runner.js --source mock 2>&1 | tee test-results.log

# Compare runs
diff test-run-1.log test-run-2.log
```

---

## Production Transition

### After Testing is Complete

1. **Disable mock integration**:
   ```
   IntegrationSourceType: mock
   IsActive: false
   ```

2. **Create real integration**:
   ```
   IntegrationSourceType: vmware
   EndpointUrl: https://vcenter.company.com
   Username: real-service-account
   Password: [encrypted]
   IsActive: true
   ```

3. **Reuse field mappings**:
   - Copy CI Types from test integration
   - Copy field mappings
   - No code changes needed

4. **Test real integration**:
   ```bash
   node standalone-runner.js --source vmware --dry-run
   ```

---

## Summary

✅ **Mock adapter** generates synthetic data  
✅ **No external systems** required for testing  
✅ **Real Ivanti connection** validates configuration  
✅ **Realistic data** matches actual source formats  
✅ **Scalable testing** from 10 to 10,000+ records  
✅ **Safe testing** without affecting production systems  

**Ready to test!** 🎉

---

**Version**: 1.0.5  
**Dependencies**: faker@5.5.3  
**Mode**: Synthetic data with real Ivanti
