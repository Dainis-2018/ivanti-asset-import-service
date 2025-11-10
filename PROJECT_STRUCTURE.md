# Project Structure

Detailed overview of the Ivanti Asset Import Service project structure.

## Directory Tree

```
ivanti-asset-import-service/
│
├── src/                          # Source code directory
│   ├── app.js                   # Main application entry point
│   │
│   ├── adapters/                # Source system adapters
│   │   ├── BaseSourceAdapter.js       # Base adapter class
│   │   ├── VMwareAdapter.js           # VMware vCenter adapter
│   │   ├── IPFabricAdapter.js         # IP Fabric adapter
│   │   ├── SnipeITAdapter.js          # Snipe-IT adapter
│   │   └── AdapterFactory.js          # Adapter factory pattern
│   │
│   ├── controllers/             # Request controllers
│   │   └── importController.js        # Import endpoint controller
│   │
│   ├── services/                # Business logic services
│   │   ├── ivantiService.js           # Ivanti API integration
│   │   └── assetImportService.js      # Main import orchestration
│   │
│   ├── routes/                  # Express route definitions
│   │   └── index.js                   # API route configuration
│   │
│   ├── utils/                   # Utility modules
│   │   ├── logger.js                  # Logging utility
│   │   ├── webRequestUtils.js         # HTTP request wrapper
│   │   ├── xmlUtils.js                # XML compression/encoding
│   │   └── healthCheckPinger.js       # Health check automation
│   │
│   └── views/                   # Static HTML views
│       └── index.html                 # Service description page
│
├── logs/                        # Application logs (created at runtime)
│   └── asset-import-YYYY-MM-DD.log
│
├── node_modules/                # npm dependencies (after npm install)
│
├── package.json                 # Node.js project configuration
├── package-lock.json            # Locked dependency versions
│
├── web.config                   # IIS configuration
├── .env                         # Environment variables (create from .env.example)
├── .env.example                 # Example environment configuration
├── .gitignore                   # Git ignore rules
│
├── README.md                    # Main documentation
├── INTEGRATION_GUIDE.md         # Integration instructions
└── PROJECT_STRUCTURE.md         # This file
```

## Core Components

### Application Layer

#### `src/app.js`
**Purpose**: Main application entry point  
**Responsibilities**:
- Initialize Express server
- Configure middleware
- Register routes
- Start health check pinger
- Handle errors

**Key Features**:
- Body parser for JSON (50MB limit)
- CORS handling
- Static file serving
- Error handling middleware

### Adapter Layer

#### `src/adapters/BaseSourceAdapter.js`
**Purpose**: Abstract base class for all source adapters  
**Methods**:
- `authenticate()` - Authenticate with source system
- `getAssets(pageSize, pageNumber)` - Get paged assets
- `getAssetById(assetId)` - Get single asset
- `parseCredentials()` - Parse credential JSON
- `validateConfig()` - Validate configuration

**Pattern**: Template Method Pattern

#### `src/adapters/VMwareAdapter.js`
**Purpose**: VMware vCenter integration  
**Authentication**: Basic Auth with session token  
**API**: vCenter REST API  
**Features**:
- Session-based authentication
- VM inventory retrieval
- Detailed VM information
- Power state monitoring

#### `src/adapters/IPFabricAdapter.js`
**Purpose**: IP Fabric network discovery integration  
**Authentication**: API token or username/password  
**API**: IP Fabric REST API v1  
**Features**:
- Device inventory
- Network topology data
- Snapshot-based queries
- Advanced filtering

#### `src/adapters/SnipeITAdapter.js`
**Purpose**: Snipe-IT asset management integration  
**Authentication**: Bearer token  
**API**: Snipe-IT REST API v1  
**Features**:
- Hardware asset retrieval
- Asset tag search
- Assignment information
- Location data

#### `src/adapters/AdapterFactory.js`
**Purpose**: Factory pattern for adapter creation  
**Pattern**: Factory Pattern  
**Methods**:
- `getAdapter(sourceType, config)` - Create adapter instance
- `getSupportedTypes()` - List supported types
- `isSupported(sourceType)` - Check if type supported

### Controller Layer

#### `src/controllers/importController.js`
**Purpose**: Handle HTTP requests for import operations  
**Endpoints**:
- `importAssets()` - Async import (POST /api/import)
- `importAssetsSync()` - Sync import (POST /api/import/sync)
- `getSupportedSources()` - List sources (GET /api/sources)
- `healthCheck()` - Health check (GET /api/health)

**Features**:
- Request validation
- API key extraction (body or header)
- Async execution
- Error handling

### Service Layer

#### `src/services/ivantiService.js`
**Purpose**: Ivanti ITSM API integration  
**Responsibilities**:
- Get integration configuration
- Get CI types
- Get field mappings
- Build asset XML
- Post to integration queue
- Manage integration logs

**Key Methods**:
```javascript
getIntegrationConfiguration(sourceType)
getCITypes(configRecId)
getFieldMappings(ciTypeRecId)
buildAssetXml(sourceRecord, mappings, ciType)
postToIntegrationQueue(xmlPayload)
createIntegrationLog(name, sourceType)
updateIntegrationLog(logRecId, updates)
```

#### `src/services/assetImportService.js`
**Purpose**: Main import orchestration  
**Responsibilities**:
- Initialize import process
- Process CI types
- Process assets
- Track statistics
- Manage logs

**Import Flow**:
```
1. Initialize (get config, authenticate)
2. Get CI Types
3. For each CI Type:
   a. Get field mappings
   b. Get assets (paged)
   c. Process each asset
   d. Build XML
   e. Post to Ivanti queue
4. Finalize (update logs, return stats)
```

**Statistics Tracked**:
- Total received
- Total processed
- Total failed
- Duration

### Utility Layer

#### `src/utils/logger.js`
**Purpose**: Centralized logging with Winston  
**Features**:
- Console logging (colored)
- File logging (daily rotation)
- Log level filtering
- Message buffering for Ivanti logs

**Log Levels**:
- `debug` - Detailed debugging information
- `info` - General information
- `warning` - Warning messages
- `error` - Error messages

**Methods**:
```javascript
logInfo(message)
logDebug(message)
logWarning(message)
logError(message, stack)
getBufferedMessages()
clearBuffer()
```

#### `src/utils/webRequestUtils.js`
**Purpose**: HTTP request wrapper with error handling  
**Features**:
- Axios-based requests
- Automatic error handling
- Timeout support
- Status validation
- Response normalization

**Signature**:
```javascript
executeWebRequest(method, url, data, headers, timeout)
```

#### `src/utils/xmlUtils.js`
**Purpose**: XML processing utilities  
**Functions**:
- `compressAndEncode(xmlString)` - Gzip + Base64
- `decodeAndDecompress(encodedString)` - Reverse
- `escapeXml(unsafe)` - Escape XML special chars
- `escapeXmlAttr(unsafe)` - Escape XML attributes

**XML Format**:
```xml
<?xml version="1.0" encoding="utf-8"?>
<AssetDataSequence SchemaVersion="0.2">
  <AssetData>
    <Audit>...</Audit>
    <Identity>
      <Property Name="AssetName">Value</Property>
    </Identity>
    <ComputerSystem>
      <Property Name="HostName">Value</Property>
    </ComputerSystem>
  </AssetData>
</AssetDataSequence>
```

#### `src/utils/healthCheckPinger.js`
**Purpose**: Automatic health check for IIS  
**Behavior**:
- Starts automatically on service start
- Pings `/health` every 5 minutes
- Prevents IIS application pool idle timeout
- Singleton pattern

### Route Layer

#### `src/routes/index.js`
**Purpose**: Express route configuration  
**Routes**:
```javascript
POST   /api/import       - Async import
POST   /api/import/sync  - Sync import
GET    /api/sources      - Supported sources
GET    /api/health       - Health check
```

### View Layer

#### `src/views/index.html`
**Purpose**: Service description and documentation page  
**Features**:
- Service overview
- API documentation
- Configuration instructions
- Live status indicator
- Responsive design

## Configuration Files

### `package.json`
**Purpose**: Node.js project metadata  
**Contains**:
- Dependencies
- Scripts
- Project information
- ESLint configuration

**Key Scripts**:
```json
{
  "start": "node src/app.js",
  "dev": "nodemon src/app.js",
  "lint": "eslint ./src",
  "lint:fix": "eslint ./src --fix"
}
```

### `web.config`
**Purpose**: IIS configuration  
**Sections**:
- Handler configuration (iisnode)
- Rewrite rules
- Security settings
- iisnode settings
- Application settings

**Key Settings**:
```xml
<iisnode 
  node_env="production"
  loggingEnabled="true"
  logDirectory="iisnode"
/>

<appSettings>
  <add key="LOG_LEVEL" value="info" />
  <add key="LOG_PATH" value="D:\Ivanti\logs" />
</appSettings>
```

### `.env` (Development)
**Purpose**: Environment variables for development  
**Variables**:
```
PORT=3000
NODE_ENV=development
LOG_LEVEL=debug
LOG_PATH=./logs
```

## Data Flow

### Import Request Flow

```
1. Client → POST /api/import
   ↓
2. importController.importAssets()
   - Validate parameters
   - Return 202 Accepted immediately
   ↓
3. executeImport() (async)
   - Initialize AssetImportService
   ↓
4. AssetImportService.initialize()
   - Create IvantiService
   - Get integration config from Ivanti
   - Create source adapter
   - Authenticate with source
   ↓
5. AssetImportService.importAssets()
   - Get CI Types from Ivanti
   - For each CI Type:
     ↓
6.   AssetImportService.processCIType()
     - Get field mappings
     - Loop with paging:
       ↓
7.     SourceAdapter.getAssets(pageSize, page)
       - Fetch from source system
       ↓
8.     For each asset:
         ↓
9.       IvantiService.buildAssetXml()
         - Apply field mappings
         - Build XML structure
         ↓
10.      xmlUtils.compressAndEncode()
         - Gzip compression
         - Base64 encoding
         ↓
11.      IvantiService.postToIntegrationQueue()
         - POST to Frs_ops_integration_queues
         ↓
12. Update statistics and logs
    ↓
13. Ivanti Integration Queue Processor
    - Process queued items
    - Create/update CIs
```

## Extension Points

### Adding New Source Adapter

1. Create `src/adapters/NewSourceAdapter.js`
2. Extend `BaseSourceAdapter`
3. Implement required methods
4. Register in `AdapterFactory.js`
5. Document in README.md

### Adding New Field Mapping Type

1. Update `IvantiService.buildAssetXml()`
2. Add new mapping type logic
3. Update Ivanti configuration documentation
4. Add examples to INTEGRATION_GUIDE.md

### Adding New API Endpoints

1. Create method in controller
2. Add route in `src/routes/index.js`
3. Update `src/views/index.html`
4. Update README.md

## Dependencies

### Production Dependencies

```json
{
  "axios": "HTTP client",
  "body-parser": "Request body parsing",
  "express": "Web framework",
  "winston": "Logging framework",
  "winston-daily-rotate-file": "Log rotation",
  "zlib": "Compression (Node.js built-in)",
  "dotenv": "Environment variables"
}
```

### Development Dependencies

```json
{
  "eslint": "Code linting",
  "eslint-config-airbnb-base": "Airbnb style guide",
  "eslint-plugin-import": "Import linting",
  "nodemon": "Auto-restart during development",
  "jest": "Testing framework (optional)"
}
```

## Design Patterns Used

1. **Factory Pattern**: AdapterFactory for creating adapters
2. **Template Method**: BaseSourceAdapter defines algorithm
3. **Singleton**: HealthCheckPinger instance
4. **Strategy Pattern**: Different adapters for different sources
5. **Builder Pattern**: XML building in IvantiService
6. **Adapter Pattern**: Source adapters wrap external APIs

## Best Practices

### Code Organization

- **Separation of Concerns**: Each layer has distinct responsibilities
- **DRY Principle**: Common logic in base classes and utilities
- **Single Responsibility**: Each class has one primary purpose
- **Open/Closed**: Open for extension (new adapters), closed for modification

### Error Handling

- Try-catch blocks in all async operations
- Errors logged with stack traces
- Graceful degradation (continue on single asset failure)
- Meaningful error messages

### Performance

- Paging for large datasets
- Async operations don't block responses
- Connection pooling in HTTP client
- Log rotation to manage disk space

### Security

- No hardcoded credentials
- API keys not logged
- HTTPS for production
- Input validation
- Secure credential storage

---

**Last Updated**: November 2025  
**Version**: 1.0.0
