# Ivanti Asset Import Service

A flexible, extensible Node.js service for importing asset data from multiple sources into Ivanti ITSM with dynamic field mapping, CI type support, and comprehensive logging.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Ivanti ITSM Setup](#ivanti-itsm-setup)
- [Adding New Sources](#adding-new-sources)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## 🎯 Overview

The Ivanti Asset Import Service is a generic, enterprise-grade integration platform designed to import asset data from various sources into Ivanti ITSM. It provides:

- **Multi-source support**: VMware vCenter, IP Fabric, Snipe-IT, and easily extensible for new sources
- **Dynamic field mapping**: Configure mappings in Ivanti ITSM without code changes
- **CI Type hierarchy**: Support for multiple CI types with unique field mappings
- **Automatic paging**: Efficient handling of large datasets
- **Dual logging**: File-based logging and Ivanti integration logs
- **Flexible deployment**: Run as Ivanti-triggered service or independent scheduled process
- **IIS compatible**: Designed for Windows IIS deployment with health check monitoring

## ✨ Features

### Core Capabilities

1. **Multiple Integration Sources**
   - VMware vCenter (Virtual Machines)
   - IP Fabric (Network Devices)
   - Snipe-IT (Asset Management)
   - Extensible adapter framework for new sources

2. **Dynamic Field Mapping**
   - Field mappings defined in Ivanti configuration objects
   - Support for direct field mapping, templates, and fixed values
   - Section-based XML structure (Identity, ComputerSystem, etc.)

3. **CI Type Layer**
   - Multiple CI types per integration source
   - Unique field mappings for each CI type
   - All enabled CI types imported in single request

4. **Intelligent Paging**
   - Configurable page size per source
   - Automatic pagination for all sources
   - Support for both offset and cursor-based paging

5. **Comprehensive Logging**
   - Winston-based file logging with daily rotation
   - Integration with Ivanti ITSM logging system
   - Configurable log levels (debug, info, warning, error)

6. **Flexible Execution Modes**
   - **API-triggered**: Ivanti calls service via POST (default)
   - **Independent**: Service runs on schedule (firewall-friendly)
   - **Single asset import**: Import specific asset by ID

7. **Security**
   - API key authentication
   - Support for API keys in request body or headers
   - Optional API key storage in configuration

8. **Health Monitoring**
   - Automatic health check pinger for IIS environments
   - Keeps service alive with periodic health checks
   - Configurable ping intervals

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Ivanti ITSM                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Integration  │  │  CI Types    │  │   Mappings   │     │
│  │    Config    │─▶│              │─▶│              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         ▲                                                   │
│         │ POST /api/import                                 │
│         │                                                   │
└─────────┼───────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│          Ivanti Asset Import Service (Node.js)              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Import Controller                        │  │
│  └─────────────────┬────────────────────────────────────┘  │
│                    │                                        │
│  ┌─────────────────▼────────────────────────────────────┐  │
│  │         Asset Import Service (Core)                   │  │
│  │  • Orchestration  • CI Type Processing                │  │
│  │  • Statistics     • XML Generation                    │  │
│  └─────────┬────────────────────────┬───────────────────┘  │
│            │                        │                       │
│  ┌─────────▼────────┐    ┌─────────▼────────┐             │
│  │  Ivanti Service  │    │ Source Adapters  │             │
│  │  • API Client    │    │  • VMware        │             │
│  │  • XML Builder   │    │  • IP Fabric     │             │
│  │  • Queue Post    │    │  • Snipe-IT      │             │
│  └──────────────────┘    │  • Custom        │             │
│                          └──────────────────┘             │
└─────────────────────────────────────────────────────────────┘
          │                        │
          │                        │
          ▼                        ▼
┌─────────────────┐     ┌─────────────────────┐
│ Ivanti Queue    │     │  Source Systems     │
│ (Integration    │     │  • vCenter          │
│  Processor)     │     │  • IP Fabric        │
└─────────────────┘     │  • Snipe-IT         │
                        └─────────────────────┘
```

## 🚀 Installation

### Prerequisites

- Node.js 14.x or higher
- npm or yarn
- Windows Server with IIS (for production deployment)
- IIS HttpPlatformHandler module (for IIS deployment)
- Ivanti ITSM instance with API access

### Step 1: Clone or Extract

```bash
# If using git
git clone <repository-url>
cd ivanti-asset-import-service

# Or extract the provided archive
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your settings
```

### Step 4: Test Locally

```bash
# Development mode with auto-restart
npm run dev

# Or standard start
npm start
```

Visit `http://localhost:3000` to see the service description page.

## ⚙️ Configuration

### Environment Variables (.env)

```bash
# Server
PORT=3000
NODE_ENV=production
BASE_URL=http://localhost:3000

# Logging
LOG_LEVEL=info
LOG_PATH=./logs

# Optional: Default Ivanti API Key
# IVANTI_API_KEY=your_key_here

# Health Check
ENABLE_HEALTH_CHECK_PINGER=true
```

### IIS Configuration (web.config)

For IIS deployment, configure in `web.config`:

```xml
<appSettings>
    <add key="LOG_LEVEL" value="info" />
    <add key="LOG_PATH" value="D:\Ivanti\logs\asset-import" />
    <add key="PORT" value="3000" />
    <add key="NODE_ENV" value="production" />
</appSettings>
```

### Ivanti ITSM Configuration

The service retrieves most configuration from Ivanti ITSM business objects:

1. **Integration Configuration** (`xsc_assetintegrationconfigs`)
   - Integration name and description
   - Source type (vmware, ipfabric, snipeit)
   - Endpoint URL
   - Credentials (JSON format)
   - Page size
   - Active status

2. **CI Types** (`xsc_assetintegration_citypes`)
   - CI Type value (e.g., "Computer", "NetworkDevice")
   - CI Type name/description
   - Parent link to integration config
   - Active status

3. **Field Mappings** (`xsc_assetintegration_mappings`)
   - Source field path
   - Target Ivanti field
   - Mapping type (Field, Template, Fixed)
   - Section (Identity, ComputerSystem, etc.)
   - Parent link to CI Type

## 📖 Usage

### API-Triggered Import (Default Mode)

Ivanti calls the service via POST request:

```bash
POST http://your-service-url/api/import
Content-Type: application/json

{
  "ivantiUrl": "https://your-tenant.ivanticloud.com/HEAT/",
  "ivantiApiKey": "your_api_key_here",
  "integrationSourceType": "vmware"
}
```

**Alternative**: Pass API key in header:

```bash
POST http://your-service-url/api/import
Content-Type: application/json
X-Ivanti-API-Key: your_api_key_here

{
  "ivantiUrl": "https://your-tenant.ivanticloud.com/HEAT/",
  "integrationSourceType": "vmware"
}
```

### Single Asset Import

```bash
POST http://your-service-url/api/import
Content-Type: application/json

{
  "ivantiUrl": "https://your-tenant.ivanticloud.com/HEAT/",
  "ivantiApiKey": "your_api_key_here",
  "integrationSourceType": "snipeit",
  "singleAssetId": "12345"
}
```

### Synchronous Import (for debugging)

```bash
POST http://your-service-url/api/import/sync
Content-Type: application/json

{
  "ivantiUrl": "https://your-tenant.ivanticloud.com/HEAT/",
  "ivantiApiKey": "your_api_key_here",
  "integrationSourceType": "ipfabric"
}
```

Response:
```json
{
  "success": true,
  "message": "Asset import completed",
  "stats": {
    "totalReceived": 150,
    "totalProcessed": 148,
    "totalFailed": 2,
    "duration": "2m 15s"
  }
}
```

### Get Supported Sources

```bash
GET http://your-service-url/api/sources
```

Response:
```json
{
  "success": true,
  "supportedSources": [
    "vmware",
    "vcenter",
    "ipfabric",
    "ip-fabric",
    "snipeit",
    "snipe-it"
  ],
  "count": 6
}
```

## 📡 API Reference

### POST /api/import

**Description**: Start asset import process (async, returns immediately)

**Request Body**:
```json
{
  "ivantiUrl": "string (required)",
  "ivantiApiKey": "string (required, or in X-Ivanti-API-Key header)",
  "integrationSourceType": "string (required)",
  "singleAssetId": "string (optional)"
}
```

**Response** (202 Accepted):
```json
{
  "success": true,
  "message": "Asset import started",
  "timestamp": "2025-11-04T10:30:00.000Z",
  "integrationSourceType": "vmware",
  "singleAsset": false
}
```

### POST /api/import/sync

**Description**: Start asset import and wait for completion

**Request Body**: Same as `/api/import`

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Asset import completed",
  "stats": {
    "totalReceived": 100,
    "totalProcessed": 98,
    "totalFailed": 2,
    "duration": "1m 30s"
  }
}
```

### GET /api/sources

**Description**: Get list of supported integration sources

**Response** (200 OK):
```json
{
  "success": true,
  "supportedSources": ["vmware", "ipfabric", "snipeit"],
  "count": 3
}
```

### GET /health

**Description**: Health check endpoint

**Response** (200 OK):
```json
{
  "status": "OK",
  "service": "Ivanti Asset Import Service",
  "timestamp": "2025-11-04T10:30:00.000Z",
  "uptime": 3600
}
```

## 🔧 Ivanti ITSM Setup

### 1. Create Business Objects

Create the following custom business objects in Ivanti ITSM:

#### xsc_assetintegrationconfigs
| Field Name | Type | Description |
|------------|------|-------------|
| IntegrationName | Text | Display name for integration |
| IntegrationSourceType | Text | Source type (vmware, ipfabric, etc.) |
| EndpointUrl | Text | Base URL for source API |
| Credentials | Text | JSON with credentials |
| PageSize | Number | Records per page |
| IsActive | Boolean | Enable/disable integration |

#### xsc_assetintegration_citypes
| Field Name | Type | Description |
|------------|------|-------------|
| CIType | Text | CI Type value for Ivanti |
| CITypeName | Text | Display name |
| ParentLink_RecID | Link | Link to integration config |
| IsActive | Boolean | Enable/disable CI type |

#### xsc_assetintegration_mappings
| Field Name | Type | Description |
|------------|------|-------------|
| SourceField | Text | Source field path or template |
| IvantiField | Text | Target Ivanti field name |
| MappingType | Text | Field, Template, or Fixed |
| Section | Text | XML section (Identity, etc.) |
| ParentLink_RecID | Link | Link to CI type |

### 2. Configure Integration

Example configuration for VMware:

**Integration Config**:
```json
IntegrationName: "VMware vCenter Production"
IntegrationSourceType: "vmware"
EndpointUrl: "https://vcenter.company.com"
Credentials: {
  "username": "service@vsphere.local",
  "password": "password123"
}
PageSize: 50
IsActive: true
```

**CI Type**:
```
CIType: "Computer"
CITypeName: "Virtual Machine"
IsActive: true
```

**Field Mappings**:
| SourceField | IvantiField | MappingType | Section |
|-------------|-------------|-------------|---------|
| name | AssetName | Field | Identity |
| id | SourceAssetId | Field | Identity |
| guest.hostName | HostName | Field | ComputerSystem |
| {name} ({id}) | Description | Template | Identity |
| Virtual Machine | AssetType | Fixed | Identity |

### 3. Create Web Service Connection

In Ivanti ITSM, create a Web Service Connection:

- **URL**: `http://your-service-url/api/import`
- **Method**: POST
- **Headers**: `Content-Type: application/json`
- **Body Template**:
```json
{
  "ivantiUrl": "$(IvantiURL)",
  "ivantiApiKey": "$(ApiKey)",
  "integrationSourceType": "vmware"
}
```

### 4. Create Workflow or Schedule

Set up a workflow or scheduled task in Ivanti to call the web service connection periodically.

## 🔌 Adding New Sources

The service is designed to be easily extensible. To add a new integration source:

### Step 1: Create Adapter Class

Create a new file in `src/adapters/YourSourceAdapter.js`:

```javascript
const BaseSourceAdapter = require('./BaseSourceAdapter');
const executeWebRequest = require('../utils/webRequestUtils');
const logger = require('../utils/logger');

class YourSourceAdapter extends BaseSourceAdapter {
  constructor(config) {
    super(config);
    this.name = 'Your Source Name';
  }

  async authenticate() {
    // Implement authentication logic
    const credentials = this.parseCredentials();
    // ... authentication code
    return true; // or false
  }

  async getAssets(pageSize, pageNumber) {
    // Implement asset retrieval with paging
    // Return: { assets: [], hasMore: boolean, totalCount: number }
  }

  async getAssetById(assetId) {
    // Implement single asset retrieval
    // Return: asset object
  }
}

module.exports = YourSourceAdapter;
```

### Step 2: Register in Adapter Factory

Edit `src/adapters/AdapterFactory.js`:

```javascript
const YourSourceAdapter = require('./YourSourceAdapter');

// In getAdapter method:
case 'yoursource':
case 'your-source':
  return new YourSourceAdapter(config);
```

### Step 3: Configure in Ivanti

Add configuration with `IntegrationSourceType: "yoursource"`

That's it! The service will automatically use your new adapter.

## 🚢 Deployment

### IIS Deployment

1. **Install HttpPlatformHandler**:
   - Download from [Microsoft IIS](https://www.iis.net/downloads/microsoft/httpplatformhandler)
   - Install on Windows Server

2. **Copy Files**:
   ```
   Copy project to: D:\Ivanti\asset-import-service\
   ```

3. **Configure IIS**:
   - Create new website or application
   - Point to service directory
   - Ensure `web.config` is present
   - Set application pool to "No Managed Code"

4. **Configure Logging**:
   - Create log directory: `D:\Ivanti\logs\asset-import`
   - Grant write permissions to IIS application pool identity

5. **Test**:
   - Browse to `http://localhost:3000` (or your configured port)
   - Verify service description page loads

### Docker Deployment (Optional)

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["node", "src/app.js"]
```

Build and run:
```bash
docker build -t ivanti-asset-import .
docker run -p 3000:3000 -v /path/to/logs:/app/logs ivanti-asset-import
```

## 🔍 Troubleshooting

### Service Not Starting

**Symptom**: Service doesn't start or crashes immediately

**Solutions**:
- Check Node.js version: `node --version` (should be 14+)
- Verify all dependencies installed: `npm install`
- Check log directory permissions
- Review error logs in IIS logs or console

### Authentication Failures

**Symptom**: "Authentication failed" errors in logs

**Solutions**:
- Verify credentials in Ivanti configuration
- Check source system URLs are accessible
- Test credentials directly with source system
- Ensure credentials JSON is properly formatted

### No Assets Imported

**Symptom**: Import completes but no assets in Ivanti

**Solutions**:
- Check field mappings are configured
- Verify CI Types are active
- Review Ivanti integration queue for errors
- Check source system returns data
- Enable debug logging: `LOG_LEVEL=debug`

### IIS Application Pool Stops

**Symptom**: Service stops after period of inactivity

**Solutions**:
- Ensure health check pinger is enabled
- Set IIS application pool idle timeout to 0 (never)
- Verify BASE_URL is correctly configured
- Check IIS logs for errors

### Large Dataset Performance

**Symptom**: Timeouts or slow performance with large datasets

**Solutions**:
- Reduce page size in integration configuration
- Increase Node.js memory: `node --max-old-space-size=4096`
- Process CI types separately
- Consider scheduled imports during off-peak hours

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Support

For issues, questions, or contributions:
- Check the troubleshooting section
- Review logs in configured LOG_PATH
- Contact your system administrator

---

**Version**: 1.0.0  
**Last Updated**: November 2025
