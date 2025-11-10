# 📚 Documentation Index

**Ivanti Asset Import Service** - Complete Documentation Navigation

---

## 🚀 Getting Started (New Users Start Here!)

### Quick Start Path
1. **[QUICKSTART.md](../QUICKSTART.md)** ⭐ **(15 minutes)**
   - Fastest way to get running
   - Installation → Configuration → First Import
   - Perfect for initial setup

### Installation
2. **[README.md](../README.md)** → Installation Section
   - Prerequisites
   - Step-by-step installation
   - Windows and Linux instructions
   - Scripts: `install.bat` (Windows) or `install.sh` (Linux/Mac)

---

## 📖 Core Documentation

### Complete Reference
- **[README.md](../README.md)** (18KB) ⭐
  - Complete project documentation
  - Installation, configuration, deployment
  - API reference
  - Troubleshooting basics
  - **Use for**: Complete reference

### Integration Setup
- **[INTEGRATION_GUIDE.md](../INTEGRATION_GUIDE.md)** (13KB) ⭐
  - Step-by-step Ivanti ITSM setup
  - Complete field mapping examples
  - Source system configuration
  - Testing procedures
  - **Use for**: Setting up integrations

### Architecture & Code
- **[PROJECT_STRUCTURE.md](../PROJECT_STRUCTURE.md)** (12KB)
  - Complete architecture overview
  - Component descriptions
  - Data flow diagrams
  - Design patterns
  - Extension points
  - **Use for**: Understanding the codebase

---

## 📁 Examples & Templates

### Configuration Examples
- **[examples/CONFIGURATION_EXAMPLES.md](CONFIGURATION_EXAMPLES.md)** ⭐
  - 10 complete configuration examples
  - VMware, IP Fabric, Snipe-IT setups
  - Field mapping patterns
  - Multi-source scenarios
  - Common mistakes and corrections
  - **Use for**: Copy-paste configurations

### Troubleshooting Guide
- **[examples/TROUBLESHOOTING.md](TROUBLESHOOTING.md)** ⭐
  - Comprehensive troubleshooting guide
  - Common issues and solutions
  - Error message reference
  - Debug techniques
  - Performance optimization
  - **Use for**: Solving problems

### API Testing
- **[examples/Postman_Collection.json](Postman_Collection.json)**
  - Complete Postman collection
  - All API endpoints
  - Direct source system tests
  - Ivanti API tests
  - **Use for**: API testing

---

## 🔧 Setup Guides

### Ivanti ITSM Configuration
- **[ivanti-setup/README.md](../ivanti-setup/README.md)**
  - Business object creation
  - Field definitions
  - Relationships setup
  - Example data
  - Validation steps
  - **Use for**: Ivanti configuration

### Source System Setup

#### VMware vCenter
- **[INTEGRATION_GUIDE.md](../INTEGRATION_GUIDE.md)** → Source System Setup → VMware
  - Service account creation
  - Permission configuration
  - API testing
  - **Use for**: VMware setup

#### IP Fabric
- **[INTEGRATION_GUIDE.md](../INTEGRATION_GUIDE.md)** → Source System Setup → IP Fabric
  - API token generation
  - Testing procedures
  - **Use for**: IP Fabric setup

#### Snipe-IT
- **[INTEGRATION_GUIDE.md](../INTEGRATION_GUIDE.md)** → Source System Setup → Snipe-IT
  - API token generation
  - Version requirements
  - Testing procedures
  - **Use for**: Snipe-IT setup

---

## 🎯 By Use Case

### "I want to get started quickly"
→ **[QUICKSTART.md](../QUICKSTART.md)**

### "I need to set up VMware integration"
→ **[CONFIGURATION_EXAMPLES.md](CONFIGURATION_EXAMPLES.md)** → Example 1

### "I'm having authentication issues"
→ **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** → Authentication Issues

### "No assets are being imported"
→ **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** → Import Issues

### "I want to add a new source adapter"
→ **[README.md](../README.md)** → Adding New Sources

### "The import is too slow"
→ **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** → Performance Issues

### "I need to deploy to IIS"
→ **[README.md](../README.md)** → Deployment → IIS Deployment

### "How do I create field mappings?"
→ **[INTEGRATION_GUIDE.md](../INTEGRATION_GUIDE.md)** → Field Mapping Examples

### "I need example configurations"
→ **[CONFIGURATION_EXAMPLES.md](CONFIGURATION_EXAMPLES.md)**

### "I want to understand the architecture"
→ **[PROJECT_STRUCTURE.md](../PROJECT_STRUCTURE.md)**

---

## 📊 By Role

### System Administrator
**Priority Documents**:
1. **[QUICKSTART.md](../QUICKSTART.md)** - Initial setup
2. **[INTEGRATION_GUIDE.md](../INTEGRATION_GUIDE.md)** - Configuration
3. **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Problem solving
4. **[CONFIGURATION_EXAMPLES.md](CONFIGURATION_EXAMPLES.md)** - Templates

**Key Tasks**:
- Installation and deployment
- Source system configuration
- Ivanti ITSM setup
- Monitoring and maintenance

### Developer
**Priority Documents**:
1. **[PROJECT_STRUCTURE.md](../PROJECT_STRUCTURE.md)** - Architecture
2. **[README.md](../README.md)** → Adding New Sources
3. Source code in `/src` directory
4. **[CONFIGURATION_EXAMPLES.md](CONFIGURATION_EXAMPLES.md)** - Patterns

**Key Tasks**:
- Adding new adapters
- Customizing functionality
- Debugging issues
- Code maintenance

### Integration Specialist
**Priority Documents**:
1. **[INTEGRATION_GUIDE.md](../INTEGRATION_GUIDE.md)** - Complete guide
2. **[CONFIGURATION_EXAMPLES.md](CONFIGURATION_EXAMPLES.md)** - Examples
3. **[ivanti-setup/README.md](../ivanti-setup/README.md)** - Ivanti config
4. **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Issues

**Key Tasks**:
- Configuring field mappings
- Setting up CI Types
- Testing integrations
- Optimizing imports

### End User / Business Analyst
**Priority Documents**:
1. **[QUICKSTART.md](../QUICKSTART.md)** - Overview
2. **[README.md](../README.md)** → Usage section
3. **[CONFIGURATION_EXAMPLES.md](CONFIGURATION_EXAMPLES.md)** - Understanding

**Key Tasks**:
- Understanding capabilities
- Requesting new integrations
- Monitoring import status

---

## 🔍 By Topic

### Installation & Setup
- [QUICKSTART.md](../QUICKSTART.md) - Fast setup
- [README.md](../README.md) → Installation
- [install.bat](../install.bat) / [install.sh](../install.sh) - Scripts

### Configuration
- [INTEGRATION_GUIDE.md](../INTEGRATION_GUIDE.md) - Complete guide
- [CONFIGURATION_EXAMPLES.md](CONFIGURATION_EXAMPLES.md) - Examples
- [ivanti-setup/README.md](../ivanti-setup/README.md) - Ivanti objects
- [.env.example](../.env.example) - Environment variables
- [web.config](../web.config) - IIS configuration

### Usage & API
- [README.md](../README.md) → API Reference
- [Postman_Collection.json](Postman_Collection.json) - API tests
- [test-api.js](../test-api.js) - Test script
- [src/views/index.html](../src/views/index.html) - Web interface

### Troubleshooting
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Comprehensive guide
- [README.md](../README.md) → Troubleshooting section
- [INTEGRATION_GUIDE.md](../INTEGRATION_GUIDE.md) → Monitoring

### Development
- [PROJECT_STRUCTURE.md](../PROJECT_STRUCTURE.md) - Architecture
- [README.md](../README.md) → Adding New Sources
- Source code documentation in `/src`
- [CHANGELOG.md](../CHANGELOG.md) - Version history

### Deployment
- [README.md](../README.md) → Deployment section
- [web.config](../web.config) - IIS configuration
- [INTEGRATION_GUIDE.md](../INTEGRATION_GUIDE.md) → Production Deployment

---

## 📝 Quick Reference Cards

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check |
| `/api/sources` | GET | List supported sources |
| `/api/import` | POST | Async import (fast) |
| `/api/import/sync` | POST | Sync import (debug) |

**Full details**: [README.md](../README.md) → API Reference

### Supported Sources

- **vmware** / **vcenter** - VMware vCenter
- **ipfabric** / **ip-fabric** - IP Fabric
- **snipeit** / **snipe-it** - Snipe-IT

**Full details**: [CONFIGURATION_EXAMPLES.md](CONFIGURATION_EXAMPLES.md)

### Mapping Types

- **Field** - Direct field mapping
- **Template** - Template with placeholders `{field1} {field2}`
- **Fixed** - Constant value

**Full details**: [INTEGRATION_GUIDE.md](../INTEGRATION_GUIDE.md) → Field Mapping Examples

### Required Ivanti Objects

1. **xsc_assetintegrationconfigs** - Integration configs
2. **xsc_assetintegration_citypes** - CI Types
3. **xsc_assetintegration_mappings** - Field mappings

**Full details**: [ivanti-setup/README.md](../ivanti-setup/README.md)

---

## 🎓 Learning Path

### Beginner (Day 1)
1. Read [QUICKSTART.md](../QUICKSTART.md) (15 min)
2. Install service (5 min)
3. Test health endpoint (2 min)
4. Read one example in [CONFIGURATION_EXAMPLES.md](CONFIGURATION_EXAMPLES.md) (10 min)

### Intermediate (Week 1)
1. Complete [INTEGRATION_GUIDE.md](../INTEGRATION_GUIDE.md) setup (2 hours)
2. Configure one source system (1 hour)
3. Create Ivanti business objects (1 hour)
4. Perform first full import (30 min)
5. Review [TROUBLESHOOTING.md](TROUBLESHOOTING.md) (30 min)

### Advanced (Month 1)
1. Study [PROJECT_STRUCTURE.md](../PROJECT_STRUCTURE.md) (1 hour)
2. Add custom adapter (4 hours)
3. Optimize performance (2 hours)
4. Set up monitoring (2 hours)
5. Deploy to production (4 hours)

---

## 🔗 External Resources

### Technologies Used
- [Node.js Documentation](https://nodejs.org/docs)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [Winston Logger](https://github.com/winstonjs/winston)
- [Axios HTTP Client](https://axios-http.com/docs/intro)

### Source Systems
- [VMware vCenter REST API](https://developer.vmware.com/apis/vsphere-automation/latest/)
- [IP Fabric API Documentation](https://docs.ipfabric.io/api/)
- [Snipe-IT API Documentation](https://snipe-it.readme.io/reference)

### Ivanti ITSM
- [Ivanti Service Manager Documentation](https://help.ivanti.com/ht/help/en_US/ISM/2023)

---

## 📞 Getting Help

### Documentation Search Order
1. Check relevant quick reference above
2. Search [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for error message
3. Review [CONFIGURATION_EXAMPLES.md](CONFIGURATION_EXAMPLES.md) for similar scenario
4. Consult [README.md](../README.md) for complete reference
5. Check service logs in `logs/` directory

### Before Asking for Help
- [ ] Read relevant documentation
- [ ] Check troubleshooting guide
- [ ] Review service logs
- [ ] Test with debug logging enabled
- [ ] Try single asset import
- [ ] Verify source system connectivity

### Information to Provide
- Error messages (full stack trace)
- Service logs (last 100 lines)
- Configuration (sanitized)
- Steps to reproduce
- Expected vs actual behavior

---

## 📦 File Structure Reference

```
ivanti-asset-import-service/
│
├── 📄 README.md                    # Main documentation
├── 📄 QUICKSTART.md                # 15-minute setup guide
├── 📄 INTEGRATION_GUIDE.md         # Integration instructions
├── 📄 PROJECT_STRUCTURE.md         # Architecture details
├── 📄 DELIVERY_SUMMARY.md          # Project delivery notes
├── 📄 CHANGELOG.md                 # Version history
├── 📄 LICENSE                      # MIT License
│
├── 📁 src/                         # Source code
│   ├── adapters/                  # Source integrations
│   ├── controllers/               # HTTP handlers
│   ├── services/                  # Business logic
│   ├── routes/                    # API routes
│   ├── utils/                     # Utilities
│   └── views/                     # Web interface
│
├── 📁 examples/                    # Examples & guides
│   ├── 📄 CONFIGURATION_EXAMPLES.md
│   ├── 📄 TROUBLESHOOTING.md
│   ├── 📄 INDEX.md                # This file
│   └── 📄 Postman_Collection.json
│
├── 📁 ivanti-setup/                # Ivanti configuration
│   └── 📄 README.md
│
├── 📁 logs/                        # Log files (runtime)
│
├── 📄 package.json                 # Dependencies
├── 📄 web.config                   # IIS configuration
├── 📄 .env.example                 # Environment template
│
├── 📄 install.bat                  # Windows installer
├── 📄 install.sh                   # Linux/Mac installer
└── 📄 test-api.js                  # API test script
```

---

## 🎯 Document Purpose Summary

| Document | Size | Purpose | Audience |
|----------|------|---------|----------|
| QUICKSTART.md | 6KB | Fast setup | New users |
| README.md | 18KB | Complete reference | Everyone |
| INTEGRATION_GUIDE.md | 13KB | Setup instructions | Administrators |
| PROJECT_STRUCTURE.md | 12KB | Architecture | Developers |
| CONFIGURATION_EXAMPLES.md | 20KB | Templates | Administrators |
| TROUBLESHOOTING.md | 22KB | Problem solving | Support |
| ivanti-setup/README.md | 7KB | Ivanti config | Administrators |

**Total Documentation**: ~100KB of comprehensive guides

---

## ✨ Pro Tips

1. **Bookmark This Page** - Central navigation for all documentation
2. **Start with QUICKSTART** - Fastest path to working service
3. **Use Examples** - Copy configurations from CONFIGURATION_EXAMPLES
4. **Enable Debug Logs** - First step in troubleshooting
5. **Test Incrementally** - Single asset → Small batch → Full import
6. **Read Error Messages** - They're usually helpful
7. **Check Multiple Sources** - Cross-reference documentation
8. **Keep Logs** - Essential for troubleshooting

---

**Last Updated**: November 4, 2025  
**Version**: 1.0.0  
**Documentation Status**: ✅ Complete

---

*Need to add to this index? Update the INDEX.md file in the examples directory.*
