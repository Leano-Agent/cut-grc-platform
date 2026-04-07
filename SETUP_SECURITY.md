# Security Setup Instructions for GRC Project

## Prerequisites

1. Node.js 20+ installed
2. Redis server running (for token blacklisting and rate limiting)
3. PostgreSQL database (for user data)
4. Environment variables configured

## Installation Steps

### 1. Install Dependencies

```bash
cd src/backend
npm install
```

### 2. Configure Environment Variables

Copy the example environment file and update the values:

```bash
cp ../../.env.example .env
```

Edit the `.env` file with your configuration:

```env
# Application
NODE_ENV=development
PORT=3000

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
REDIS_PASSWORD=  # Optional

# JWT Secrets (generate strong secrets)
JWT_SECRET=your_32_character_long_jwt_secret_key_here_change
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your_32_character_long_refresh_secret_key_here
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173

# Other configurations as needed
```

### 3. Generate Strong JWT Secrets

Generate secure JWT secrets:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using openssl
openssl rand -hex 32
```

### 4. Set Up Redis

Install and start Redis:

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server

# macOS with Homebrew
brew install redis
brew services start redis

# Verify Redis is running
redis-cli ping
# Should respond with: PONG
```

### 5. Set Up PostgreSQL

Install and configure PostgreSQL:

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql
CREATE DATABASE cut_grc;
CREATE USER cut_grc_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE cut_grc TO cut_grc_user;
\q
```

### 6. Build and Run the Application

```bash
# Build TypeScript
npm run build

# Run in development mode
npm run dev

# Run in production mode
npm start
```

## Security Verification

### 1. Test Security Implementation

```bash
# Run security tests
npx ts-node src/security-test.ts
```

### 2. Verify Security Headers

```bash
# Check security headers
curl -I http://localhost:3000/health

# Expected headers:
# Content-Security-Policy: default-src 'self'; ...
# Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
# Referrer-Policy: strict-origin-when-cross-origin
```

### 3. Test Authentication Endpoints

```bash
# Test registration
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "firstName": "Test",
    "lastName": "User",
    "role": "student"
  }'

# Test login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'

# Test rate limiting (make 101 requests quickly)
for i in {1..101}; do
  curl -X GET http://localhost:3000/health
done
# Should get rate limit error after 100 requests
```

## Production Deployment Checklist

### 1. Security Configuration

- [ ] Set `NODE_ENV=production`
- [ ] Use strong, randomly generated JWT secrets
- [ ] Enable database SSL (`DB_SSL=true`)
- [ ] Set secure CORS origins (not `*`)
- [ ] Configure Redis with authentication
- [ ] Set up HTTPS with valid SSL certificate

### 2. Infrastructure Security

- [ ] Configure firewall rules
- [ ] Set up DDoS protection
- [ ] Implement Web Application Firewall (WAF)
- [ ] Enable logging and monitoring
- [ ] Set up regular backups

### 3. Application Security

- [ ] Run security dependency scan (`npm audit`)
- [ ] Implement CI/CD security scanning
- [ ] Set up secret management (not hardcoded secrets)
- [ ] Configure proper file permissions

### 4. Monitoring and Maintenance

- [ ] Set up security event alerts
- [ ] Monitor failed login attempts
- [ ] Track rate limit violations
- [ ] Regular security updates and patches
- [ ] Schedule penetration tests

## Troubleshooting

### Common Issues

1. **Redis Connection Failed**
   - Check if Redis is running: `redis-cli ping`
   - Verify host and port in environment variables
   - Check firewall settings

2. **Database Connection Failed**
   - Verify PostgreSQL is running
   - Check database credentials
   - Ensure database exists and user has permissions

3. **JWT Verification Failed**
   - Check JWT secret matches between restarts
   - Verify token expiration
   - Check token format and signature

4. **CORS Errors**
   - Verify CORS origin matches frontend URL
   - Check for trailing slashes in URLs
   - Ensure credentials are properly configured

### Security Testing Tools

```bash
# Check for vulnerable dependencies
npm audit

# Run security headers check
npx check-security-headers https://your-domain.com

# Test for common vulnerabilities
npx snyk test
```

## Support

For security-related issues or questions:
1. Review the security audit report: `SECURITY_AUDIT_REPORT.md`
2. Check the implementation in `src/backend/src/middleware/`
3. Test with the security test script: `src/backend/src/security-test.ts`

## Emergency Response

If you suspect a security breach:

1. **Immediate Actions:**
   - Rotate all JWT secrets
   - Reset all user passwords
   - Review security logs
   - Check for unauthorized access

2. **Investigation:**
   - Preserve logs and evidence
   - Identify attack vector
   - Assess impact

3. **Remediation:**
   - Apply security patches
   - Update security configurations
   - Implement additional protections

4. **Communication:**
   - Notify affected users if required
   - Document the incident
   - Update security procedures