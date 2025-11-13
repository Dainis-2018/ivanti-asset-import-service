# Ivanti Asset Import Service

**Version**: 1.1.0  
**Status**: ✅ Production-Ready

A comprehensive, extensible Node.js service for importing assets from multiple sources into Ivanti ITSM. Supports VMware vCenter, IP Fabric, Snipe-IT, and custom sources with dynamic field mapping and CI Type awareness.

---

## 🚀 Quick Start

```bash
# 1. Install
npm install
npm run build

# 2. Configure
cp .env.example .env
# Edit .env with your settings

# 3. Run
npm start                          # API mode (IIS or web server)
# OR
node dist/standalone-runner.js    # Standalone mode (scheduled tasks)
```

**First-time users**: See [QUICKSTART.md](QUICKSTART.md) for a complete 15-minute setup guide.

---

## 📋 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [Deployment](#-deployment)
- [API Reference](#-api-reference)
- [Adding New Sources](#-adding-new-sources)
- [Troubleshooting](#-troubleshooting)
- [Documentation](#-documentation)

---

## ✨ Features

### Core Capabilities
- ✅ **Multi-Source Support**: VMware vCenter, IP Fabric, Snipe-IT, Mock (testing)
- ✅ **CI Type Layer**: Different field mappings per Ivanti CI Type
- ✅ **Dynamic Field Mapping**: Configured in Ivanti, no code changes needed
- ✅ **Template Mapping**: Complex field combinations like `{vendor} {model}`
- ✅ **Intelligent Paging**: Automatic pagination for all sources
- ✅ **Dual Operating Modes**: 
  - API-triggered (Ivanti calls service)
  - Independent (scheduled execution via cron/systemd)

### Enterprise Features
- ✅ **Comprehensive Logging**: File-based + Ivanti integration logs
- ✅ **Health Monitoring**: IIS keep-alive and health check endpoint
- ✅ **Flexible Authentication**: API keys in body, header, or config file
- ✅ **Production-Ready**: IIS deployment with web.config included
- ✅ **Extensible Architecture**: Add new sources in 3 simple steps
- ✅ **Security**: No credentials in code, API key authentication

### Developer Experience
- ✅ **Clean Code**: Layered architecture with design patterns
- ✅ **100+ KB Documentation**: Complete guides and examples
- ✅ **Webpack Build**: Simple `npm run build` deployment
- ✅ **Mock Adapter**: Test with synthetic data
- ✅ **ESLint**: Code quality enforcement

---

## 🏗 Architecture

### Layered Design

```
┌─────────────────────────────────────────┐
│         HTTP Layer (Express)            │
│  • REST API Endpoints                   │
│  • Health Check                         │
│  • Static HTML Interface                │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│         Controller Layer                │
│  • Request Validation                   │
│  • Async Response Handling              │
│  • Error Management                     │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│         Service Layer                   │
│  • AssetImportService (Orchestration)   │
│  • IvantiService (ITSM Integration)     │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│         Adapter Layer (Strategy)        │
│  • BaseSourceAdapter (Abstract)         │
│  • VMwareAdapter                        │
│  • IPFabricAdapter                      │
│  • SnipeITAdapter                       │
│  • MockAdapter (Testing)                │
│  • AdapterFactory (Factory Pattern)     │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│         Utility Layer                   │
│  • Logger (Winston)                     │
│  • XML Compression                      │
│  • HTTP Client                          │
│  • Health Check Pinger                  │
└─────────────────────────────────────────┘
```

### Design Patterns
- **Factory Pattern**: Dynamic adapter creation based on source type
- **Strategy Pattern**: Pluggable source adapters
- **Template Method**: Base adapter with common workflows
- **Singleton**: Health check pinger

### Data Flow

```
1. Ivanti/Scheduler → POST /api/import
2. Controller validates → Returns 202 Accepted immediately
3. Background Process:
   - Initialize AssetImportService
   - Get integration config from Ivanti
   - Create source adapter (Factory)
   - Authenticate with source system
   - For each CI Type:
     * Get field mappings from Ivanti
     * Loop with paging:
       - Fetch assets from source
       - Apply field mappings
       - Build XML
       - Compress & encode
       - POST to Ivanti queue
   - Log statistics
4. Ivanti processes queue → Creates/updates CIs
```

---

## 📦 Installation

### Prerequisites
- **Node.js** 14+ (18+ recommended)
- **npm** 6+
- **Network Access**: Outbound to Ivanti and source systems
- **Permissions**: Write access to log directory

### Quick Install

**Windows:**
```bash
install.bat
```

**Linux/Mac:**
```bash
chmod +x install.sh
./install.sh
```

### Manual Install

```bash
# Clone or download project
cd ivanti-asset-import-service

# Install dependencies
npm install

# Build for production
npm run build

# Configure
cp .env.example .env
# Edit .env with your settings
```

### Build Output

After `npm run build`, the `dist/` directory contains:
```
dist/
├── app.js                    # Bundled API application
├── standalone-runner.js      # Bundled standalone runner
├── views/                    # HTML interface
├── examples/                 # Documentation
├── ivanti-setup/            # Setup guides
├── .env.example             # Config template
├── web.config               # IIS configuration
├── README.md                # This file
├── QUICKSTART.md
├── INTEGRATION_GUIDE.md
└── LICENSE
```

**Note**: Source code (`src/`) is NOT included in dist - only compiled bundles.

---

## ⚙️ Configuration

### Environment Variables

Create `.env` file or configure in `/etc/ivanti-import/config.env` (Linux):

```bash
# === Required for Standalone Mode ===
IVANTI_URL=https://your-tenant.ivanticloud.com/HEAT/
IVANTI_API_KEY=your_api_key_here

# === API Mode Settings ===
PORT=3000
NODE_ENV=production

# === Logging ===
LOG_LEVEL=info                      # debug, info, warn, error
LOG_PATH=./logs                     # or /var/log/ivanti-import

# === Health Check (IIS Only) ===
ENABLE_HEALTH_CHECK_PINGER=true     # Set false for standalone mode
HEALTH_CHECK_INTERVAL=240000        # 4 minutes (IIS app pool recycle is 5min)

# === Standalone Mode ===
STANDALONE_INTEGRATION_DELAY=30     # Seconds between integrations
```

### Configuration Storage

Following requirement #13 (minimal filesystem config), most configuration is stored in **Ivanti ITSM**:

| Configuration | Storage Location |
|--------------|------------------|
| Integration sources | Ivanti `xsc_assetintegrationconfigs` |
| Source credentials | Ivanti (encrypted) |
| Field mappings | Ivanti `xsc_assetintegration_mappings` |
| CI Types | Ivanti `xsc_assetintegration_citypes` |
| Ivanti API Key (optional) | `.env` or Ivanti config |
| Logging settings | `.env` only |

**API Key Options** (Requirement #10):
1. In request body: `{ "ivantiApiKey": "xxx" }`
2. In request header: `X-Ivanti-API-Key: xxx`
3. In config file: `IVANTI_API_KEY=xxx` (standalone mode only)

---

## 🎯 Usage

### Operating Modes

The service supports **two operating modes** (Requirement #11):

#### Mode 1: API-Triggered (Default)
Ivanti calls the service via API. Best for normal environments.

**Start the service:**
```bash
# Development
npm run start:dev

# Production (from dist/)
npm start
```

**Ivanti calls:**
```bash
POST http://your-server:3000/api/import
Content-Type: application/json

{
  "ivantiUrl": "https://tenant.ivanticloud.com/HEAT/",
  "ivantiApiKey": "your-key",
  "integrationSourceType": "vmware"
}
```

#### Mode 2: Independent/Standalone
Service runs on schedule (cron/systemd). Best for isolated networks where only outbound connections are allowed.

**Run manually:**
```bash
# From dist/ (production)
node dist/standalone-runner.js

# From source (development)
node standalone-runner.js

# Options
node standalone-runner.js --source vmware    # Single source only
node standalone-runner.js --dry-run          # Test mode
node standalone-runner.js --help             # Show help
```

**Schedule with cron:**
```bash
# Daily at 2 AM
0 2 * * * cd /opt/ivanti-import/app && node standalone-runner.js --config /etc/ivanti-import/config.env
```

**Schedule with systemd** (Linux):
See [REDHAT_DEPLOYMENT.md](REDHAT_DEPLOYMENT.md) for complete systemd setup.

### Single Asset Import

Import a single asset for testing:

```bash
POST /api/import
{
  "ivantiUrl": "https://tenant.ivanticloud.com/HEAT/",
  "ivantiApiKey": "your-key",
  "integrationSourceType": "vmware",
  "singleAssetId": "vm-123"
}
```

### Testing with Mock Data

Use the Mock adapter for testing without real systems:

```bash
# In Ivanti config:
IntegrationSourceType: mock
EndpointUrl: mock://vmware?count=50

# Run test
node standalone-runner.js --source mock --dry-run
```

See [TESTING_GUIDE.md](TESTING_GUIDE.md) for details.

---

## 🚢 Deployment

### Deployment Options

| Environment | Method | Documentation |
|------------|--------|---------------|
| **Windows IIS** | web.config | See below |
| **RedHat Linux** | systemd/cron | [REDHAT_DEPLOYMENT.md](REDHAT_DEPLOYMENT.md) |
| **Docker** | Dockerfile | See below |
| **Standalone** | Node.js | See below |

### IIS Deployment (Windows)

1. **Build the application:**
   ```bash
   npm install
   npm run build
   ```

2. **Install HttpPlatformHandler:**
   - Download from [Microsoft IIS](https://www.iis.net/downloads/microsoft/httpplatformhandler)
   - Install on Windows Server

3. **Copy to server:**
   ```powershell
   # Copy dist/ folder
   xcopy /E /I dist D:\Ivanti\asset-import-service\
   
   # Create logs directory
   mkdir D:\Ivanti\logs\asset-import
   ```

4. **Configure IIS:**
   - Create new website or application
   - Point to: `D:\Ivanti\asset-import-service\`
   - Application Pool: "No Managed Code"
   - Grant write permissions to logs directory

5. **The included web.config handles:**
   - HttpPlatformHandler configuration
   - URL rewriting
   - Health check endpoint
   - Environment variables

6. **Test:**
   ```powershell
   # Check service
   curl http://localhost/health
   
   # View logs
   Get-Content D:\Ivanti\logs\asset-import\asset-import-*.log -Tail 50
   ```

### Linux Deployment

See [REDHAT_DEPLOYMENT.md](REDHAT_DEPLOYMENT.md) for complete guide including:
- User account setup
- Systemd service configuration
- Timer/cron scheduling
- Log rotation
- Security hardening

**Quick Linux Deploy:**
```bash
# Build on dev machine
npm run build
cd dist && tar -czf ../app.tar.gz . && cd ..

# Copy to server
scp app.tar.gz user@server:/tmp/

# On server
sudo -u ivanti-import mkdir -p /opt/ivanti-import/app
cd /opt/ivanti-import/app
sudo -u ivanti-import tar -xzf /tmp/app.tar.gz
sudo -u ivanti-import npm install --production

# Configure
sudo cp .env.example /etc/ivanti-import/config.env
sudo vi /etc/ivanti-import/config.env

# Run
sudo -u ivanti-import node standalone-runner.js
```

### Docker Deployment

**Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy built application
COPY dist/ .

# Install production dependencies
RUN npm install --production

# Create logs directory
RUN mkdir -p /app/logs && chown -R node:node /app/logs

# Switch to non-root user
USER node

EXPOSE 3000

# API mode by default
CMD ["node", "app.js"]

# For standalone mode, override:
# CMD ["node", "standalone-runner.js"]
```

**Build and run:**
```bash
# Build application
npm run build

# Build Docker image
docker build -t ivanti-import:latest .

# Run in API mode
docker run -d \
  -p 3000:3000 \
  -v $(pwd)/logs:/app/logs \
  -e PORT=3000 \
  -e LOG_LEVEL=info \
  --name ivanti-import \
  ivanti-import:latest

# Or run in standalone mode (scheduled with cron)
docker run \
  -v /etc/ivanti-import:/config \
  -v /var/log/ivanti-import:/app/logs \
  -e NODE_ENV=production \
  ivanti-import:latest \
  node standalone-runner.js --config /config/config.env
```

### Standalone Node.js

**systemd service** (`/etc/systemd/system/ivanti-import.service`):
```ini
[Unit]
Description=Ivanti Asset Import Service
After=network-online.target

[Service]
Type=oneshot
User=ivanti-import
WorkingDirectory=/opt/ivanti-import/app
EnvironmentFile=/etc/ivanti-import/config.env
ExecStart=/usr/bin/node /opt/ivanti-import/app/standalone-runner.js
StandardOutput=append:/var/log/ivanti-import/service.log
StandardError=append:/var/log/ivanti-import/error.log

[Install]
WantedBy=multi-user.target
```

**systemd timer** (`/etc/systemd/system/ivanti-import.timer`):
```ini
[Unit]
Description=Ivanti Asset Import Timer

[Timer]
OnCalendar=*-*-* 02:00:00
Persistent=true

[Install]
WantedBy=timers.target
```

**Enable:**
```bash
sudo systemctl daemon-reload
sudo systemctl enable ivanti-import.timer
sudo systemctl start ivanti-import.timer
```

---

## 🔌 API Reference

### Health Check

**GET** `/health`

Check service health.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-12T10:30:00.000Z",
  "uptime": 3600,
  "mode": "production"
}
```

### Supported Sources

**GET** `/api/sources`

List all supported integration source types.

**Response:**
```json
{
  "sources": ["vmware", "vcenter", "ipfabric", "ip-fabric", "snipeit", "snipe-it", "mock"]
}
```

### Async Import (Recommended)

**POST** `/api/import`

Start asset import in background. Returns immediately.

**Request:**
```json
{
  "ivantiUrl": "https://tenant.ivanticloud.com/HEAT/",
  "ivantiApiKey": "your-api-key",
  "integrationSourceType": "vmware",
  "singleAssetId": null
}
```

**Response** (202 Accepted):
```json
{
  "message": "Import process started",
  "integrationSourceType": "vmware",
  "timestamp": "2025-11-12T10:30:00.000Z"
}
```

**Note**: Check logs for import progress and results.

### Sync Import (Debugging Only)

**POST** `/api/import/sync`

Synchronous import - waits for completion. Use only for debugging.

**Request**: Same as async import

**Response** (200 OK):
```json
{
  "success": true,
  "integrationSourceType": "vmware",
  "totalReceived": 150,
  "totalProcessed": 150,
  "totalFailed": 0,
  "duration": 45000,
  "timestamp": "2025-11-12T10:35:00.000Z"
}
```

---

## 🔧 Adding New Sources

The service is designed for easy extensibility (Requirement #5). Add a new source in **3 steps**:

### Step 1: Create Adapter Class

Create `src/adapters/YourSourceAdapter.js`:

```javascript
const BaseSourceAdapter = require('./BaseSourceAdapter');
const executeWebRequest = require('../utils/webRequestUtils');
const logger = require('../utils/logger');

class YourSourceAdapter extends BaseSourceAdapter {
  constructor(config) {
    super(config);
    this.name = 'Your Source Name';
  }

  /**
   * Authenticate with source system
   * @returns {Promise<boolean>}
   */
  async authenticate() {
    try {
      const credentials = this.parseCredentials();
      const { username, password, apiToken } = credentials;
      
      // Your authentication logic here
      const response = await executeWebRequest({
        method: 'POST',
        url: `${this.baseUrl}/api/login`,
        headers: {
          'Content-Type': 'application/json'
        },
        data: { username, password }
      });
      
      this.authToken = response.data.token;
      logger.logInfo(`${this.name}: Authentication successful`);
      return true;
      
    } catch (error) {
      logger.logError(`${this.name}: Authentication failed - ${error.message}`);
      return false;
    }
  }

  /**
   * Get assets with paging
   * @param {number} pageSize 
   * @param {number} pageNumber 
   * @returns {Promise<{assets: Array, hasMore: boolean, totalCount: number}>}
   */
  async getAssets(pageSize, pageNumber) {
    try {
      const offset = (pageNumber - 1) * pageSize;
      
      const response = await executeWebRequest({
        method: 'GET',
        url: `${this.baseUrl}/api/assets`,
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        },
        params: {
          limit: pageSize,
          offset: offset
        }
      });
      
      const assets = response.data.items || [];
      const total = response.data.total || 0;
      const hasMore = (offset + assets.length) < total;
      
      logger.logInfo(`${this.name}: Retrieved ${assets.length} assets (page ${pageNumber})`);
      
      return {
        assets,
        hasMore,
        totalCount: total
      };
      
    } catch (error) {
      logger.logError(`${this.name}: Failed to get assets - ${error.message}`);
      throw error;
    }
  }

  /**
   * Get single asset by ID
   * @param {string} assetId 
   * @returns {Promise<Object|null>}
   */
  async getAssetById(assetId) {
    try {
      const response = await executeWebRequest({
        method: 'GET',
        url: `${this.baseUrl}/api/assets/${assetId}`,
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      });
      
      logger.logInfo(`${this.name}: Retrieved asset ${assetId}`);
      return response.data;
      
    } catch (error) {
      logger.logError(`${this.name}: Failed to get asset ${assetId} - ${error.message}`);
      return null;
    }
  }
}

module.exports = YourSourceAdapter;
```

### Step 2: Register in Factory

Edit `src/adapters/AdapterFactory.js`:

```javascript
const YourSourceAdapter = require('./YourSourceAdapter');

class AdapterFactory {
  static getAdapter(sourceType, config) {
    const type = sourceType.toLowerCase();
    
    switch (type) {
      case 'vmware':
      case 'vcenter':
        return new VMwareAdapter(config);
        
      case 'ipfabric':
      case 'ip-fabric':
        return new IPFabricAdapter(config);
        
      case 'snipeit':
      case 'snipe-it':
        return new SnipeITAdapter(config);
        
      case 'yoursource':           // Add your source here
      case 'your-source':
        return new YourSourceAdapter(config);
        
      case 'mock':
        return new MockAdapter(config);
        
      default:
        throw new Error(`Unsupported integration source type: ${sourceType}`);
    }
  }
  
  static getSupportedTypes() {
    return [
      'vmware', 'vcenter',
      'ipfabric', 'ip-fabric',
      'snipeit', 'snipe-it',
      'yoursource', 'your-source',  // Add here too
      'mock'
    ];
  }
}

module.exports = AdapterFactory;
```

### Step 3: Configure in Ivanti

Create integration configuration in Ivanti ITSM:

```
Business Object: xsc_assetintegrationconfigs

IntegrationName: Your Source Integration
IntegrationSourceType: yoursource
EndpointUrl: https://yoursource.company.com
Username: service_account
Password: (encrypted)
ApiToken: (if needed)
PageSize: 100
IsActive: true
```

**That's it!** The service will automatically use your new adapter.

### Testing Your Adapter

```bash
# Test with single asset
POST /api/import
{
  "ivantiUrl": "https://tenant.ivanticloud.com/HEAT/",
  "ivantiApiKey": "key",
  "integrationSourceType": "yoursource",
  "singleAssetId": "test-123"
}

# Test with dry-run (standalone)
node standalone-runner.js --source yoursource --dry-run
```

---

## 🔍 Troubleshooting

### Common Issues

#### Service Won't Start
```bash
# Check Node.js version
node --version  # Should be 14+

# Install dependencies
npm install

# Check for errors
npm start
```

#### Authentication Failures
```bash
# Enable debug logging
LOG_LEVEL=debug npm start

# Test credentials manually
curl -u 'user:pass' https://source-system/api/test

# Check Ivanti config
# Ensure Username/Password/ApiToken are correct
```

#### No Assets Imported
```bash
# Check logs
tail -f logs/asset-import-*.log

# Verify source adapter is working
node standalone-runner.js --source vmware --dry-run

# Check Ivanti queue
# Business Object: Frs_ops_integration_queues
# Status: Look for failures
```

#### IIS Issues
```powershell
# Check HttpPlatformHandler
Get-WindowsFeature Web-HttpPlatformHandler

# Check application pool
# Should be "No Managed Code"

# Check permissions
# IIS user needs write access to logs directory

# View IIS logs
Get-Content D:\Ivanti\logs\asset-import\asset-import-*.log -Tail 100
```

### Debug Mode

Enable detailed logging:

```bash
# In .env or environment
LOG_LEVEL=debug

# Restart service
npm start
```

### Getting Help

1. **Check Documentation**:
   - [QUICKSTART.md](QUICKSTART.md) - Setup guide
   - [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) - Configuration
   - [examples/TROUBLESHOOTING.md](examples/TROUBLESHOOTING.md) - Detailed troubleshooting
   - [examples/CONFIGURATION_EXAMPLES.md](examples/CONFIGURATION_EXAMPLES.md) - Examples

2. **Check Logs**:
   - Application logs: `logs/asset-import-*.log`
   - Ivanti logs: Business Object `xsc_assetintegrationlogs`
   - IIS logs: Check IIS Manager

3. **Test Components**:
   ```bash
   # Test API
   node test-api.js
   
   # Test with mock data
   node standalone-runner.js --source mock --dry-run
   
   # Test single asset
   # Use /api/import with singleAssetId
   ```

---

## 📚 Documentation

### Complete Documentation Set

| Document | Purpose | Audience |
|----------|---------|----------|
| [README.md](README.md) | Complete reference | Everyone |
| [QUICKSTART.md](QUICKSTART.md) | 15-minute setup | New users |
| [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) | Integration setup | Administrators |
| [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) | Architecture details | Developers |
| [BUILD.md](BUILD.md) | Build and deployment | DevOps |
| [REDHAT_DEPLOYMENT.md](REDHAT_DEPLOYMENT.md) | Linux deployment | System admins |
| [TESTING_GUIDE.md](TESTING_GUIDE.md) | Testing with mocks | QA/Developers |
| [examples/INDEX.md](examples/INDEX.md) | Documentation navigation | Everyone |
| [examples/CONFIGURATION_EXAMPLES.md](examples/CONFIGURATION_EXAMPLES.md) | Configuration templates | Administrators |
| [examples/TROUBLESHOOTING.md](examples/TROUBLESHOOTING.md) | Problem solving | Support |
| [ivanti-setup/README.md](ivanti-setup/README.md) | Ivanti configuration | Administrators |
| [CHANGELOG.md](CHANGELOG.md) | Version history | Everyone |

**Total Documentation**: 100+ KB of comprehensive guides

### Quick Links

- 🚀 [Get Started](QUICKSTART.md)
- 📖 [Full Guide](INTEGRATION_GUIDE.md)
- 🔧 [Examples](examples/CONFIGURATION_EXAMPLES.md)
- 🔍 [Troubleshoot](examples/TROUBLESHOOTING.md)
- 🏗 [Architecture](PROJECT_STRUCTURE.md)
- 🐧 [Linux Deploy](REDHAT_DEPLOYMENT.md)
- 🧪 [Testing](TESTING_GUIDE.md)

---

## 🎉 Project Status

### Requirements Met (All 16)

- ✅ **Req 1**: Multiple source support (VMware, IP Fabric, Snipe-IT, Mock)
- ✅ **Req 2**: Dynamic field mapping (configured in Ivanti)
- ✅ **Req 3**: Ivanti logging + file logging
- ✅ **Req 4**: POST requests with async response
- ✅ **Req 5**: Easy to maintain and extend
- ✅ **Req 6**: Field mappings defined in Ivanti per endpoint
- ✅ **Req 7**: CI Type layer support
- ✅ **Req 8**: Same Ivanti endpoint with XML compression
- ✅ **Req 9**: Health check for IIS environment
- ✅ **Req 10**: API keys in body/header/config
- ✅ **Req 11**: API-triggered OR independent mode
- ✅ **Req 12**: Source credentials stored in Ivanti
- ✅ **Req 13**: Minimal filesystem configuration
- ✅ **Req 14**: Paging implemented for all sources
- ✅ **Req 15**: README and index page
- ✅ **Req 16**: Full project structure and scripts

### Production Ready

- ✅ Clean layered architecture
- ✅ Design patterns (Factory, Strategy, Template Method)
- ✅ Comprehensive error handling
- ✅ Extensive documentation
- ✅ IIS deployment ready
- ✅ Health monitoring
- ✅ Logging and diagnostics
- ✅ Security best practices
- ✅ Extensible framework
- ✅ Tested and validated

---

## 📝 License

MIT License - See [LICENSE](LICENSE) file for details.

---

## 💡 Support

For questions, issues, or feature requests:

1. Review documentation in [examples/INDEX.md](examples/INDEX.md)
2. Check [examples/TROUBLESHOOTING.md](examples/TROUBLESHOOTING.md)
3. Review application logs
4. Contact your system administrator

---

**Built with ❤️ for Ivanti ITSM Integration**

*Version 1.1.0 - November 2025*
