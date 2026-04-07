# CUT GRC Platform

Enterprise Governance, Risk, and Compliance software platform for Central University of Technology (CUT).

## Project Overview

**Client:** Central University of Technology (CUT)
**Project:** Comprehensive GRC Software Platform
**Timeline:** 6-9 months enterprise development
**Status:** Development Phase

## Key Features

1. **Enterprise Risk Management**
   - Risk identification and assessment
   - Risk monitoring and heat maps
   - Risk categorization and tagging

2. **Compliance Module**
   - Regulatory compliance tracking
   - Automated compliance checks
   - Compliance dashboards

3. **Internal Control Management**
   - Control automation
   - Deficiency notifications
   - Control testing and monitoring

4. **Integration Capabilities**
   - Live data tracking with CUT systems
   - External updates without login
   - API-first architecture

5. **Collaborative Platform**
   - Unified environment for risk, compliance, audit, legal functions
   - Real-time notifications and updates
   - Role-based access control

## Technology Stack

### Backend
- **Runtime:** Node.js 20 LTS
- **Framework:** Express.js with TypeScript
- **Database:** PostgreSQL 15+
- **Cache:** Redis 7+
- **Search:** Elasticsearch 8+
- **Real-time:** Socket.io

### Frontend
- **Framework:** React 18+ with TypeScript
- **State Management:** Redux Toolkit
- **UI Library:** Material-UI (MUI)
- **Build Tool:** Vite
- **Charts:** Recharts

### Infrastructure
- **Containerization:** Docker
- **Orchestration:** Kubernetes (AWS EKS)
- **CI/CD:** GitHub Actions
- **Monitoring:** Prometheus + Grafana
- **Logging:** ELK Stack

## Development Setup

### Prerequisites
- Node.js 20+
- Docker and Docker Compose
- PostgreSQL 15+
- Redis 7+

### Quick Start

1. **Clone the repository:**
   ```bash
   git clone https://github.com/cut-university/grc-platform.git
   cd grc-platform
   ```

2. **Set up backend:**
   ```bash
   cd src/backend
   cp .env.example .env
   # Edit .env with your configuration
   npm install
   npm run dev
   ```

3. **Set up frontend:**
   ```bash
   cd src/frontend
   cp .env.example .env.local
   # Edit .env.local with your configuration
   npm install
   npm run dev
   ```

4. **Start with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

### Development URLs
- **Backend API:** http://localhost:3000
- **Frontend App:** http://localhost:5173
- **API Documentation:** http://localhost:3000/api-docs
- **Database Admin:** http://localhost:8080 (pgAdmin)
- **Redis Admin:** http://localhost:8081 (RedisInsight)

## Project Structure

```
cut-grc-platform/
├── .github/           # GitHub Actions workflows
├── docs/              # Documentation
│   ├── architecture/  # Architecture designs
│   ├── requirements/  # Requirements documents
│   └── api/          # API documentation
├── src/
│   ├── backend/       # Node.js/Express backend
│   │   ├── src/
│   │   │   ├── config/       # Configuration files
│   │   │   ├── modules/      # Feature modules
│   │   │   ├── middleware/   # Express middleware
│   │   │   ├── utils/        # Utility functions
│   │   │   ├── validators/   # Request validators
│   │   │   └── types/        # TypeScript types
│   │   └── tests/           # Backend tests
│   ├── frontend/      # React frontend
│   │   ├── src/
│   │   │   ├── components/   # React components
│   │   │   ├── pages/        # Page components
│   │   │   ├── store/        # Redux store
│   │   │   ├── hooks/        # Custom hooks
│   │   │   ├── utils/        # Utility functions
│   │   │   └── types/        # TypeScript types
│   │   └── tests/           # Frontend tests
│   └── shared/        # Shared TypeScript definitions
├── scripts/           # Development scripts
├── deployment/        # Deployment configurations
├── docker/           # Docker configurations
└── tests/            # End-to-end tests
```

## Development Workflow

### Git Branch Strategy
- `main` - Production-ready code
- `develop` - Integration branch
- `feature/*` - Feature development
- `bugfix/*` - Bug fixes
- `release/*` - Release preparation

### Commit Convention
We follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test changes
- `chore:` Maintenance tasks

### Code Quality
- **Linting:** ESLint with TypeScript rules
- **Formatting:** Prettier
- **Type Checking:** TypeScript strict mode
- **Testing:** Jest for unit/integration tests
- **Coverage:** Minimum 80% test coverage

## API Documentation

The API follows RESTful principles and is documented using OpenAPI 3.0.

### Authentication
All API endpoints (except `/auth/*`) require JWT authentication.

```bash
# Login to get token
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@cut.ac.za", "password": "password"}'

# Use token in subsequent requests
curl -X GET http://localhost:3000/api/v1/risks \
  -H "Authorization: Bearer <token>"
```

### API Versioning
API versioning is done through URL path: `/api/v1/*`

## Testing

### Running Tests
```bash
# Backend tests
cd src/backend
npm test              # Unit tests
npm run test:coverage # Tests with coverage
npm run test:integration # Integration tests

# Frontend tests
cd src/frontend
npm test              # Unit tests
npm run test:coverage # Tests with coverage

# End-to-end tests
cd tests
npm test
```

### Test Structure
- **Unit Tests:** Test individual functions/components
- **Integration Tests:** Test API endpoints with database
- **End-to-End Tests:** Test complete user flows
- **Performance Tests:** Load and stress testing

## Deployment

### Environment Variables
Required environment variables are documented in `.env.example` files.

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d --build

# Production build
docker-compose -f docker-compose.prod.yml up -d
```

### Kubernetes Deployment
```bash
# Apply Kubernetes manifests
kubectl apply -f deployment/kubernetes/

# Monitor deployment
kubectl get pods
kubectl get services
```

## Monitoring & Logging

### Application Monitoring
- **Metrics:** Prometheus metrics endpoint
- **Health Checks:** `/health` endpoint
- **Performance:** APM with Elastic APM

### Logging
- **Structured Logging:** JSON format for machine parsing
- **Log Levels:** error, warn, info, debug
- **Log Storage:** Elasticsearch for search and analysis

### Alerting
- **Critical Alerts:** PagerDuty integration
- **Non-critical:** Slack/Teams notifications
- **Dashboard:** Grafana dashboards

## Security

### Data Protection
- **Encryption:** AES-256 for data at rest
- **TLS:** HTTPS for all communications
- **Key Management:** AWS KMS or HashiCorp Vault

### Access Control
- **RBAC:** Role-based access control
- **JWT:** Stateless authentication
- **MFA:** Multi-factor authentication support

### Security Scanning
- **SAST:** Static application security testing
- **DAST:** Dynamic application security testing
- **Dependency Scanning:** Regular vulnerability checks

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for your changes
5. Ensure all tests pass
6. Submit a pull request

## License

This project is proprietary software developed for Central University of Technology (CUT).

## Support

For technical support or questions:
- **Development Team:** dev-team@cut.ac.za
- **Documentation:** [Internal Wiki](https://wiki.cut.ac.za/grc-platform)
- **Issue Tracking:** [GitHub Issues](https://github.com/cut-university/grc-platform/issues)

---

**Last Updated:** March 2024
**Version:** 1.0.0-alpha