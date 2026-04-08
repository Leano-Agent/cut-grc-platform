# CUT GRC Platform - Render.com Deployment Guide

## 🚀 FREE TIER Deploy to Render.com - NO PAYMENT REQUIRED

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Leano-Agent/cut-grc-platform)

### One-Click FREE TIER Deployment:
1. **Click the "Deploy to Render" button above**
2. **Connect your GitHub account** (Leano-Agent/cut-grc-platform)
3. **Render will auto-configure** from `render.yaml`:
   - **Name**: `cut-grc-free` (automatically set)
   - **Plan**: `Free` (no payment required)
   - **Region**: `Frankfurt (EU Central)` (best for African access)
   - **Build Command**: `cd src/backend && npm install --only=production`
   - **Start Command**: `cd src/backend && node src/server-free-tier.js`
4. **NO DATABASE SETUP REQUIRED** - Uses built-in SQLite
5. **NO REDIS REQUIRED** - Simplified authentication
6. **Click "Deploy"** - No payment information needed!

### Default Admin Credentials (auto-created):
- **Email**: `admin@cut.ac.za`
- **Password**: `Admin123!`

### Free Tier Features:
- ✅ **750 free hours/month** (enough for continuous operation)
- ✅ **SQLite database** (no external PostgreSQL required)
- ✅ **Persistent storage** in `/data` directory
- ✅ **Basic GRC functionality** (risks, users, dashboard)
- ✅ **Health monitoring** at `/health` endpoint
- ✅ **African sovereignty** optimized for African access

### Manual Deployment Steps:

#### 1. **Create Render.com Account**
- Sign up at [render.com](https://render.com)
- Connect GitHub account

#### 2. **Create Web Service**
- Go to Dashboard → "New +" → "Web Service"
- Connect to `Leano-Agent/cut-grc-platform` repository
- Render will automatically detect `render.yaml` configuration
- **Important**: The configuration has been simplified for free tier compatibility

#### 3. **Add PostgreSQL Database (After Web Service is created)**
- In your Render dashboard, click "New +" → "PostgreSQL"
- Name: `cut-grc-database`
- Database: `cut_grc`
- User: `cut_grc_user`
- Region: Frankfurt (EU Central)
- **Note**: Free tier has limited database hours

#### 4. **Add Redis (Optional but Recommended)**
- Use Upstash Redis (free tier available): https://upstash.com
- Or create Redis instance in Render if available
- **Note**: Render's free tier doesn't include Redis, use Upstash instead

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

#### Blueprint File Error ("unknown type 'pgsql'"):
- **Issue**: Render.com doesn't recognize `type: pgsql`
- **Solution**: Use manual service creation instead of blueprint
- **Fixed**: Updated `render.yaml` to use simplified configuration

#### Build Failures:
- Check `npm install --only=production` command
- Verify Node.js version (20.x required)
- Check TypeScript compilation
- **Note**: Build command is `cd src/backend && npm install --only=production`

#### Database Connection Issues:
- Verify `DATABASE_URL` environment variable is set in Render dashboard
- Check PostgreSQL is running (free tier spins down after inactivity)
- Test connection from Render shell
- **Manual Setup**: Add PostgreSQL database separately, then set `DATABASE_URL`

#### Redis Connection Issues:
- Verify `REDIS_URL` environment variable is set
- Use Upstash Redis (free tier) instead of Render Redis
- Check Redis service is running

#### Port Configuration:
- Backend runs on port 10000 (configured in `render.yaml`)
- Health check at `/health` (not `/api/v1/health`)
- Update CORS_ORIGIN if deploying frontend separately

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
