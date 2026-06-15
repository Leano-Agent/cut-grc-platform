# 🎯 CUT GRC Platform — Launch Kanban

> Last updated: 2026-06-15 07:10 UTC
> Next deploy: `68f32dc` (auth enforcement + TokenBlacklist fix + NODE_ENV) — deploying now

---

## ✅ DONE — Leano (Backend Engineer)

| Task | Details |
|------|---------|
| ✅ 5x crash fixes | middleware, fileUpload, openapi.json, all route modules |
| ✅ Backend deploys | Health endpoint returns 200 on Railway |
| ✅ Auth wired | `initialize*Routes()` called in `server.ts` — auth is ACTIVE |
| ✅ TokenBlacklist fixed | Handles null Redis — JWT verification works without Redis |
| ✅ NODE_ENV=production | Set on Railway — Swagger docs disabled |
| ✅ DATABASE_URL debug logging | Will show parsing results in deploy logs |

---

## 🔴 IN PROGRESS — Leano

| # | Task | Status | Est. |
|---|------|--------|------|
| 1 | **Link PostgreSQL to backend** | Investigating | 5 min |
| | PostgreSQL exists but NOT linked to cut-grc-backend on Railway canvas | | |
| | Manual DATABASE_URL variable is overriding — need to use Railway reference | | |
| | Fix: Add `${{Postgres.DATABASE_URL}}` reference variable or link on canvas | | |

---

## 🔴 P0 — Laone (Infrastructure/DevOps)

| # | Task | Priority | Est. |
|---|------|----------|------|
| 2 | **Set up api.plf.app DNS** | 🔴 Critical | 5 min |
| | Create A/CNAME record pointing to `cut-grc-backend-production.up.railway.app` | | |
| | Current state: api.plf.app times out — NO DNS record exists | | |
| 3 | **Update frontend VITE_API_BASE_URL** | 🔴 Critical | 2 min |
| | In `src/frontend/vercel.json`: change API URL to `https://api.plf.app/api/v1` | | |
| | Currently hardcoded to `cut-grc-backend.railway.app` | | |
| | Wait until DNS propagates before deploying | | |
| 4 | **Provision Redis on Railway** | 🟡 High | 3 min |
| | Add Redis service to project, link to backend | | |
| | This enables: token blacklisting, rate limiting, Socket.IO pub/sub | | |
| 5 | **Run database migrations** | 🔴 Critical | 10 min |
| | Once DB connects: create tables/schema | | |
| | Currently `syncModels()` only runs in development mode | | |
| | In production, need explicit migration: `npx sequelize-cli db:migrate` or schema push | | |
| 6 | **Set up domain email (SMTP)** | 🟡 High | 15 min |
| | Configure email provider (SendGrid, Mailgun, or AWS SES) | | |
| | Set SMTP vars on Railway: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS | | |
| | Needed for: password reset, email verification, notifications | | |

---

## 🟡 P1 — Laone (Operations)

| # | Task | Est. |
|---|------|------|
| 7 | **Set up UptimeRobot monitoring** | 5 min |
| | Monitor `health` endpoint + `plf.app` frontend | |
| 8 | **Create staging environment on Railway** | 10 min |
| | Clone production env, use staging branch for pre-prod testing | |
| 9 | **Set up GitHub branch protection** | 5 min |
| | Require PR reviews for main, enforce CI passing | |
| 10 | **Configure Vercel production domain** | 5 min |
| | Set custom domain plf.app (or plf.co.za) as primary | |

---

## 🟢 P2 — Future

| # | Task |
|---|------|
| 11 | Deploy mobile app (React Native in `src/mobile-app/`) |
| 12 | Deploy public portal (`src/public-portal/`) |
| 13 | Set up automated DB backups |
| 14 | Add API rate limiting with Redis |
| 15 | Set up error tracking (Sentry) |

---

## 🔧 Railway Reference Variables

**How to link PostgreSQL to backend on Railway:**
1. Go to Architecture canvas → click PostgreSQL service
2. On backend service variables page → click "New Variable"
3. Click "Add Reference" → select `PostgreSQL` → `DATABASE_URL`
4. Delete the manually-set DATABASE_URL (it's overriding the reference)
5. Deploy

**How to link Redis:**
1. Click "Add" on canvas → select Redis
2. On backend variables → Add Reference → select Redis → REDIS_URL
3. Deploy

---

## Current Deploy Status

- **Commit**: `68f32dc` — auth enforcement + TokenBlacklist fix
- **URL**: https://cut-grc-backend-production.up.railway.app
- **Health**: `{"status":"healthy","database":false,"redis":"disconnected"}`
- **Auth**: WAS bypassed → NOW enforced (deploying)
- **NODE_ENV**: WAS unset → NOW production (deploying)
