# Build Guide

Simple webpack-based build using pure npm commands.

---

## Quick Start

```bash
# Install dependencies
npm install

# Build
npm run build

# The built application is now in dist/
```

---

## Commands

```bash
# Clean previous build
npm run clean

# Build production bundle
npm run build

# Build and watch for changes
npm run build:watch

# Run from source (development)
npm run start:dev
npm run standalone:dev

# Run from built distribution
npm start
npm run standalone
```

---

## What Gets Built

After `npm run build`, the `dist/` directory contains:

```
dist/
├── app.js                    # Bundled application
├── standalone-runner.js      # Bundled standalone runner
├── views/                    # HTML views
├── examples/                 # Documentation examples
├── ivanti-setup/            # Setup guides
├── .env.example             # Configuration template
├── web.config               # IIS configuration
├── README.md                # Main documentation
├── QUICKSTART.md
├── INTEGRATION_GUIDE.md
├── CHANGELOG.md
└── LICENSE
```

**NOT included in dist/**:
- ❌ Source code (`src/` directory)
- ❌ Development files
- ❌ Build configuration
- ❌ Tests

---

## Deploy

### Copy dist/ to Server

```bash
# Copy dist folder to server
scp -r dist/ user@server:/opt/ivanti-import/app/

# Or tar it first
cd dist
tar -czf ../app.tar.gz .
scp ../app.tar.gz user@server:/tmp/
```

### On Server

```bash
# Extract (if tarred)
cd /opt/ivanti-import/app
tar -xzf /tmp/app.tar.gz

# Install production dependencies
npm install --production

# Configure
cp .env.example .env
vi .env

# Run
node app.js
# or
node standalone-runner.js
```

---

## RedHat Linux

```bash
# On development machine
npm install
npm run build

# Copy to server
cd dist
tar -czf ../ivanti-import-dist.tar.gz .
scp ../ivanti-import-dist.tar.gz user@server:/tmp/

# On server
sudo -u ivanti-import mkdir -p /opt/ivanti-import/app
cd /opt/ivanti-import/app
sudo -u ivanti-import tar -xzf /tmp/ivanti-import-dist.tar.gz
sudo -u ivanti-import npm install --production

# Configure
sudo cp .env.example /etc/ivanti-import/config.env
sudo vi /etc/ivanti-import/config.env

# Test
sudo -u ivanti-import node standalone-runner.js --help
```

---

## Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY dist/ .
RUN npm install --production
EXPOSE 3000
CMD ["node", "app.js"]
```

```bash
npm run build
docker build -t ivanti-import .
docker run -d -p 3000:3000 ivanti-import
```

---

## Development vs Production

| Mode | Command | Source | Use Case |
|------|---------|--------|----------|
| **Development** | `npm run start:dev` | Uses `src/` | Local development |
| **Production** | `npm start` | Uses `dist/` | Deployed environments |

---

## Troubleshooting

**"Cannot find module"**
```bash
npm install
```

**"dist directory not found"**
```bash
npm run build
```

**"Permission denied"**
```bash
chmod +x dist/standalone-runner.js
```

---

## That's It!

Simple webpack build. No shell scripts. No archives. Just `npm run build` and deploy the `dist/` folder.
