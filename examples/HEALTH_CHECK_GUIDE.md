# Health Check Configuration Guide

## Overview

The service includes an automatic health check pinger that keeps IIS application pools alive by pinging the `/health` endpoint every 5 minutes.

---

## How It Works

1. **Automatic Start**: The health check pinger starts automatically when the service starts
2. **First Ping**: Occurs 30 seconds after service start
3. **Periodic Pings**: Every 5 minutes thereafter
4. **Logging**: All pings are logged at INFO level with a counter

---

## Configuration

### Enable/Disable Health Check

**In .env file:**
```bash
# Enable (default)
ENABLE_HEALTH_CHECK_PINGER=true

# Disable
ENABLE_HEALTH_CHECK_PINGER=false
```

**In web.config (IIS):**
```xml
<appSettings>
  <!-- Enable (default) -->
  <add key="ENABLE_HEALTH_CHECK_PINGER" value="true" />
  
  <!-- Disable -->
  <add key="ENABLE_HEALTH_CHECK_PINGER" value="false" />
</appSettings>
```

---

## Log Output

### Startup
```
[INFO] Health check pinger started - will ping http://localhost:3000/health every 5 minutes
```

### Successful Ping (every 5 minutes)
```
[INFO] Health check ping #1: OK
[INFO] Health check ping #2: OK
[INFO] Health check ping #3: OK
```

### Failed Ping
```
[ERROR] Health check ping #4 failed: connect ECONNREFUSED
```

### Disabled
```
[INFO] Health check pinger is disabled (ENABLE_HEALTH_CHECK_PINGER=false)
```

---

## Why You Need This

### IIS Application Pools
By default, IIS application pools idle out after 20 minutes of inactivity. This causes:
- First request after idle takes longer (cold start)
- Service needs to reinitialize
- Import requests may timeout

### The Solution
The health check pinger:
- ✅ Keeps the application pool active
- ✅ Prevents cold starts
- ✅ Ensures consistent response times
- ✅ Maintains service availability

---

## Troubleshooting

### Issue: No pings in logs after first one

**Possible Causes:**
1. **Log level too high**: Health checks log at INFO level
   - Solution: Set `LOG_LEVEL=info` in .env or web.config
   
2. **Health check disabled**: Check configuration
   - Solution: Verify `ENABLE_HEALTH_CHECK_PINGER=true`

3. **Process crashed**: Service not running
   - Solution: Check service status, review error logs

4. **Incorrect BASE_URL**: Can't reach itself
   - Solution: Verify `BASE_URL` matches actual service URL

### Issue: Health check pings failing

**Symptoms:**
```
[ERROR] Health check ping #X failed: connect ECONNREFUSED
```

**Solutions:**

1. **Check BASE_URL configuration**:
   ```bash
   # Should match where service is running
   BASE_URL=http://localhost:3000
   ```

2. **Verify service is listening**:
   ```bash
   curl http://localhost:3000/health
   # Should return: {"status":"OK","timestamp":"..."}
   ```

3. **Check firewall/network**:
   - Service needs to be able to reach itself
   - Check localhost/127.0.0.1 is not blocked

4. **IIS URL binding**:
   - Ensure BASE_URL matches IIS site binding
   - Example: If IIS binds to port 8080, use `BASE_URL=http://localhost:8080`

### Issue: Too many log entries

**Solution**: Adjust log level or rotation settings

**Option 1**: Change log level (won't see pings)
```bash
LOG_LEVEL=warn  # Only warnings and errors
```

**Option 2**: Adjust log rotation (in src/utils/logger.js)
```javascript
new DailyRotateFile({
  dirname: logDirectory,
  filename: 'asset-import-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '7d'  // Keep only 7 days instead of 30
})
```

**Option 3**: Disable health check (not recommended for IIS)
```bash
ENABLE_HEALTH_CHECK_PINGER=false
```

---

## Testing

### Test Health Check Manually

```bash
# Start service
npm start

# Wait 30 seconds, then check logs
tail -f logs/asset-import-*.log

# You should see:
# [INFO] Health check pinger started...
# [INFO] Health check ping #1: OK
# (wait 5 minutes)
# [INFO] Health check ping #2: OK
```

### Test Health Endpoint Directly

```bash
curl http://localhost:3000/health

# Expected response:
# {
#   "status": "OK",
#   "timestamp": "2025-11-04T12:34:56.789Z"
# }
```

### Verify in IIS

1. **Deploy to IIS**
2. **Start service** (browse to homepage)
3. **Check logs** in configured LOG_PATH
4. **Wait 5 minutes**
5. **Verify** health check pings appear in logs
6. **Check IIS** - Application pool should remain active

---

## Advanced Configuration

### Change Ping Interval

To change from 5 minutes to another interval, edit `src/utils/healthCheckPinger.js`:

```javascript
class HealthCheckPinger {
  constructor() {
    this.intervalId = null;
    this.baseUrl = null;
    this.pingInterval = 10 * 60 * 1000; // 10 minutes instead of 5
    this.isRunning = false;
    this.pingCount = 0;
  }
}
```

**Recommended intervals:**
- Development: 5 minutes (default)
- Production (high traffic): 10-15 minutes
- Production (low traffic): 3-5 minutes
- IIS with short idle timeout: 2-3 minutes

### Custom Health Check Logic

To add custom health checks, modify the `/health` endpoint in `src/app.js`:

```javascript
app.get('/health', async (req, res) => {
  try {
    // Add custom checks here
    // Example: Check database connection
    // await database.ping();
    
    // Example: Check external service
    // await externalService.status();
    
    res.status(200).json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage()
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'ERROR', 
      message: error.message 
    });
  }
});
```

---

## Best Practices

### ✅ Do:
- Keep health check enabled in production IIS environments
- Monitor health check logs for failures
- Set appropriate BASE_URL for your environment
- Use INFO log level to see health checks

### ❌ Don't:
- Disable health checks in production IIS without understanding impact
- Set ping interval too short (< 1 minute) - causes unnecessary load
- Ignore health check failures - they indicate problems
- Block localhost access - service needs to reach itself

---

## Summary

| Setting | Default | Purpose |
|---------|---------|---------|
| ENABLE_HEALTH_CHECK_PINGER | true | Enable/disable automatic pinging |
| BASE_URL | http://localhost:3000 | URL service uses to ping itself |
| Ping Interval | 5 minutes | How often to ping |
| Log Level | INFO | Level at which pings are logged |
| First Ping | 30 seconds | Delay before first ping |

**Status**: ✅ Working correctly after fix
**Version**: 1.0.1 (updated)

---

For more information, see:
- README.md - General documentation
- TROUBLESHOOTING.md - Common issues
- PROJECT_STRUCTURE.md - Code architecture
