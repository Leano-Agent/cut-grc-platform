# Database Backup and Recovery Procedures

## Overview

This document outlines the backup and recovery procedures for the CUT GRC Platform PostgreSQL database. These procedures ensure data integrity, availability, and compliance with data protection requirements.

## Backup Strategy

### 1. Backup Types

#### 1.1 Full Backups
- **Frequency**: Daily at 02:00 AM (off-peak hours)
- **Retention**: 30 days
- **Location**: On-premise storage + encrypted cloud storage
- **Method**: `pg_dump` with custom format

#### 1.2 Incremental Backups (WAL Archiving)
- **Frequency**: Continuous
- **Retention**: 7 days
- **Location**: Separate disk from database
- **Method**: Write-Ahead Log (WAL) archiving

#### 1.3 Transaction Log Backups
- **Frequency**: Every 15 minutes
- **Retention**: 24 hours
- **Location**: Local fast storage
- **Method`: Point-in-Time Recovery (PITR) logs

### 2. Backup Schedule

```
Monday - Friday:
  02:00 AM: Full backup
  00:00, 06:00, 12:00, 18:00: Transaction log backup
  
Saturday:
  02:00 AM: Full backup (weekly retention)
  00:00, 12:00: Transaction log backup
  
Sunday:
  02:00 AM: Full backup (monthly retention)
```

## Backup Procedures

### 1. Full Backup Script

Create `/opt/cut-grc/backup/backup-full.sh`:

```bash
#!/bin/bash

# Configuration
BACKUP_DIR="/opt/cut-grc/backup/full"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/cut_grc_full_$DATE.dump"
LOG_FILE="/var/log/cut-grc/backup-full.log"
RETENTION_DAYS=30

# Load environment
source /opt/cut-grc/.env

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Perform backup
echo "[$(date)] Starting full backup..." >> $LOG_FILE

pg_dump \
  -h $DB_HOST \
  -p $DB_PORT \
  -U $DB_USER \
  -d $DB_NAME \
  -F c \
  -v \
  -f $BACKUP_FILE 2>> $LOG_FILE

if [ $? -eq 0 ]; then
    echo "[$(date)] Backup completed: $BACKUP_FILE" >> $LOG_FILE
    
    # Compress backup
    gzip $BACKUP_FILE
    echo "[$(date)] Backup compressed: $BACKUP_FILE.gz" >> $LOG_FILE
    
    # Encrypt backup (optional)
    # openssl enc -aes-256-cbc -salt -in $BACKUP_FILE.gz -out $BACKUP_FILE.gz.enc -pass pass:$ENCRYPTION_KEY
    
    # Upload to cloud storage (example with AWS S3)
    # aws s3 cp $BACKUP_FILE.gz s3://cut-grc-backups/database/full/ --storage-class STANDARD_IA
    
    # Cleanup old backups
    find $BACKUP_DIR -name "*.dump.gz" -mtime +$RETENTION_DAYS -delete
    echo "[$(date)] Cleaned up backups older than $RETENTION_DAYS days" >> $LOG_FILE
else
    echo "[$(date)] Backup failed!" >> $LOG_FILE
    exit 1
fi
```

### 2. WAL Archiving Configuration

Add to `postgresql.conf`:

```ini
# WAL Archiving
wal_level = replica
archive_mode = on
archive_command = 'test ! -f /opt/cut-grc/backup/wal/%f && cp %p /opt/cut-grc/backup/wal/%f'
archive_timeout = 300
```

Create WAL archive script `/opt/cut-grc/backup/archive-wal.sh`:

```bash
#!/bin/bash

WAL_DIR="/opt/cut-grc/backup/wal"
RETENTION_DAYS=7

# Cleanup old WAL files
find $WAL_DIR -name "*.backup" -mtime +$RETENTION_DAYS -delete
find $WAL_DIR -name "*.[0-9A-F]*" -mtime +$RETENTION_DAYS -delete

# Sync to cloud storage
# aws s3 sync $WAL_DIR s3://cut-grc-backups/database/wal/ --delete
```

### 3. Automated Backup with Cron

Add to crontab (`crontab -e`):

```bash
# Full backups daily at 2 AM
0 2 * * * /opt/cut-grc/backup/backup-full.sh

# WAL cleanup daily at 3 AM
0 3 * * * /opt/cut-grc/backup/archive-wal.sh

# Transaction log backups every 15 minutes
*/15 * * * * /opt/cut-grc/backup/backup-transaction.sh
```

## Recovery Procedures

### 1. Recovery Scenarios

#### 1.1 Complete Database Recovery
**Use when**: Database server failure, data corruption

```bash
#!/bin/bash

# Stop PostgreSQL service
sudo systemctl stop postgresql

# Restore from latest full backup
LATEST_BACKUP=$(ls -t /opt/cut-grc/backup/full/*.dump.gz | head -1)

# Decompress
gunzip $LATEST_BACKUP
BACKUP_FILE=${LATEST_BACKUP%.gz}

# Drop and recreate database
psql -h localhost -U postgres -c "DROP DATABASE IF EXISTS cut_grc;"
psql -h localhost -U postgres -c "CREATE DATABASE cut_grc;"

# Restore
pg_restore \
  -h localhost \
  -U postgres \
  -d cut_grc \
  -v \
  $BACKUP_FILE

# Start PostgreSQL service
sudo systemctl start postgresql
```

#### 1.2 Point-in-Time Recovery (PITR)
**Use when**: Accidental data deletion, logical corruption

```bash
#!/bin/bash

# Stop PostgreSQL service
sudo systemctl stop postgresql

# Create recovery directory
mkdir -p /var/lib/postgresql/recovery

# Copy WAL files to recovery location
cp /opt/cut-grc/backup/wal/* /var/lib/postgresql/recovery/

# Create recovery.conf (PostgreSQL 12+ uses postgresql.auto.conf)
cat > /var/lib/postgresql/data/recovery.conf << EOF
restore_command = 'cp /var/lib/postgresql/recovery/%f %p'
recovery_target_time = '2024-01-15 14:30:00'
recovery_target_action = 'promote'
EOF

# Start PostgreSQL in recovery mode
sudo systemctl start postgresql

# Monitor recovery
tail -f /var/log/postgresql/postgresql-15-main.log
```

#### 1.3 Single Table Recovery
**Use when**: Specific table corruption or deletion

```bash
#!/bin/bash

# Extract single table from backup
TABLE_NAME="users"
BACKUP_FILE="/opt/cut-grc/backup/full/cut_grc_full_20240101_020000.dump"

# List tables in backup
pg_restore -l $BACKUP_FILE | grep "TABLE DATA public $TABLE_NAME"

# Extract and restore table
pg_restore \
  --table=$TABLE_NAME \
  --data-only \
  $BACKUP_FILE | \
psql -h localhost -U postgres -d cut_grc
```

### 2. Recovery Testing

#### 2.1 Monthly Recovery Test
```bash
#!/bin/bash
# recovery-test.sh

TEST_DB="cut_grc_test_$(date +%Y%m%d)"
BACKUP_FILE=$(ls -t /opt/cut-grc/backup/full/*.dump.gz | head -1)

echo "Starting recovery test for $TEST_DB"

# Create test database
createdb $TEST_DB

# Restore backup
gunzip -c $BACKUP_FILE | pg_restore -d $TEST_DB

# Verify data integrity
psql -d $TEST_DB -c "SELECT COUNT(*) FROM users;"
psql -d $TEST_DB -c "SELECT COUNT(*) FROM risks;"
psql -d $TEST_DB -c "SELECT COUNT(*) FROM compliance_requirements;"

# Cleanup
dropdb $TEST_DB

echo "Recovery test completed"
```

#### 2.2 Automated Recovery Testing Schedule
Add to crontab:
```bash
# First Sunday of every month at 4 AM
0 4 1-7 * 0 /opt/cut-grc/backup/recovery-test.sh
```

## Monitoring and Alerting

### 1. Backup Monitoring Script

Create `/opt/cut-grc/backup/monitor-backups.sh`:

```bash
#!/bin/bash

# Check if backups are running
BACKUP_AGE_HOURS=$(( ($(date +%s) - $(stat -c %Y /opt/cut-grc/backup/full/latest.dump)) / 3600 ))

if [ $BACKUP_AGE_HOURS -gt 26 ]; then
    echo "ALERT: No new backup in $BACKUP_AGE_HOURS hours" | \
    mail -s "CUT GRC Backup Alert" admin@cut.ac.za
fi

# Check backup size
BACKUP_SIZE=$(du -h /opt/cut-grc/backup/full/latest.dump | cut -f1)
MIN_SIZE="100M"

if [ "$(echo "$BACKUP_SIZE < $MIN_SIZE" | bc)" -eq 1 ]; then
    echo "ALERT: Backup size suspiciously small: $BACKUP_SIZE" | \
    mail -s "CUT GRC Backup Size Alert" admin@cut.ac.za
fi
```

### 2. Prometheus Metrics

Add to PostgreSQL configuration for monitoring:

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'postgres'
    static_configs:
      - targets: ['localhost:9187']
    
  - job_name: 'backup'
    static_configs:
      - targets: ['localhost:9090']
    metrics_path: '/backup-metrics'
```

## Disaster Recovery Plan

### 1. Recovery Time Objectives (RTO)
- **Critical systems**: 4 hours
- **Important systems**: 8 hours
- **Non-critical systems**: 24 hours

### 2. Recovery Point Objectives (RPO)
- **Critical data**: 15 minutes
- **Important data**: 1 hour
- **Historical data**: 24 hours

### 3. Disaster Recovery Sites
- **Primary**: CUT Data Center (Bloemfontein)
- **Secondary**: AWS Africa (Cape Town) Region
- **Tertiary**: Azure South Africa North Region

### 4. DR Activation Procedure

#### Step 1: Declare Disaster
- Notify DR team
- Activate DR plan
- Notify stakeholders

#### Step 2: Failover to DR Site
```bash
# Promote standby server
ssh dr-server "sudo pg_ctl promote -D /var/lib/postgresql/data"

# Update DNS records
aws route53 change-resource-record-sets \
  --hosted-zone-id ZONE_ID \
  --change-batch file://dns-update.json

# Verify application connectivity
curl -I https://grc.cut.ac.za/health
```

#### Step 3: Data Synchronization
```bash
# Setup replication from DR to primary when restored
pg_basebackup -h primary-server -D /var/lib/postgresql/data -U replicator -v -P
```

## Compliance Requirements

### 1. Data Protection (POPIA)
- Encrypt backups at rest and in transit
- Limit backup access to authorized personnel only
- Maintain audit trail of backup/restore activities
- Retain backups for minimum of 5 years for financial records

### 2. Audit Requirements
- Log all backup and restore operations
- Regular review of backup logs
- Quarterly testing of recovery procedures
- Annual DR drill with executive oversight

### 3. Documentation Updates
- Update this document quarterly
- Review after any system changes
- Maintain version history of procedures

## Appendices

### A. Backup Retention Policy

| Backup Type | Retention Period | Storage Location | Encryption Required |
|-------------|-----------------|------------------|---------------------|
| Daily Full | 30 days | On-premise + Cloud | Yes |
| Weekly Full | 90 days | Cloud (Standard) | Yes |
| Monthly Full | 1 year | Cloud (Glacier) | Yes |
| Transaction Logs | 7 days | On-premise | No |
| WAL Archives | 14 days | On-premise + Cloud | Yes |

### B. Contact Information

**Primary Backup Administrator**: 
- Name: IT Operations Team
- Email: it-ops@cut.ac.za
- Phone: +27 51 123 4567

**Secondary Backup Administrator**:
- Name: Database Administrator
- Email: dba@cut.ac.za
- Phone: +27 51 123 4568

**Emergency Contact**:
- Name: CUT IT Director
- Email: it-director@cut.ac.za
- Phone: +27 51 123 4569

### C. Change Log

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2024-01-15 | 1.0 | Initial document | Database Team |
| 2024-01-30 | 1.1 | Added recovery testing procedures | IT Operations |
| 2024-02-15 | 1.2 | Updated compliance requirements | Compliance Team |

---

**Last Updated**: 2024-01-15  
**Next Review**: 2024-04-15  
**Document Owner**: CUT IT Department