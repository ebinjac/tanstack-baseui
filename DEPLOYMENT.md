# Ensemble Platform - Deployment Guide

This guide provides step-by-step instructions for building and deploying the Ensemble Platform in a production environment.

## Prerequisites

Before deploying, ensure you have:

- **Node.js** (v20 or higher)
- **pnpm** package manager
- **PostgreSQL** database (v14 or higher)
- **SSL Certificate** (for production HTTPS)

---

## Environment Variables

Create a `.env` file in the project root with the following variables:

```bash
# Database Configuration
DATABASE_URL="postgresql://username:password@hostname:5432/database?schema=ensemble"

# Session Security (PRODUCTION ONLY)
# MUST be 32+ characters long for production
SESSION_PASSWORD="your-secure-32-char-minimum-password-here-change-this"

# Node Environment
NODE_ENV="production"
```

### Environment Variable Details

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | ✅ Yes | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/ensemble` |
| `SESSION_PASSWORD` | ⚠️ Production | Secure session encryption key (32+ chars) | `a-very-long-and-secure-password-32-chars-minimum` |
| `NODE_ENV` | Recommended | Environment mode | `production` or `development` |

---

## Build Process

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Database

Run database migrations to create the required tables:

```bash
# Generate migration files
pnpm run db:generate

# Apply migrations to database
pnpm run db:push
```

**Important:** Ensure your database has the `ensemble` schema created:

```sql
CREATE SCHEMA IF NOT EXISTS ensemble;
```

### 3. Build the Application

```bash
pnpm run build
```

This command:
- Compiles TypeScript to JavaScript
- Bundles client-side code with Vite
- Creates optimized production assets in `.output/` directory
- Generates server entry point at `.output/server/index.mjs`

**Build output:**
```
.output/
├── public/        # Static assets and client bundles
└── server/
    └── index.mjs  # Production server entry point
```

---

## Running in Production

### Option 1: Direct Node Execution

```bash
NODE_ENV=production node .output/server/index.mjs
```

### Option 2: Using npm script

```bash
pnpm run start
```

### Option 3: Process Manager (Recommended)

Using **PM2** for production deployments:

```bash
# Install PM2 globally
npm install -g pm2

# Start the application
pm2 start .output/server/index.mjs --name ensemble-platform

# Configure PM2 to restart on system reboot
pm2 startup
pm2 save
```

---

## Production Checklist

Before deploying to production, verify:

- [ ] `.env` file exists with all required variables
- [ ] `SESSION_PASSWORD` is set and is 32+ characters long
- [ ] `DATABASE_URL` points to your production PostgreSQL instance
- [ ] Database migrations have been applied (`pnpm run db:push`)
- [ ] `NODE_ENV` is set to `"production"`
- [ ] SSL/TLS certificates are configured for HTTPS
- [ ] Firewall rules allow traffic on your desired port (default: 3000)

---

## SSO Authentication Setup

The Ensemble Platform uses **SSO (Single Sign-On)** for authentication. 

### Development Mode

In development (`npm run dev`), the application uses mock SSO data for testing.

### Production Mode

In production, ensure:

1. **SSO Provider Configuration:**
   - Your SSO provider (e.g., SAML, OAuth) is properly configured
   - Callback URLs are whitelisted in your SSO provider
   - SSO metadata/certificates are in place

2. **Session Configuration:**
   - `SESSION_PASSWORD` environment variable MUST be set
   - Sessions are encrypted using `iron-session`
   - Cookies are set to `secure: true` (HTTPS only) in production

3. **User Registration Flow:**
   - On first SSO login, users are automatically registered in the database
   - User permissions are fetched from Active Directory groups
   - Team memberships are synced based on AD group associations

### Troubleshooting SSO in Production

If SSO users are not registering:

1. **Check Environment Variables:**
   ```bash
   echo $SESSION_PASSWORD
   echo $DATABASE_URL
   echo $NODE_ENV
   ```

2. **Verify Database Connection:**
   ```bash
   psql $DATABASE_URL -c "SELECT 1;"
   ```

3. **Enable Debug Logging:**
   
   Modify `.output/server/index.mjs` or set environment variable:
   ```bash
   DEBUG=* node .output/server/index.mjs
   ```

4. **Check Cookie Settings:**
   - Ensure your domain supports HTTPS in production
   - Verify `secure: true` cookies are being set correctly
   - Check browser console for cookie errors

---

## Server Configuration

### Port Configuration

By default, the application runs on port **3000**. To change:

```bash
PORT=8080 node .output/server/index.mjs
```

### Reverse Proxy (Nginx)

Example Nginx configuration:

```nginx
server {
    listen 80;
    server_name ensemble.yourcompany.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Monitoring & Logs

### Application Logs

In production, logs are written to `stdout`. Redirect to a file:

```bash
node .output/server/index.mjs > logs/app.log 2>&1
```

### Health Check Endpoint

The application exposes a health check at:

```
GET /api/health
```

Use this for load balancer health checks.

---

## Common Issues

### Issue: Server Shuts Down Immediately

**Cause:** Missing or invalid `DATABASE_URL`

**Solution:**
1. Verify `.env` file exists in project root
2. Check `DATABASE_URL` format: `postgresql://user:pass@host:port/db`
3. Test database connection manually

### Issue: SSO Users Not Registering

**Cause:** Session encryption not configured or database connection failed

**Solution:**
1. Set `SESSION_PASSWORD` (32+ chars) in `.env`
2. Verify database migrations are applied
3. Check database permissions for write access

### Issue: Static Assets Not Loading

**Cause:** Build artifacts not generated correctly

**Solution:**
```bash
rm -rf .output
pnpm run build
```

---

## Deployment Script (Production)

Create a `deploy.sh` script for automated deployments:

```bash
#!/bin/bash
set -e

echo "🚀 Starting Ensemble Platform Deployment..."

# Pull latest code
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile

# Run database migrations
echo "🗄️ Running database migrations..."
pnpm run db:push

# Build application
echo "🔨 Building application..."
pnpm run build

# Restart PM2 service
echo "♻️ Restarting application..."
pm2 restart ensemble-platform

echo "✅ Deployment complete!"
```

Make it executable:
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## Support

For additional help:
- Check application logs: `pm2 logs ensemble-platform`
- Review database connection: Ensure PostgreSQL is running and accessible
- Verify environment variables: Double-check `.env` file configuration
