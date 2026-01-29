# Backup & Recovery Guide - Hypermarket Platform

This guide covers backup procedures, retention policies, and disaster recovery for the Hypermarket Platform.

## Table of Contents

1. [Backup Strategy Overview](#backup-strategy-overview)
2. [Database Backups](#database-backups)
3. [Redis Backups](#redis-backups)
4. [File Storage Backups](#file-storage-backups)
5. [Recovery Procedures](#recovery-procedures)
6. [Disaster Recovery Plan](#disaster-recovery-plan)
7. [Testing & Verification](#testing--verification)

---

## Backup Strategy Overview

### What Gets Backed Up

| Component | Data | Frequency | Retention |
|-----------|------|-----------|-----------|
| PostgreSQL | All tables, sequences, indexes | Daily + before major changes | 30 days |
| Redis | Queues (AOF) | Continuous | 7 days |
| MinIO/S3 | Product images, uploads | Daily | 90 days |
| Configuration | .env files (encrypted) | On change | Indefinite |

### Backup Schedule

| Time | Action |
|------|--------|
| 02:00 | Daily database backup |
| 03:00 | Daily file storage sync |
| Continuous | Redis AOF persistence |
| Before deploy | Pre-deployment snapshot |

---

## Database Backups

### Manual Backup

```bash
# Full database dump
pg_dump -h localhost -U hypermarket -d hypermarket_dev \
  --format=custom \
  --file=backup_$(date +%Y%m%d_%H%M%S).dump

# Schema only (for reference)
pg_dump -h localhost -U hypermarket -d hypermarket_dev \
  --schema-only \
  --file=schema_$(date +%Y%m%d).sql

# Specific tables
pg_dump -h localhost -U hypermarket -d hypermarket_dev \
  -t "order" -t "order_item" \
  --format=custom \
  --file=orders_backup.dump
```

### Automated Backup Script

Create `/opt/backup/backup-db.sh`:

```bash
#!/bin/bash
set -e

# Configuration
BACKUP_DIR="/opt/backups/postgres"
RETENTION_DAYS=30
DB_HOST="localhost"
DB_USER="hypermarket"
DB_NAME="hypermarket_dev"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Perform backup
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.dump"
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME \
  --format=custom \
  --file=$BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Remove old backups
find $BACKUP_DIR -name "*.dump.gz" -mtime +$RETENTION_DAYS -delete

# Log success
echo "$(date): Backup completed: $BACKUP_FILE.gz"
```

Add to crontab:
```bash
# Daily at 2 AM
0 2 * * * /opt/backup/backup-db.sh >> /var/log/backup.log 2>&1
```

### Pre-Deployment Backup

Always backup before major deployments:

```bash
# Quick pre-deployment backup
pg_dump -h localhost -U hypermarket -d hypermarket_dev \
  --format=custom \
  --file=pre_deploy_$(date +%Y%m%d_%H%M%S).dump

# Verify backup
pg_restore --list pre_deploy_*.dump | head -20
```

---

## Redis Backups

### AOF Persistence

Redis is configured with AOF (Append Only File) persistence by default in `docker-compose.yml`:

```yaml
redis:
  command: redis-server --appendonly yes
  volumes:
    - redis_data:/data
```

### Manual Redis Backup

```bash
# Trigger background save
redis-cli BGSAVE

# Check save status
redis-cli LASTSAVE

# Copy RDB file
docker cp hypermarket-redis:/data/dump.rdb ./redis_backup_$(date +%Y%m%d).rdb
```

### Backup Script for Redis

```bash
#!/bin/bash
BACKUP_DIR="/opt/backups/redis"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Trigger save
redis-cli BGSAVE
sleep 5

# Copy files
docker cp hypermarket-redis:/data/dump.rdb $BACKUP_DIR/dump_$DATE.rdb
docker cp hypermarket-redis:/data/appendonly.aof $BACKUP_DIR/appendonly_$DATE.aof 2>/dev/null || true

# Compress
gzip $BACKUP_DIR/*_$DATE.*

# Cleanup old backups (7 days)
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete
```

---

## File Storage Backups

### MinIO/S3 Sync

```bash
# Using mc (MinIO Client)
mc alias set local http://localhost:9000 hypermarket hypermarket_minio_password

# Backup entire bucket
mc mirror local/hypermarket /opt/backups/minio/hypermarket_$(date +%Y%m%d)

# Sync to remote S3 (for disaster recovery)
mc mirror local/hypermarket s3/hypermarket-backup
```

### Backup Script for MinIO

```bash
#!/bin/bash
BACKUP_DIR="/opt/backups/minio"
DATE=$(date +%Y%m%d)

mkdir -p $BACKUP_DIR

# Mirror bucket
mc mirror --overwrite \
  local/hypermarket \
  $BACKUP_DIR/hypermarket_$DATE

# Remove backups older than 90 days
find $BACKUP_DIR -type d -name "hypermarket_*" -mtime +90 -exec rm -rf {} +
```

---

## Recovery Procedures

### Database Recovery

#### Full Database Restore

```bash
# 1. Stop the API to prevent writes
docker stop hypermarket-api

# 2. Drop and recreate database (if needed)
psql -h localhost -U postgres -c "DROP DATABASE IF EXISTS hypermarket_dev"
psql -h localhost -U postgres -c "CREATE DATABASE hypermarket_dev OWNER hypermarket"

# 3. Restore from backup
pg_restore -h localhost -U hypermarket -d hypermarket_dev \
  --no-owner --no-privileges \
  /opt/backups/postgres/backup_20240115.dump

# 4. Verify restoration
psql -h localhost -U hypermarket -d hypermarket_dev -c "SELECT COUNT(*) FROM \"order\""

# 5. Restart API
docker start hypermarket-api
```

#### Point-in-Time Recovery (PITR)

If using WAL archiving for PITR:

```bash
# 1. Stop PostgreSQL
docker stop hypermarket-postgres

# 2. Restore base backup
cp -r /opt/backups/postgres/base/* /var/lib/postgresql/data/

# 3. Create recovery.conf
cat > /var/lib/postgresql/data/recovery.conf << EOF
restore_command = 'cp /opt/backups/postgres/wal/%f %p'
recovery_target_time = '2024-01-15 14:30:00'
EOF

# 4. Start PostgreSQL (recovery mode)
docker start hypermarket-postgres

# 5. Verify and promote
psql -c "SELECT pg_is_in_recovery()"  # Should return 't'
psql -c "SELECT pg_promote()"          # Promote to primary
```

#### Restore Specific Tables

```bash
# Restore only orders table
pg_restore -h localhost -U hypermarket -d hypermarket_dev \
  --table=order \
  --data-only \
  backup_20240115.dump
```

### Redis Recovery

```bash
# 1. Stop Redis
docker stop hypermarket-redis

# 2. Replace data files
docker cp redis_backup_20240115.rdb hypermarket-redis:/data/dump.rdb

# 3. Start Redis
docker start hypermarket-redis

# 4. Verify
redis-cli DBSIZE
```

### MinIO/S3 Recovery

```bash
# Restore from backup
mc mirror /opt/backups/minio/hypermarket_20240115 local/hypermarket

# Verify
mc ls local/hypermarket
```

---

## Disaster Recovery Plan

### Recovery Time Objectives (RTO)

| Scenario | Target RTO | Procedure |
|----------|------------|-----------|
| Database corruption | < 1 hour | Restore from latest backup |
| Complete server failure | < 4 hours | Rebuild from backups |
| Data center outage | < 8 hours | Restore to DR site |

### Recovery Point Objectives (RPO)

| Component | Target RPO | Method |
|-----------|------------|--------|
| Database | < 1 hour | Hourly backups + WAL |
| Redis queues | < 5 minutes | AOF persistence |
| File storage | < 24 hours | Daily sync |

### Disaster Recovery Steps

#### Step 1: Assess the Situation

```bash
# Check what's available
ls -la /opt/backups/postgres/
ls -la /opt/backups/redis/
ls -la /opt/backups/minio/
```

#### Step 2: Provision New Infrastructure

```bash
# Start fresh containers
docker-compose down -v
docker-compose up -d postgres redis minio

# Wait for healthy status
docker-compose ps
```

#### Step 3: Restore Data

```bash
# 1. Restore database
pg_restore -h localhost -U hypermarket -d hypermarket_dev latest.dump

# 2. Restore Redis
docker cp latest_dump.rdb hypermarket-redis:/data/dump.rdb
docker restart hypermarket-redis

# 3. Restore files
mc mirror /opt/backups/minio/latest local/hypermarket
```

#### Step 4: Verify and Resume

```bash
# Run health checks
curl http://localhost:3000/api/health

# Verify data integrity
psql -c "SELECT COUNT(*) FROM \"order\""
redis-cli DBSIZE

# Start applications
docker start hypermarket-api
```

---

## Testing & Verification

### Monthly Backup Test Procedure

1. **Create test environment**
   ```bash
   docker-compose -f docker-compose.test.yml up -d
   ```

2. **Restore latest backup**
   ```bash
   pg_restore -h localhost -p 5433 -U hypermarket -d hypermarket_test latest.dump
   ```

3. **Verify data integrity**
   ```bash
   psql -p 5433 -c "SELECT COUNT(*) FROM \"order\""
   psql -p 5433 -c "SELECT COUNT(*) FROM product"
   psql -p 5433 -c "SELECT COUNT(*) FROM \"user\""
   ```

4. **Run application tests**
   ```bash
   DATABASE_URL=postgresql://...:5433/... pnpm test
   ```

5. **Document results**
   - Backup file: `backup_20240115.dump`
   - Restore time: X minutes
   - Data verification: PASS/FAIL
   - Application tests: PASS/FAIL

### Backup Verification Checklist

- [ ] Database backup completed successfully
- [ ] Backup file is not corrupted (`pg_restore --list`)
- [ ] Backup size is reasonable (compared to previous)
- [ ] Restore test passed on test environment
- [ ] All tables present with expected row counts
- [ ] Redis backup includes queue data
- [ ] File storage backup includes all buckets
- [ ] Backup rotation working (old backups removed)

### Backup Health Monitoring

```bash
#!/bin/bash
# Check backup health

# Database backup age
DB_BACKUP=$(ls -t /opt/backups/postgres/*.dump.gz | head -1)
DB_AGE=$(( ( $(date +%s) - $(stat -c %Y "$DB_BACKUP") ) / 3600 ))

if [ $DB_AGE -gt 24 ]; then
  echo "WARNING: Database backup is $DB_AGE hours old"
fi

# Check backup size
DB_SIZE=$(stat -c %s "$DB_BACKUP")
if [ $DB_SIZE -lt 1000000 ]; then
  echo "WARNING: Database backup seems too small: $DB_SIZE bytes"
fi

# Redis backup age
REDIS_BACKUP=$(ls -t /opt/backups/redis/*.rdb.gz | head -1)
REDIS_AGE=$(( ( $(date +%s) - $(stat -c %Y "$REDIS_BACKUP") ) / 3600 ))

if [ $REDIS_AGE -gt 168 ]; then  # 7 days
  echo "WARNING: Redis backup is $REDIS_AGE hours old"
fi

echo "Backup health check completed"
```

---

## Quick Reference

### Essential Commands

```bash
# Database backup
pg_dump -Fc -f backup.dump hypermarket_dev

# Database restore
pg_restore -d hypermarket_dev backup.dump

# Redis backup
redis-cli BGSAVE

# Redis restore
cp dump.rdb /data/dump.rdb && redis-cli DEBUG RELOAD

# MinIO backup
mc mirror local/hypermarket ./backup/

# MinIO restore
mc mirror ./backup/ local/hypermarket
```

### Backup Locations

| Component | Default Location | Format |
|-----------|-----------------|--------|
| PostgreSQL | `/opt/backups/postgres/` | `.dump.gz` |
| Redis | `/opt/backups/redis/` | `.rdb.gz` |
| MinIO | `/opt/backups/minio/` | Directory |
| Logs | `/var/log/backup.log` | Text |
