# 🎯 CUT GRC Platform — Launch Kanban

> Last updated: 2026-06-15 19:20 UTC
> Current deploy: `7508d87` — fix double-transaction migration + email service

---

## ✅ DONE — Leano (Backend Engineer)

| Task | Details |
|------|---------|
| ✅ 5x crash fixes | middleware, fileUpload, openapi.json, all route modules |
| ✅ Auth enforcement | All protected routes return 401/NO_TOKEN |
| ✅ TokenBlacklist | Handles null Redis gracefully |
| ✅ NODE_ENV=production | Swagger docs disabled |
| ✅ **DATABASE CONNECTED** | Fresh Postgres-4wZL on Railway, `database: true` |
| ✅ **SQL migrations applied** | 003-grc-complete-schema.sql — all tables created |
| ✅ **Registration → DB** | POST /api/v1/auth/register creates real DB records |
| ✅ **Login → DB** | POST /api/v1/auth/login queries DB |
| ✅ Migration files in build | postbuild script copies SQL + prod-migrate.js to dist |

---

## ✅ DONE — Laone (Infrastructure/DevOps)

| Task | Details |
|------|---------|
| ✅ Frontend redeployed | VITE_API_BASE_URL → api.plf.app in vercel.json |
| ✅ Email service | nodemailer + welcome email on registration (committed `e7b8f14`) |
| ✅ Backend verified | All auth endpoints functional |

---

## 🔴 BLOCKED — Needs Yungen/Oratile

| # | Task | Detail |
|---|------|--------|
| 1 | **DNS: api.plf.app** | Currently resolves to 13.248.169.48 (AWS Route53) — needs CNAME → `cut-grc-backend-production.up.railway.app` |
| | | **Requires:** Route53 credentials for plf.app zone |

---

## 🔴 P0 — Leano (remaining)

| # | Task | Notes |
|---|------|-------|
| 2 | **Fix login password hashing** | Registration and login use different hashing methods (login returns INVALID_CREDENTIALS for valid user) |
| 3 | **Set JWT_SECRET + JWT_REFRESH_SECRET** | Must be set as Railway env vars for production security |
| 4 | **Set CORS_ORIGIN** | Should be `https://cut-grc-frontend.vercel.app` (or `https://plf.app`) |
| 5 | **Clean up duplicate Postgres service** | "Postgres" service on canvas is a duplicate of Postgres-4wZL |

---

## 🟡 P1 — Laone / Leano

| # | Task | Notes |
|---|------|-------|
| 6 | **Redis on Railway** | App handles Redis-less mode — not a blocker |
| 7 | **SMTP env vars** | SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, EMAIL_FROM needed on Railway |
| 8 | **UptimeRobot monitoring** | Monitor /health endpoint |
| 9 | **Staging environment** | Clone production on Railway |

---

## 🔧 Current State

- **Backend URL**: https://cut-grc-backend-production.up.railway.app
- **Frontend URL**: https://cut-grc-frontend.vercel.app (points to api.plf.app — won't work until DNS is set)
- **Health**: `{"status":"healthy","database":true,"redis":"disconnected"}`
- **Auth**: Active — registration works, login has hashing bug
- **Database**: Postgres-4wZL on Railway, tables from 003-grc-complete-schema.sql applied
- **Redis**: Not provisioned — app runs fine without it

---

## 🔧 Railway Env Vars to Set

```
JWT_SECRET=<strong random string>
JWT_REFRESH_SECRET=<strong random string>
CORS_ORIGIN=https://cut-grc-frontend.vercel.app
SMTP_HOST=<SendGrid/Mailgun host>
SMTP_PORT=587
SMTP_USER=<SMTP username>
SMTP_PASSWORD=<SMTP password>
EMAIL_FROM=noreply@plf.app
DATABASE_URL=postgresql://postgres:***@postgres-4wzl.railway.internal:5432/railway  ← ALREADY SET
```
