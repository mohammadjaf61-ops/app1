# Deployment Guide - Hypermarket Platform

## Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js | 20.x | LTS recommended |
| pnpm | 9.x | Package manager |
| PostgreSQL | 16+ | Primary database |
| Redis | 7+ | Cache and job queues |
| Docker | 24+ | For containerized deployment |
| Docker Compose | 2.x | For local development |

## First-Time Setup

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd hypermarket-platform

# Install pnpm if not already installed
npm install -g pnpm@9

# Install all dependencies
pnpm install
```

### 2. Start Infrastructure Services

```bash
# Start PostgreSQL, Redis, Meilisearch, MinIO
docker-compose up -d

# Verify services are healthy
docker-compose ps
```

Expected output:
```
NAME                      STATUS
hypermarket-postgres      healthy
hypermarket-redis         healthy
hypermarket-meilisearch   healthy
hypermarket-minio         healthy
```

### 3. Configure Environment

```bash
# API Backend
cp services/api/.env.example services/api/.env

# Admin Web
cp apps/admin-web/.env.example apps/admin-web/.env.local
```

**Required API Environment Variables:**

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db` |
| `REDIS_HOST` | Redis hostname | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `JWT_SECRET` | JWT signing key (min 32 chars) | Generate with `openssl rand -hex 32` |
| `JWT_REFRESH_SECRET` | Refresh token key (min 32 chars) | Generate with `openssl rand -hex 32` |

### 4. Initialize Database

```bash
# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# (Optional) Open Prisma Studio to inspect data
pnpm db:studio
```

### 5. Start Development Servers

```bash
# Start API (port 3000)
pnpm api:dev

# In another terminal - Start Admin Web (port 3001)
pnpm admin:dev
```

## Production Deployment

### Option A: Docker Deployment

#### Build API Image

```bash
cd services/api
docker build -t hypermarket-api:latest .
```

#### Run API Container

```bash
docker run -d \
  --name hypermarket-api \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL="postgresql://user:pass@db-host:5432/hypermarket" \
  -e REDIS_HOST=redis-host \
  -e REDIS_PORT=6379 \
  -e JWT_SECRET=<your-production-secret> \
  -e JWT_REFRESH_SECRET=<your-refresh-secret> \
  hypermarket-api:latest
```

#### Build Admin Web Image

```bash
cd apps/admin-web
docker build -t hypermarket-admin:latest .
```

### Option B: Manual Deployment

#### API Deployment

```bash
# Build
cd services/api
pnpm build

# Run in production
NODE_ENV=production node dist/main.js
```

#### Admin Web Deployment

```bash
# Build
cd apps/admin-web
pnpm build

# Start (using Next.js standalone output)
pnpm start
```

## Environment Configuration by Stage

### Development

```env
NODE_ENV=development
DATABASE_URL=postgresql://hypermarket:hypermarket_dev_password@localhost:5432/hypermarket_dev
REDIS_HOST=localhost
REDIS_PORT=6379
CORS_ORIGINS=http://localhost:3001,http://localhost:8081
```

### Staging

```env
NODE_ENV=staging
DATABASE_URL=postgresql://user:pass@staging-db:5432/hypermarket_staging
REDIS_HOST=staging-redis
REDIS_PORT=6379
CORS_ORIGINS=https://staging-admin.yourcompany.com
```

### Production

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@production-db:5432/hypermarket
REDIS_HOST=production-redis
REDIS_PORT=6379
REDIS_PASSWORD=<secure-password>
CORS_ORIGINS=https://admin.yourcompany.com
```

## Health Checks

### API Health Endpoint

```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "services": {
    "database": "healthy",
    "redis": "healthy"
  }
}
```

### Infrastructure Health Checks

| Service | Command | Expected |
|---------|---------|----------|
| PostgreSQL | `pg_isready -h localhost -p 5432` | `accepting connections` |
| Redis | `redis-cli ping` | `PONG` |
| API | `curl localhost:3000/api/health` | `{"status":"ok"}` |

## Database Management

### Run Migrations

```bash
# Development
pnpm db:migrate

# Production (via API container)
docker exec hypermarket-api npx prisma migrate deploy
```

### Rollback Migration

```bash
# Rollback last migration (development only)
npx prisma migrate reset
```

### Seed Data

```bash
# Development only
pnpm --filter @hypermarket/api prisma db seed
```

## Common Deployment Issues

### Issue: Database Connection Failed

**Symptoms:** API fails to start with `Can't reach database server`

**Solutions:**
1. Verify PostgreSQL is running: `docker-compose ps postgres`
2. Check DATABASE_URL format
3. Ensure database exists: `psql -c "SELECT 1" $DATABASE_URL`

### Issue: Redis Connection Failed

**Symptoms:** Caching/queues not working, `ECONNREFUSED` errors

**Solutions:**
1. Verify Redis is running: `docker-compose ps redis`
2. Check REDIS_HOST and REDIS_PORT
3. Test connection: `redis-cli -h localhost -p 6379 ping`

### Issue: Prisma Client Not Generated

**Symptoms:** `Error: Cannot find module '.prisma/client'`

**Solutions:**
1. Run: `pnpm db:generate`
2. For Docker: Ensure Prisma generate runs during build

### Issue: Port Already in Use

**Symptoms:** `EADDRINUSE: address already in use :::3000`

**Solutions:**
1. Find process: `lsof -i :3000`
2. Kill process: `kill -9 <PID>`
3. Or change PORT in .env

## Mobile Apps Deployment

### Customer Mobile (Expo)

```bash
cd apps/customer-mobile

# Development
npx expo start

# Build for production
npx eas build --platform all
```

### Picker/Driver Apps (React Native)

```bash
cd apps/picker-mobile  # or driver-mobile

# iOS
npx react-native run-ios --mode Release

# Android
npx react-native run-android --mode release
```

## Reverse Proxy Configuration (nginx)

```nginx
server {
    listen 80;
    server_name admin.yourcompany.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name admin.yourcompany.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Admin Web
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 443 ssl http2;
    server_name api.yourcompany.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # API Backend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $host;
    }
}
```

## Deployment Checklist

- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] JWT secrets are strong and unique per environment
- [ ] CORS origins match frontend domains
- [ ] Health checks passing
- [ ] SSL certificates configured (production)
- [ ] Logs being collected
- [ ] Backups configured
- [ ] Monitoring in place
