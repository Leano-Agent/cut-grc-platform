# CUT GRC Platform Testing Guide

## Overview

This document provides comprehensive guidance for testing the CUT GRC Platform. The testing strategy ensures high quality, reliability, and security of the enterprise GRC software.

## Testing Philosophy

- **Quality First:** All code must be tested before deployment
- **Automation:** Maximize test automation to ensure consistency
- **Security:** Security testing is integrated throughout the development lifecycle
- **Performance:** Performance testing for university-scale deployment
- **Accessibility:** WCAG 2.1 AA compliance for all users

## Test Architecture

### Test Pyramid
```
        E2E Tests (10%)
           /      \
          /        \
Integration Tests (20%)
          \        /
           \      /
        Unit Tests (70%)
```

### Test Types

1. **Unit Tests:** Test individual functions and components in isolation
2. **Integration Tests:** Test interactions between modules and external services
3. **E2E Tests:** Test complete user workflows from frontend to backend
4. **Performance Tests:** Test system performance under load
5. **Security Tests:** Test for vulnerabilities and security compliance
6. **Accessibility Tests:** Test for WCAG 2.1 AA compliance
7. **Regression Tests:** Ensure existing functionality continues to work

## Test Environment Setup

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- Docker (optional, for containerized testing)

### Quick Start
```bash
# Clone the repository
git clone https://github.com/cut-university/grc-platform.git
cd grc-platform

# Install dependencies
cd src/backend && npm install
cd ../frontend && npm install

# Setup test database
cd ../backend
npm run test:setup

# Run all tests
npm run test:all
```

### Test Database
- **Name:** `cut_grc_test`
- **User:** `postgres`
- **Password:** `postgres`
- **Host:** `localhost`
- **Port:** `5432`

### Test Configuration
Test-specific environment variables are stored in `.env.test`:
```bash
NODE_ENV=test
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cut_grc_test
DB_USER=postgres
DB_PASSWORD=postgres
REDIS_URL=redis://localhost:6379
JWT_SECRET=test-jwt-secret-32-chars-long-here-for-testing
```

## Running Tests

### Test Runner Script
Use the comprehensive test runner script:
```bash
# Make script executable
chmod +x scripts/test-runner.sh

# Run all tests
./scripts/test-runner.sh all

# Run specific test types
./scripts/test-runner.sh unit
./scripts/test-runner.sh integration
./scripts/test-runner.sh coverage
./scripts/test-runner.sh security
```

### NPM Scripts
```bash
# Unit tests
npm test
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage report

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Security tests
npm run test:security

# Performance tests
npm run test:performance

# All tests
npm run test:all
```

### CI/CD Integration
Tests automatically run on:
- Every push to `main` and `develop` branches
- Every pull request
- Daily at 2 AM UTC (scheduled)

## Test Coverage

### Coverage Targets
- **Overall Coverage:** ≥ 95%
- **Critical Modules:** 100%
- **Authentication:** 100%
- **User Management:** ≥ 95%
- **Risk Management:** ≥ 95%
- **Compliance Tracking:** ≥ 95%
- **Internal Controls:** ≥ 95%

### Coverage Reports
Coverage reports are generated in multiple formats:
- **HTML:** `coverage/index.html`
- **LCOV:** `coverage/lcov.info`
- **Text:** Console output
- **JSON:** `coverage/coverage-summary.json`

## Test Data Management

### Test Data Strategy
- **Isolation:** Each test runs with isolated data
- **Seeding:** Predefined test data for integration tests
- **Cleanup:** Automatic cleanup after tests
- **Fixtures:** Reusable test data fixtures

### Test Data Categories
1. **Authentication Data:** Test users, roles, permissions
2. **Risk Data:** Sample risks, assessments, treatments
3. **Compliance Data:** Frameworks, requirements, records
4. **Control Data:** Internal controls, tests, remediations
5. **Performance Data:** Large datasets for load testing

### Data Seeding
```bash
# Seed test database
npm run seed:test

# Clean test database
npm run clean:test
```

## Module-Specific Testing

### Authentication Module
**Test Files:**
- `tests/unit/auth.middleware.test.ts`
- `tests/unit/jwt.test.ts`
- `tests/integration/auth.integration.test.ts`

**Test Scenarios:**
- User registration and validation
- Login with correct/incorrect credentials
- Token generation and verification
- Password reset functionality
- Role-based access control
- Session management

### User Management Module
**Test Files:**
- `tests/unit/user.service.test.ts`
- `tests/integration/user.integration.test.ts`

**Test Scenarios:**
- User CRUD operations
- Profile management
- Role assignment
- Permission management
- User search and filtering
- Bulk operations

### Risk Management Module
**Test Files:**
- `tests/unit/risk.service.test.ts`
- `tests/integration/risk.integration.test.ts`

**Test Scenarios:**
- Risk identification and creation
- Risk assessment calculations
- Risk treatment planning
- Risk reporting and dashboards
- Risk categorization
- Risk monitoring

### Compliance Tracking Module
**Test Files:**
- `tests/unit/compliance.service.test.ts`
- `tests/integration/compliance.integration.test.ts`

**Test Scenarios:**
- Compliance framework management
- Requirement tracking
- Compliance record creation
- Audit trail verification
- Regulatory reporting
- Compliance dashboards

### Internal Controls Module
**Test Files:**
- `tests/unit/control.service.test.ts`
- `tests/integration/control.integration.test.ts`

**Test Scenarios:**
- Control design and creation
- Control testing procedures
- Deficiency identification
- Remediation tracking
- Control effectiveness assessment
- Control reporting

## Performance Testing

### Load Testing
**Tools:** Artillery, k6
**Scenarios:**
- Concurrent user simulation
- API endpoint load testing
- Database query performance
- Cache effectiveness
- Memory usage under load

### Stress Testing
**Objectives:**
- Identify breaking points
- Test auto-scaling
- Database connection limits
- Memory leak detection

### Performance Baselines
```yaml
api_response_time:
  p50: 100ms
  p95: 500ms
  p99: 1000ms

concurrent_users:
  normal: 100
  peak: 1000
  stress: 5000

database:
  query_time: < 50ms
  connections: < 80%
  cache_hit_rate: > 90%
```

## Security Testing

### OWASP Top 10 Coverage
1. **Broken Access Control:** Role-based testing
2. **Cryptographic Failures:** Encryption testing
3. **Injection:** SQL/NoSQL injection testing
4. **Insecure Design:** Security design review
5. **Security Misconfiguration:** Configuration testing
6. **Vulnerable Components:** Dependency scanning
7. **Authentication Failures:** Auth testing
8. **Software/Data Integrity:** Integrity checks
9. **Security Logging:** Log analysis
10. **Server-Side Request Forgery:** SSRF testing

### Security Tools
- **Dependency Scanning:** `npm audit`, Snyk
- **Static Analysis:** ESLint security rules
- **Dynamic Analysis:** OWASP ZAP
- **Penetration Testing:** Manual security testing

### Security Test Scenarios
- Authentication bypass attempts
- SQL injection attempts
- XSS vulnerability testing
- CSRF protection testing
- File upload security
- API security testing

## Accessibility Testing

### WCAG 2.1 AA Compliance
**Tools:** axe-core, Lighthouse
**Test Areas:**
1. **Perceivable:** Text alternatives, adaptable content
2. **Operable:** Keyboard accessibility, navigation
3. **Understandable:** Readable, predictable
4. **Robust:** Compatible with assistive technologies

### Accessibility Test Scenarios
- Screen reader compatibility
- Keyboard navigation
- Color contrast verification
- Form label associations
- ARIA attribute validation
- Focus management

## Regression Testing

### Regression Test Suites
1. **Authentication Regression:** All auth functionality
2. **User Management Regression:** User CRUD operations
3. **Risk Management Regression:** Risk workflows
4. **Compliance Regression:** Compliance tracking
5. **Controls Regression:** Internal controls
6. **API Regression:** All API endpoints
7. **Security Regression:** Security features
8. **Performance Regression:** Performance baselines

### Regression Triggers
- Code changes to specific modules
- Dependency updates
- Deployment to staging/production
- Scheduled runs (daily/weekly)

## Test Reporting

### Test Reports
1. **Unit Test Report:** Jest test results
2. **Coverage Report:** Code coverage analysis
3. **Integration Test Report:** API test results
4. **Performance Report:** Load test metrics
5. **Security Report:** Vulnerability assessment
6. **Accessibility Report:** WCAG compliance
7. **Regression Report:** Regression test results

### Report Formats
- **Console:** Real-time test output
- **HTML:** Detailed test reports
- **JSON:** Machine-readable results
- **JUnit XML:** CI/CD integration
- **PDF:** Formal test reports

### Metrics Tracking
- **Test Pass Rate:** Target: 98.8%
- **Code Coverage:** Target: 95.2%
- **Bug Escape Rate:** Target: < 5%
- **MTTR:** Mean Time To Resolution
- **MTTD:** Mean Time To Detection

## Bug Tracking

### Bug Severity Levels
1. **Critical:** System crash, data loss, security vulnerability
2. **High:** Major feature broken, significant performance issue
3. **Medium:** Minor feature issue, UI problem
4. **Low:** Cosmetic issue, enhancement request

### Bug Workflow
```
New → Triaged → Assigned → In Progress → Code Review → Testing → Passed → Ready for Deploy → Deployed → Verified → Closed
```

### Bug Assignment Rules
- Critical bugs: Assigned to development lead
- High bugs: Assigned to senior developers
- Medium bugs: Assigned to developers
- Low bugs: Assigned to junior developers

## Monitoring and Alerting

### Test Monitoring
- **Test Execution:** Monitor test runs and results
- **Performance Metrics:** Track response times and resource usage
- **Coverage Trends:** Monitor coverage changes over time
- **Bug Trends:** Track bug frequency and resolution time

### Alert Rules
- **Critical Test Failure:** Immediate notification
- **High Failure Rate:** >10% test failure rate
- **Coverage Drop:** >5% coverage decrease
- **Performance Degradation:** >50% response time increase
- **Security Vulnerability:** Critical/high vulnerabilities

### Alert Channels
- **Slack:** `#alerts-testing` channel
- **Email:** QA team and developers
- **PagerDuty:** Critical alerts
- **SMS:** Emergency notifications

## Best Practices

### Writing Tests
1. **AAA Pattern:** Arrange, Act, Assert
2. **Descriptive Names:** Clear test names indicating purpose
3. **Isolation:** Tests should not depend on each other
4. **Mocking:** Mock external dependencies appropriately
5. **Coverage:** Aim for meaningful coverage, not just line count

### Test Maintenance
1. **Regular Updates:** Update tests with code changes
2. **Refactoring:** Keep tests clean and maintainable
3. **Documentation:** Document test scenarios and assumptions
4. **Review:** Include tests in code reviews

### Performance Considerations
1. **Fast Execution:** Tests should run quickly
2. **Resource Efficiency:** Minimize resource usage
3. **Parallel Execution:** Design tests for parallel execution
4. **Cleanup:** Proper cleanup after tests

## Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check PostgreSQL is running
pg_isready -h localhost -p 5432 -U postgres

# Create test database if missing
createdb -U postgres cut_grc_test
```

#### Redis Connection Issues
```bash
# Check Redis is running
redis-cli ping

# Start Redis if needed
redis-server --daemonize yes
```

#### Test Timeout Issues
```bash
# Increase test timeout
jest --testTimeout=10000

# Run specific slow tests
jest --testNamePattern="slow test"
```

#### Coverage Issues
```bash
# Generate coverage report
npm run test:coverage

# Check uncovered lines
open coverage/lcov-report/index.html
```

### Debugging Tests
```bash
# Run tests with debug output
npm test -- --verbose

# Run specific test file
npm test -- tests/unit/auth.test.ts

# Run with Node.js debugger
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Continuous Improvement

### Test Metrics Review
- Weekly review of test metrics
- Monthly test strategy review
- Quarterly test process improvement

### Test Automation Enhancement
- Increase test automation coverage
- Improve test execution speed
- Enhance test reporting capabilities

### Training and Knowledge Sharing
- Regular test training sessions
- Test case review meetings
- Best practices documentation updates

## Support

### Getting Help
- **Slack:** `#testing` channel
- **Email:** `qa-support@cut.ac.za`
- **Documentation:** This guide and code comments
- **Code Review:** Peer review for test code

### Reporting Issues
1. Check existing issues in bug tracker
2. Create new bug report with detailed information
3. Include test case to reproduce the issue
4. Assign appropriate severity and category

### Contributing Tests
1. Follow test writing guidelines
2. Ensure adequate test coverage
3. Include integration tests for new features
4. Update existing tests as needed
5. Submit for code review

---

**Last Updated:** April 7, 2026  
**Version:** 1.0.0  
**Maintainer:** CUT GRC Quality Assurance Team