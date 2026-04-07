# CUT GRC Platform Database Setup

## Overview

This directory contains the complete database setup for the CUT GRC Platform, including schema definitions, migrations, seed data, and maintenance procedures.

## Structure

```
database/
├── migrations/           # Database migration files
│   ├── 001-initial-schema.sql    # Main schema with RLS policies
│   └── run-migrations.ts         # TypeScript migration runner
├── seeds/               # Seed data for development
│   └── seed-dev.ts              # Development seed data
├── DATABASE.md          # Comprehensive database documentation
├── backup-recovery.md   # Backup and recovery procedures
└── README.md           # This file
```

## Database Schema

The database schema includes the following main tables:

### Core Tables
1. **users** - User accounts with roles (admin, risk_manager, compliance_officer, auditor, viewer)
2. **risks** - Risk register with assessment, treatment, and monitoring
3. **compliance_requirements** - Compliance requirements from regulations and standards
4. **internal_controls** - Internal controls for risk mitigation
5. **audit_logs** - Security audit trail

### Supporting Tables
6. **compliance_evidence** - Evidence supporting compliance requirements
7. **risk_treatment_actions** - Actions to treat identified risks
8. **control_testing_results** - Results of control testing
9. **notifications** - User notifications and reminders

## Key Features

### 1. Row Level Security (RLS)
- All tables have RLS enabled
- Policies based on user roles and departments
- Secure data access control

### 2. Automatic Features
- Generated risk levels based on likelihood/impact matrix
- Automatic risk code generation (RISK-YYYY-NNNN)
- Audit trail triggers for all CRUD operations
- Automatic timestamp updates

### 3. Performance Optimizations
- Comprehensive indexing strategy
- Materialized views for reporting
- Connection pooling configuration
- Query optimization recommendations

## Setup Instructions

### 1. Prerequisites
- PostgreSQL 15+
- Node.js 20+
- Redis 7+ (for caching and sessions)

### 2. Environment Configuration
Create `.env` file in the backend root:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cut_grc
DB_USER=postgres
DB_PASSWORD=your_password
DB_SSL=false

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Application
NODE_ENV=development
PORT=3000
JWT_SECRET=your_jwt_secret_min_32_chars
```

### 3. Database Setup

#### Option A: Using Migration Runner
```bash
# Run migrations
npm run migrate:up

# Rollback last migration
npm run migrate:down

# Reset all migrations
npm run migrate:reset

# Check migration status
npm run migrate:status
```

#### Option B: Manual SQL Execution
```bash
# Apply initial schema
psql -h localhost -U postgres -d cut_grc -f src/database/migrations/001-initial-schema.sql
```

### 4. Seed Development Data
```bash
npm run seed:dev
```

Default login credentials after seeding:
- Admin: `admin@cut.ac.za` / `Admin123!`
- Risk Manager: `risk.manager@cut.ac.za` / `Risk123!`
- Compliance Officer: `compliance@cut.ac.za` / `Compliance123!`
- Auditor: `auditor@cut.ac.za` / `Audit123!`
- Viewer: `finance.viewer@cut.ac.za` / `Viewer123!`

## Health Checks

The system includes comprehensive health monitoring:

### Endpoints
- `GET /health` - Basic health check
- `GET /health/comprehensive` - Full health check with dependencies
- `GET /health/database` - Database-specific health
- `GET /health/redis` - Redis-specific health
- `GET /health/ready` - Readiness probe (Kubernetes)
- `GET /health/alive` - Liveness probe (Kubernetes)
- `GET /health/metrics` - System metrics
- `GET /health/version` - Version information

## Backup and Recovery

### Automated Backups
- Daily full backups at 02:00 AM
- Continuous WAL archiving
- 15-minute transaction log backups
- 30-day retention for daily backups

### Recovery Procedures
1. **Complete Recovery**: Full database restore
2. **Point-in-Time Recovery**: Restore to specific timestamp
3. **Single Table Recovery**: Restore individual tables
4. **Monthly Recovery Testing**: Automated test procedures

See `backup-recovery.md` for detailed procedures.

## Maintenance

### Daily
- Automatic statistics updates
- Dead tuple monitoring

### Weekly
- Vacuum operations
- Index usage analysis

### Monthly
- Index rebuilding
- Unused index identification
- Recovery testing

## Security Considerations

### Authentication
- Password hashing with bcrypt
- Account lockout after failed attempts
- JWT token authentication

### Authorization
- Role-based access control (RBAC)
- Department-based data segregation
- Row-level security policies

### Data Protection
- Encryption recommendations for sensitive data
- SSL/TLS for data in transit
- Regular security patches

## Monitoring and Alerting

### Database Monitoring
- Connection pool statistics
- Query performance monitoring
- Deadlock detection
- Table bloat monitoring

### Alerting
- Backup failure alerts
- High connection usage
- Slow query alerts
- Disk space warnings

## Compliance

### POPIA Compliance
- Data encryption at rest and in transit
- Access control and audit trails
- Data retention policies
- Regular security assessments

### Audit Requirements
- Complete audit trail for all changes
- Regular backup testing
- Security incident logging
- Compliance reporting

## Troubleshooting

### Common Issues

1. **Connection Issues**
   ```bash
   # Check PostgreSQL service
   sudo systemctl status postgresql
   
   # Test connection
   psql -h localhost -U postgres -d cut_grc
   ```

2. **Migration Issues**
   ```bash
   # Check migration status
   npm run migrate:status
   
   # Reset and reapply
   npm run migrate:reset
   npm run migrate:up
   ```

3. **Performance Issues**
   ```sql
   -- Check slow queries
   SELECT query, calls, total_time, mean_time
   FROM pg_stat_statements
   ORDER BY mean_time DESC
   LIMIT 10;
   ```

### Support
For database-related issues, contact:
- Primary: Database Administrator (dba@cut.ac.za)
- Secondary: IT Operations (it-ops@cut.ac.za)

## Version History

| Date       | Version | Changes                    |
|------------|---------|----------------------------|
| 2024-01-15 | 1.0     | Initial database setup     |
| 2024-01-15 | 1.1     | Added RLS policies         |
| 2024-01-15 | 1.2     | Added backup procedures    |
| 2024-01-15 | 1.3     | Added health monitoring    |

---

**Last Updated**: 2024-01-15  
**Next Review**: 2024-04-15  
**Document Owner**: CUT IT Department