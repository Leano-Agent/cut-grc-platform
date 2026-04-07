# CUT GRC Platform - Render.com Deployment Guide

## 🚀 Quick Deploy to Render.com

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Leano-Agent/cut-grc-platform)

### One-Click Deployment:
1. **Click the "Deploy to Render" button above**
2. **Connect your GitHub account** (Leano-Agent/cut-grc-platform)
3. **Configure deployment:**
   - **Name**: `cut-grc-platform` (or your preferred name)
   - **Environment**: `Node`
   - **Build Command**: `npm install --only=production`
   - **Start Command**: `npm start`
   - **Region**: `Frankfurt (EU Central)` (recommended for African access)
4. **Add PostgreSQL Database:**
   - Click "Add Database"
   - Choose "PostgreSQL"
   - Name: `cut-grc-db`
5. **Add Redis Cache:**
   - Click "Add Redis" or use Upstash Redis
6. **Set Environment Variables** (from `.env.example`):
   ```
   NODE_ENV=production
   DATABASE_URL=<Render PostgreSQL Internal URL>
   REDIS_URL=<Render Redis or Upstash URL>
   JWT_SECRET=<generate_a_secure_random_string>
   CORS_ORIGIN=https://your-frontend-url.vercel.app
   ```
7. **Click "Deploy"**

### Manual Deployment Steps:

#### 1. **Create Render.com Account**
- Sign up at [render.com](https://render.com)
- Connect GitHub account

#### 2. **Create Web Service**
- Go to Dashboard → "New +" → "Web Service"
- Connect to `Leano-Agent/cut-grc-platform` repository
- Use configuration from `render.yaml`

#### 3. **Add PostgreSQL Database**
- "New +" → "PostgreSQL"
- Name: `cut-grc-db`
- Database: `cut_grc`
- User: `cut_grc_user`
- Region: Frankfurt (EU Central)

#### 4. **Add Redis (Optional but Recommended)**
- Use Upstash Redis: https://upstash.com
- Or Render Redis if available

#### 5. **Set Environment Variables**
Copy from `.env.example` and update:
```bash
NODE_ENV=production
PORT=10000
DATABASE_URL=postgresql://cut_grc_user:password@your-render-postgres-url:5432/cut_grc
REDIS_URL=redis://your-redis-url:6379
JWT_SECRET=your_secure_jwt_secret_here_change_this
CORS_ORIGIN=https://your-frontend.vercel.app
API_PREFIX=/api/v1
LOG_LEVEL=info
```

#### 6. **Deploy Frontend to Vercel**
```bash
# Frontend is in src/frontend/
# Deploy to Vercel:
vercel --prod
```

### Post-Deployment Verification:

1. **Check Health Endpoint:**
   ```
   https://your-render-service.onrender.com/health
   ```

2. **Run Database Migrations:**
   ```bash
   # Connect to Render shell
   render shell
   npm run migrate:up
   ```

3. **Test Authentication:**
   ```bash
   curl -X POST https://your-render-service.onrender.com/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@cut.ac.za","password":"Admin123!"}'
   ```

### Troubleshooting:

#### Build Failures:
- Check `npm install --only=production` command
- Verify Node.js version (20.x required)
- Check TypeScript compilation

#### Database Connection Issues:
- Verify `DATABASE_URL` environment variable
- Check PostgreSQL is running
- Test connection from Render shell

#### Redis Connection Issues:
- Verify `REDIS_URL` environment variable
- Check Redis service is running

### Monitoring:
- **Render Dashboard**: View logs and metrics
- **Health Checks**: Automatic monitoring
- **Custom Domain**: Add in Render settings

### Support:
- **Render Docs**: https://render.com/docs
- **GitHub Issues**: https://github.com/Leano-Agent/cut-grc-platform/issues
- **Email**: leano@tyriie.co.za

---
**Deployment Time**: ~15-30 minutes  
**Cost**: Free tier available (with limitations)  
**Region**: Frankfurt (EU Central) for African access  
**Status**: Production-ready with African sovereignty principles
