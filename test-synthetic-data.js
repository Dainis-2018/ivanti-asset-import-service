/**
 * Synthetic Data Generator for Testing
 * Generates realistic test data for various source types
 */

const faker = require('faker');

class SyntheticDataGenerator {
  /**
   * Generate synthetic VMware virtual machines
   * @param {number} count - Number of VMs to generate
   * @returns {Array} - Array of VM objects
   */
  static generateVMwareVMs(count = 10) {
    const vms = [];
    
    for (let i = 0; i < count; i++) {
      vms.push({
        id: `vm-${faker.datatype.uuid()}`,
        name: `${faker.commerce.product()}-VM-${i + 1}`,
        
        // Hardware
        hardware: {
          numCPU: faker.random.arrayElement([2, 4, 8, 16]),
          memoryMB: faker.random.arrayElement([4096, 8192, 16384, 32768]),
          numCoresPerSocket: 2,
          version: 'vmx-17'
        },
        
        // Guest OS
        guest: {
          guestFullName: faker.random.arrayElement([
            'Microsoft Windows Server 2019 (64-bit)',
            'Microsoft Windows Server 2016 (64-bit)',
            'Red Hat Enterprise Linux 8 (64-bit)',
            'Ubuntu Linux (64-bit)',
            'CentOS 7 (64-bit)'
          ]),
          guestId: faker.random.arrayElement(['windows9Server64Guest', 'rhel8_64Guest', 'ubuntu64Guest']),
          hostName: faker.internet.domainName(),
          ipAddress: faker.internet.ip()
        },
        
        // Runtime
        runtime: {
          powerState: faker.random.arrayElement(['poweredOn', 'poweredOn', 'poweredOn', 'poweredOff']),
          bootTime: faker.date.recent(30).toISOString(),
          maxCpuUsage: faker.datatype.number({ min: 4000, max: 16000 }),
          maxMemoryUsage: faker.datatype.number({ min: 4096, max: 32768 })
        },
        
        // Config
        config: {
          uuid: faker.datatype.uuid(),
          instanceUuid: faker.datatype.uuid(),
          guestId: 'windows9Server64Guest',
          annotation: faker.lorem.sentence(),
          template: false
        },
        
        // Summary
        summary: {
          config: {
            name: `${faker.commerce.product()}-VM-${i + 1}`,
            vmPathName: `[datastore1] ${faker.commerce.product()}-VM-${i + 1}/${faker.commerce.product()}-VM-${i + 1}.vmx`,
            memorySizeMB: faker.random.arrayElement([4096, 8192, 16384]),
            numCpu: faker.random.arrayElement([2, 4, 8])
          },
          runtime: {
            powerState: 'poweredOn',
            host: `host-${faker.datatype.number({ min: 1, max: 10 })}`
          },
          guest: {
            ipAddress: faker.internet.ip(),
            hostName: faker.internet.domainName()
          }
        }
      });
    }
    
    return vms;
  }

  /**
   * Generate synthetic IP Fabric devices
   * @param {number} count - Number of devices to generate
   * @returns {Array} - Array of device objects
   */
  static generateIPFabricDevices(count = 10) {
    const devices = [];
    
    for (let i = 0; i < count; i++) {
      const deviceType = faker.random.arrayElement(['switch', 'router', 'firewall', 'load-balancer']);
      
      devices.push({
        id: faker.datatype.uuid(),
        sn: `SN${faker.random.alphaNumeric(10).toUpperCase()}`,
        hostname: `${deviceType}-${faker.random.arrayElement(['core', 'dist', 'access'])}-${i + 1}`,
        loginIp: faker.internet.ip(),
        loginType: faker.random.arrayElement(['ssh', 'telnet']),
        
        vendor: faker.random.arrayElement(['Cisco', 'Juniper', 'Arista', 'HPE', 'Dell']),
        platform: faker.random.arrayElement(['Catalyst 9300', 'Nexus 9000', 'ASR 1000', 'MX Series']),
        family: faker.random.arrayElement(['catalyst', 'nexus', 'asr', 'mx']),
        model: `${faker.random.alphaNumeric(4).toUpperCase()}-${faker.random.alphaNumeric(4).toUpperCase()}`,
        version: `${faker.datatype.number({ min: 12, max: 17 })}.${faker.datatype.number({ min: 0, max: 9 })}`,
        
        siteName: faker.random.arrayElement(['HQ', 'Branch-1', 'Branch-2', 'DC-East', 'DC-West']),
        
        memoryUtilization: faker.datatype.number({ min: 20, max: 80 }),
        cpuUtilization: faker.datatype.number({ min: 10, max: 90 }),
        
        uptime: faker.datatype.number({ min: 86400, max: 31536000 }),
        lastChange: faker.date.recent(30).toISOString(),
        lastCheck: faker.date.recent(1).toISOString(),
        
        stpDomain: faker.random.arrayElement([null, 'domain-1', 'domain-2']),
        reload: faker.date.recent(180).toISOString(),
        
        devType: deviceType,
        snHw: `HW${faker.random.alphaNumeric(10).toUpperCase()}`,
        
        taskKey: faker.datatype.uuid()
      });
    }
    
    return devices;
  }

  /**
   * Generate synthetic Snipe-IT assets
   * @param {number} count - Number of assets to generate
   * @returns {Array} - Array of asset objects
   */
  static generateSnipeITAssets(count = 10) {
    const assets = [];
    
    for (let i = 0; i < count; i++) {
      const assetType = faker.random.arrayElement(['laptop', 'desktop', 'server', 'tablet', 'phone']);
      
      assets.push({
        id: faker.datatype.number({ min: 1000, max: 9999 }),
        name: `${faker.company.companyName()}-${assetType.toUpperCase()}-${i + 1}`,
        asset_tag: `AT${faker.random.alphaNumeric(8).toUpperCase()}`,
        serial: `SN${faker.random.alphaNumeric(12).toUpperCase()}`,
        
        model: {
          id: faker.datatype.number({ min: 1, max: 100 }),
          name: faker.random.arrayElement([
            'Dell Latitude 7420',
            'HP EliteBook 840',
            'Lenovo ThinkPad X1',
            'MacBook Pro 16"',
            'Dell PowerEdge R640'
          ])
        },
        
        category: {
          id: faker.datatype.number({ min: 1, max: 20 }),
          name: faker.random.arrayElement(['Laptop', 'Desktop', 'Server', 'Mobile Device', 'Network Equipment'])
        },
        
        manufacturer: {
          id: faker.datatype.number({ min: 1, max: 50 }),
          name: faker.random.arrayElement(['Dell', 'HP', 'Lenovo', 'Apple', 'Cisco', 'Microsoft'])
        },
        
        status_label: {
          id: faker.datatype.number({ min: 1, max: 10 }),
          name: faker.random.arrayElement(['Ready to Deploy', 'Deployed', 'In Storage', 'Broken', 'Lost'])
        },
        
        assigned_to: faker.datatype.boolean() ? {
          id: faker.datatype.number({ min: 1, max: 500 }),
          username: faker.internet.userName(),
          name: faker.name.findName(),
          email: faker.internet.email()
        } : null,
        
        location: {
          id: faker.datatype.number({ min: 1, max: 30 }),
          name: faker.random.arrayElement(['HQ - Floor 1', 'HQ - Floor 2', 'Remote', 'Data Center', 'Warehouse'])
        },
        
        purchase_date: {
          date: faker.date.past(3).toISOString().split('T')[0],
          formatted: faker.date.past(3).toLocaleDateString()
        },
        
        purchase_cost: faker.datatype.number({ min: 500, max: 5000, precision: 0.01 }),
        
        warranty_months: faker.random.arrayElement([12, 24, 36, 60]),
        
        notes: faker.lorem.sentences(2),
        
        custom_fields: {
          'IP Address': { value: faker.internet.ip() },
          'MAC Address': { value: faker.internet.mac() },
          'OS Version': { value: faker.random.arrayElement(['Windows 11', 'Windows 10', 'macOS 13', 'Ubuntu 22.04']) }
        },
        
        created_at: {
          datetime: faker.date.past(2).toISOString(),
          formatted: faker.date.past(2).toLocaleString()
        },
        
        updated_at: {
          datetime: faker.date.recent(30).toISOString(),
          formatted: faker.date.recent(30).toLocaleString()
        }
      });
    }
    
    return assets;
  }

  /**
   * Generate test data for a specific source type
   * @param {string} sourceType - Source type (vmware, ipfabric, snipeit)
   * @param {number} count - Number of records
   * @returns {Array} - Generated data
   */
  static generateTestData(sourceType, count = 10) {
    switch (sourceType.toLowerCase()) {
      case 'vmware':
        return this.generateVMwareVMs(count);
      case 'ipfabric':
        return this.generateIPFabricDevices(count);
      case 'snipeit':
        return this.generateSnipeITAssets(count);
      default:
        throw new Error(`Unknown source type: ${sourceType}`);
    }
  }
}

module.exports = SyntheticDataGenerator;
