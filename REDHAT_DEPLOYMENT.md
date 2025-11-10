# RedHat Linux Deployment Guide

Simple deployment guide for RedHat/CentOS using the webpack-built distribution.

---

## Prerequisites

**On Development Machine:**
- Node.js 14+
- npm

**On RedHat Server:**
- Node.js 14+
- npm
- User account: `ivanti-import`

---

## Quick Deployment

### Step 1: Build on Development Machine

```bash
# Clone/download project
cd ivanti-asset-import-service

# Install dependencies and build
npm install
npm run build

# Package dist folder
cd dist
tar -czf ../ivanti-import.tar.gz .
cd ..
```

### Step 2: Copy to Server

```bash
scp ivanti-import.tar.gz user@server:/tmp/
```

### Step 3: Deploy on Server

```bash
# SSH to server
ssh user@server

# Create directories
sudo useradd -r -s /sbin/nologin -d /opt/ivanti-import -m ivanti-import
sudo mkdir -p /var/log/ivanti-import
sudo mkdir -p /etc/ivanti-import
sudo chown ivanti-import:ivanti-import /var/log/ivanti-import

# Extract application
cd /opt/ivanti-import
sudo -u ivanti-import mkdir app
cd app
sudo -u ivanti-import tar -xzf /tmp/ivanti-import.tar.gz

# Install dependencies
sudo -u ivanti-import npm install --production
```

### Step 4: Configure

```bash
# Create configuration
sudo cp /opt/ivanti-import/app/.env.example /etc/ivanti-import/config.env
sudo vi /etc/ivanti-import/config.env
```

**Configuration** (`/etc/ivanti-import/config.env`):
```bash
IVANTI_URL=https://your-tenant.ivanticloud.com/HEAT/
IVANTI_API_KEY=your_api_key_here
LOG_LEVEL=info
LOG_PATH=/var/log/ivanti-import
ENABLE_HEALTH_CHECK_PINGER=false
```

```bash
# Secure configuration
sudo chmod 600 /etc/ivanti-import/config.env
sudo chown ivanti-import:ivanti-import /etc/ivanti-import/config.env
```

### Step 5: Test

```bash
# Test help
sudo -u ivanti-import NODE_ENV=production \
  node /opt/ivanti-import/app/standalone-runner.js --help

# Test dry run
sudo -u ivanti-import NODE_ENV=production \
  node /opt/ivanti-import/app/standalone-runner.js \
  --config /etc/ivanti-import/config.env --dry-run
```

---

## Systemd Service

### Create Service File

**`/etc/systemd/system/ivanti-import.service`:**
```ini
[Unit]
Description=Ivanti Asset Import Service
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
User=ivanti-import
Group=ivanti-import
WorkingDirectory=/opt/ivanti-import/app
EnvironmentFile=/etc/ivanti-import/config.env

ExecStart=/usr/bin/node /opt/ivanti-import/app/standalone-runner.js

StandardOutput=append:/var/log/ivanti-import/systemd.log
StandardError=append:/var/log/ivanti-import/systemd-error.log

[Install]
WantedBy=multi-user.target
```

### Create Timer

**`/etc/systemd/system/ivanti-import.timer`:**
```ini
[Unit]
Description=Ivanti Asset Import Timer

[Timer]
OnCalendar=*-*-* 02:00:00
Persistent=true

[Install]
WantedBy=timers.target
```

### Enable and Start

```bash
sudo systemctl daemon-reload
sudo systemctl enable ivanti-import.timer
sudo systemctl start ivanti-import.timer

# Check status
sudo systemctl status ivanti-import.timer
sudo systemctl list-timers ivanti-import.timer
```

---

## Cron Alternative

```bash
# Edit crontab
sudo crontab -e -u ivanti-import

# Add line (daily at 2 AM):
0 2 * * * cd /opt/ivanti-import/app && /usr/bin/node standalone-runner.js --config /etc/ivanti-import/config.env >> /var/log/ivanti-import/cron.log 2>&1
```

---

## Firewall

**No inbound rules needed!** Service only makes outbound connections.

```bash
# Verify outbound connectivity
curl -I https://your-tenant.ivanticloud.com/HEAT/
curl -I https://vcenter.company.com
```

---

## Monitoring

### Check Logs

```bash
# Application logs
tail -f /var/log/ivanti-import/asset-import-*.log

# Systemd logs
sudo journalctl -u ivanti-import.service -f

# Cron logs
tail -f /var/log/ivanti-import/cron.log
```

### Log Rotation

**`/etc/logrotate.d/ivanti-import`:**
```
/var/log/ivanti-import/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0644 ivanti-import ivanti-import
}
```

---

## Updates

```bash
# On development machine
npm run build
cd dist && tar -czf ../ivanti-import.tar.gz . && cd ..
scp ivanti-import.tar.gz user@server:/tmp/

# On server
sudo systemctl stop ivanti-import.timer
cd /opt/ivanti-import/app
sudo -u ivanti-import tar -xzf /tmp/ivanti-import.tar.gz
sudo -u ivanti-import npm install --production
sudo systemctl start ivanti-import.timer
```

---

## Troubleshooting

### Cannot connect to Ivanti

```bash
# Test connectivity
curl -v https://your-tenant.ivanticloud.com/HEAT/

# Check configuration
sudo cat /etc/ivanti-import/config.env
```

### Module not found

```bash
cd /opt/ivanti-import/app
sudo -u ivanti-import npm install --production
```

### Permission denied

```bash
sudo chown -R ivanti-import:ivanti-import /opt/ivanti-import
sudo chown -R ivanti-import:ivanti-import /var/log/ivanti-import
```

---

## File Locations

```
/opt/ivanti-import/app/           - Application
/etc/ivanti-import/config.env     - Configuration
/var/log/ivanti-import/           - Logs
```

---

## Quick Reference

```bash
# Manual execution
sudo -u ivanti-import node /opt/ivanti-import/app/standalone-runner.js --config /etc/ivanti-import/config.env

# Check timer
sudo systemctl list-timers ivanti-import.timer

# View logs
tail -f /var/log/ivanti-import/asset-import-*.log

# Test config
sudo -u ivanti-import node /opt/ivanti-import/app/standalone-runner.js --config /etc/ivanti-import/config.env --help
```

---

For more details, see [BUILD.md](BUILD.md) and [README.md](README.md).
