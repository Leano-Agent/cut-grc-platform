# CUT GRC — Railway Deployment Completion
## t_leano_007: SQLite → PostgreSQL Migration + Railway Deploy

**Date:** June 1, 2026
**From:** Leano (COO, Tyriie Solutions)
**To:** Oratile (oratile@tyriie.co.za)
**Laone's commit:** `dc0d806` — all code pushed to GitHub
**GitHub:** https://github.com/Leano-Agent/cut-grc-platform (private)

---

### What Laone Already Did

- ✅ Database migration layer — `prod-migrate.js` reads SQL files via `pg`, runs them in transactions
- ✅ Railway config updated — `railway.json` with PostgreSQL + Redis plugins, health checks, scaling
- ✅ Code pushed to GitHub main → should auto-deploy (if Railway token is valid)
- 🔴 Blocker: Railway API token may be expired
- ⏳ Pending: Verify /health, verify frontend, shut down Render

---

### Step 1: Check Railway Dashboard

1. Go to https://railway.app/dashboard
2. Log in with Tyriie's GitHub account
3. Find project: **CUT GRC Platform** (ID: `fdf323a7-5500-4c0c-827f-504c680dfb44`)
4. Check the deployment status:
   - **If green/active** → Code auto-deployed. Skip to Step 3.
   - **If red/failed** → Check logs. Most likely: Railway lost GitHub connection.
   - **If "no deployments"** → Token or GitHub connection issue.

### Step 2: Reconnect GitHub (if needed)

If Railway shows no recent deployments:

1. Railway Dashboard → Project Settings → GitHub
2. Click "Reconnect" or "Re-authorize"
3. Authorize the `Leano-Agent` GitHub organization
4. Select repo: `Leano-Agent/cut-grc-platform`
5. Set branch: `main`
6. Trigger manual deploy

### Step 3: Verify PostgreSQL Plugin

1. Railway Dashboard → Project → Plugins (left sidebar)
2. Confirm **PostgreSQL** plugin is active (version 15)
3. If missing → Add Plugin → PostgreSQL
4. Copy the `DATABASE_URL` — it should auto-inject into the app

### Step 4: Verify Redis Plugin

1. Railway Dashboard → Project → Plugins
2. Confirm **Redis** plugin is active (version 7)
3. If missing → Add Plugin → Redis
4. Copy the `REDIS_URL`

### Step 5: Set Environment Variables

Railway Dashboard → Project → Variables. Confirm these exist:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | (auto-set by PostgreSQL plugin) |
| `REDIS_URL` | (auto-set by Redis plugin) |
| `JWT_SECRET` | (auto-generated or set manually) |
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `CORS_ORIGINS` | `https://cut-grc-frontend.vercel.app` |
| `TZ` | `Africa/Johannesburg` |

### Step 6: Trigger Deploy & Check Migrations

1. Railway Dashboard → Deploy → Trigger Deploy
2. Watch build logs — you should see:
   ```
   → 001-initial-schema.sql (already applied)
   → 002-municipal-workflows-complete.sql (already applied)
   → 003-grc-complete-schema.sql
   ```
3. If migrations fail, check DATABASE_URL is set and DB is accessible

### Step 7: Verify Health Endpoint

Once deployed (green status):

1. Open browser: `https://cut-grc-backend.railway.app/health` (or Railway-assigned domain)
2. Should return JSON:
   ```json
   {"status":"healthy","timestamp":"...","uptime":...,"environment":"production"}
   ```
3. Also test: `/api/v1/health` — comprehensive check with DB + Redis
4. Also test: `/api/v1/health/readiness` — should show `"ready":true`

### Step 8: Verify Frontend Connectivity

1. Open: https://cut-grc-frontend.vercel.app
2. Log in with admin credentials
3. Navigate through the dashboard — verify data loads
4. Try creating/editing a risk item — verify it persists
5. Refresh page — verify session maintained

### Step 9: Shut Down Old Render Tier (Save R350+/mo)

1. Go to https://dashboard.render.com
2. Find service: `cut-grc-free` (frankfurt region, free tier)
3. Click service → Settings → Delete Service
4. Confirm deletion
5. Also check if there's a PostgreSQL instance on Render — delete if migrated
6. Verify the Render webhook is removed from GitHub:
   - GitHub → repo Settings → Webhooks
   - Remove any Render webhook

### Step 10: Verify No Data Loss

1. On the new Railway deployment, verify all data exists:
   - Users/accounts
   - Risk items
   - Compliance records
   - Workflow items
2. If anything is missing, it means the migration didn't run. Run:
   ```bash
   railway run node src/database/migrations/prod-migrate.js
   ```

### Cost

| Plan | Cost |
|------|------|
| Railway Hobby Plan | ~R95/mo ($5) |
| PostgreSQL (1GB) | Included in Hobby |
| Redis (100MB) | Included in Hobby |
| **Total monthly** | **~R95/mo** |

This replaces Render free tier (unreliable) with Railway paid (reliable, EU-West, auto-scaling).

---

### Troubleshooting

| Problem | Fix |
|---------|-----|
| "Cannot connect to database" | Check DATABASE_URL in Variables. Restart PostgreSQL plugin. |
| "Migration failed" | Check build logs. SQL may have syntax issues. |
| Frontend can't reach API | Verify CORS_ORIGINS includes the frontend URL (including `https://`) |
| Redis connection refused | Redis plugin may be stopped. Restart it. |
| Health returns 503 | DB or Redis unhealthy — check plugin statuses |

---

### Completion Checklist

- [ ] Railway dashboard accessible
- [ ] PostgreSQL plugin active
- [ ] Redis plugin active  
- [ ] Environment variables set
- [ ] Deploy successful (green)
- [ ] Migrations ran (check logs)
- [ ] /health returns 200
- [ ] /api/v1/health returns healthy
- [ ] Frontend loads and works
- [ ] Old Render service deleted
- [ ] Data verified (no loss)

---

**Contact:** Telegram @LeanoTheLiberator

Instructions saved: `cut-grc-project/RAILWAY_DEPLOYMENT_COMPLETION.md`
