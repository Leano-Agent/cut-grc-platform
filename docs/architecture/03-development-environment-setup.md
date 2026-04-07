# Development Environment Setup - CUT GRC Platform

## 1. Prerequisites

### 1.1 System Requirements
- **Operating System:** Ubuntu 22.04 LTS (recommended) or macOS 12+
- **RAM:** 16GB minimum (32GB recommended)
- **Storage:** 50GB free space
- **CPU:** 4 cores minimum (8 cores recommended)

### 1.2 Required Software
- **Node.js:** v20.12.0 LTS
- **Python:** v3.11+ (for some tools)
- **Docker:** v24.0+
- **Docker Compose:** v2.20+
- **Git:** v2.40+
- **PostgreSQL Client:** psql 15+
- **Redis CLI:** redis-cli 7+

## 2. Repository Setup

### 2.1 Clone Repository
```bash
# Create project directory
mkdir -p ~/projects/cut-grc
cd ~/projects/cut-grc

# Clone repository (example URL)
git clone https://github.com/cut-university/grc-platform.git
cd grc-platform
```

### 2.2 Repository Structure
```
cut-grc-platform/
├── .github/           # GitHub Actions workflows
├── docs/              # Documentation
├── src/
│   ├── backend/       # Node.js/Express backend
│   ├── frontend/      # React frontend
│   └── shared/        # Shared TypeScript definitions
├── scripts/           # Development scripts
├── deployment/        # Deployment configurations
├── docker/           # Docker configurations
└── tests/            # Test suites
```

## 3. Backend Development Setup

### 3.1 Node.js Environment
```bash
# Install Node Version Manager (nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Restart shell or source nvm
source ~/.bashrc

# Install Node.js 20 LTS
nvm install 20
nvm use 20
nvm alias default 20

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

### 3.2 Backend Dependencies
```bash
cd src/backend

# Install dependencies
npm install

# Install global tools (optional but recommended)
npm install -g typescript ts-node nodemon eslint prettier

# Verify TypeScript installation
npx tsc --version
```

### 3.3 Backend Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

**Required Environment Variables:**
```env
# Application
NODE_ENV=development
PORT=3000
API_VERSION=v1

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cut_grc_dev
DB_USER=cut_grc_user
DB_PASSWORD=secure_password_here

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGIN=http://localhost:5173
```

## 4. Frontend Development Setup

### 4.1 Frontend Dependencies
```bash
cd src/frontend

# Install dependencies
npm install

# Install global tools
npm install -g vite

# Verify installation
npx vite --version
```

### 4.2 Frontend Configuration
```bash
# Copy environment template
cp .env.example .env.local

# Edit environment variables
nano .env.local
```

**Required Environment Variables:**
```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_APP_NAME=CUT GRC Platform
VITE_APP_VERSION=1.0.0

# Feature Flags
VITE_ENABLE_DEBUG=true
VITE_ENABLE_MOCK_API=false
```

## 5. Database Setup

### 5.1 PostgreSQL with Docker
```bash
# Start PostgreSQL container
docker run -d \
  --name cut-grc-postgres \
  -e POSTGRES_DB=cut_grc_dev \
  -e POSTGRES_USER=cut_grc_user \
  -e POSTGRES_PASSWORD=secure_password_here \
  -p 5432:5432 \
  -v cut-grc-postgres-data:/var/lib/postgresql/data \
  postgres:15-alpine

# Verify connection
docker exec -it cut-grc-postgres psql -U cut_grc_user -d cut_grc_dev
```

### 5.2 Database Migrations
```bash
cd src/backend

# Run migrations
npm run migrate:up

# Seed development data
npm run seed:dev
```

## 6. Redis Setup

### 6.1 Redis with Docker
```bash
# Start Redis container
docker run -d \
  --name cut-grc-redis \
  -p 6379:6379 \
  -v cut-grc-redis-data:/data \
  redis:7-alpine \
  redis-server --appendonly yes

# Verify connection
docker exec -it cut-grc-redis redis-cli ping
```

## 7. Docker Compose Development Environment

### 7.1 docker-compose.yml
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: cut-grc-postgres
    environment:
      POSTGRES_DB: cut_grc_dev
      POSTGRES_USER: cut_grc_user
      POSTGRES_PASSWORD: ${DB_PASSWORD:-dev_password}
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U cut_grc_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: cut-grc-redis
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./src/backend
      dockerfile: Dockerfile.dev
    container_name: cut-grc-backend
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      NODE_ENV: development
      DB_HOST: postgres
      REDIS_HOST: redis
    ports:
      - "3000:3000"
    volumes:
      - ./src/backend:/app
      - /app/node_modules
    command: npm run dev

  frontend:
    build:
      context: ./src/frontend
      dockerfile: Dockerfile.dev
    container_name: cut-grc-frontend
    ports:
      - "5173:5173"
    volumes:
      - ./src/frontend:/app
      - /app/node_modules
    environment:
      - CHOKIDAR_USEPOLLING=true
    command: npm run dev

volumes:
  postgres-data:
  redis-data:
```

### 7.2 Start Development Environment
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 8. IDE Configuration

### 8.1 VS Code Recommended Extensions
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "christian-kohler.npm-intellisense",
    "ms-azuretools.vscode-docker",
    "postman.postman-for-vscode",
    "firsttris.vscode-jest-runner",
    "ms-vscode.vscode-jest-debugger"
  ]
}
```

### 8.2 VS Code Settings
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "javascript.preferences.importModuleSpecifier": "relative",
  "files.exclude": {
    "**/.git": true,
    "**/.svn": true,
    "**/.hg": true,
    "**/CVS": true,
    "**/.DS_Store": true,
    "**/node_modules": true
  }
}
```

## 9. Development Workflow

### 9.1 Git Workflow
```bash
# Create feature branch
git checkout -b feature/risk-management-module

# Make changes and commit
git add .
git commit -m "feat: add risk assessment functionality"

# Push to remote
git push origin feature/risk-management-module

# Create Pull Request on GitHub
```

### 9.2 Code Quality Tools
```bash
# Lint code
npm run lint

# Format code
npm run format

# Type checking
npm run type-check

# Run tests
npm test

# Run all checks
npm run check
```

## 10. Testing Environment

### 10.1 Unit Testing
```bash
# Run unit tests
npm run test:unit

# Run tests with coverage
npm run test:coverage

# Watch mode for TDD
npm run test:watch
```

### 10.2 Integration Testing
```bash
# Start test database
docker-compose -f docker-compose.test.yml up -d

# Run integration tests
npm run test:integration

# Cleanup
docker-compose -f docker-compose.test.yml down
```

### 10.3 End-to-End Testing
```bash
# Install Cypress
npm install cypress --save-dev

# Open Cypress test runner
npx cypress open

# Run headless tests
npx cypress run
```

## 11. Documentation Setup

### 11.1 API Documentation
```bash
# Generate OpenAPI specification
npm run docs:generate

# Serve API documentation
npm run docs:serve
```

### 11.2 Component Documentation
```bash
# Build Storybook
npm run storybook:build

# Run Storybook locally
npm run storybook
```

## 12. Performance Monitoring

### 12.1 Development Monitoring
```bash
# Install clinic.js for performance profiling
npm install -g clinic

# Profile CPU usage
clinic doctor -- node src/server.js

# Profile heap memory
clinic heap-profiler -- node src/server.js
```

### 12.2 Load Testing
```bash
# Install artillery for load testing
npm install -g artillery

# Run load test
artillery run load-test.yml
```

## 13. Troubleshooting

### 13.1 Common Issues

**Port already in use:**
```bash
# Find process using port
sudo lsof -i :3000

# Kill process
sudo kill -9 <PID>
```

**Database connection issues:**
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check logs
docker logs cut-grc-postgres

# Reset database
docker-compose down -v
docker-compose up -d
```

**Node modules issues:**
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### 13.2 Debugging Tools
```bash
# Debug Node.js application
node --inspect src/server.js

# Use Chrome DevTools
# Open chrome://inspect

# Debug with VS Code
# Add launch configuration in .vscode/launch.json
```

## 14. Team Collaboration

### 14.1 Shared Development Standards
- **Code Style:** ESLint + Prettier configuration committed
- **Git Hooks:** Husky for pre-commit checks
- **Commit Messages:** Conventional Commits format
- **Pull Requests:** Template with checklist

### 14.2 Development Server Access
```bash
# Backend API: http://localhost:3000
# Frontend App: http://localhost:5173
# API Documentation: http://localhost:3000/api-docs
# Database Admin: http://localhost:8080 (pgAdmin)
# Redis Admin: http://localhost:8081 (RedisInsight)
```

## 15. Next Steps

### 15.1 Initial Setup Verification
1. ✅ Clone repository
2. ✅ Install Node.js and dependencies
3. ✅ Set up PostgreSQL and Redis
4. ✅ Configure environment variables
5. ✅ Start development servers
6. ✅ Run database migrations
7. ✅ Verify API endpoints
8. ✅ Access frontend application

### 15.2 Development Tasks
1. Implement authentication system
2. Create risk management module
3. Build compliance tracking
4. Add real-time notifications
5. Implement reporting dashboard

This development environment setup provides a robust foundation for the CUT GRC platform development with all necessary tools, configurations, and workflows for efficient enterprise software development.