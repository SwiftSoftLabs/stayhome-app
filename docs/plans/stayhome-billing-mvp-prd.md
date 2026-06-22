# StayHome — Billing Feature MVP PRD

**Status:** Draft  
**Owner:** SwiftSoftLabs / StayHome  
**Schema:** `app_stayhome` (InsForge, shared SwiftSoftLabs cluster)  
**Provider:** Kelviq (hosted checkout, portal, webhooks)  
**Auth:** JWT — access token via httpOnly cookie (`sh_access`) or `Authorization: Bearer`  
**Billing owner:** user  
**Branch:** `billing-integration-mvp`  
**Last updated:** 2026-06-22  

---

## 1. App Summary

### Purpose

StayHome helps families and caregivers keep aging loved ones safe at home — AI-powered safety assessments, risk scoring, contractor matching, and optional monitoring alerts.

### Current state

| Area | Status | Notes |
|------|--------|-------|
| Auth | JWT implemented | `sh_access` / `sh_refresh` cookies; `lib/auth/*` |
| Billing | On `billing-integration-mvp` | Kelviq routes + `/dashboard/family/billing` UI |
| Core features | Partial | Landing, family dashboard, safety workflows |
| Database | `app_stayhome` | Billing migration below |
| Framework | Next.js App Router | Not Expo |

### Relevant architecture

- **Framework:** Next.js App Router
- **Schema:** `app_stayhome` via `NEXT_PUBLIC_DB_SCHEMA`
- **API pattern:** Server routes + `pg` pool (`src/lib/db.ts`)
- **Client data access:** `fetch` to `/api/billing/*` with `credentials: 'include'`

### Relevant implementation details

- Access token cookie: `sh_access`
- Auth guard: `lib/billing/require-user.ts` → `requireBillingUser`
- User table FK target: `auth.users.id`
- Billing owner: **user** — family role shares one account subscription
- **Baseline plan code:** `basic`

### Billing page decision

**Extend existing** — `/dashboard/family/billing` (`app/dashboard/family/billing/page.tsx` + `components/billing/BillingSettings.tsx`).

---

## 2. Billing Feature MVP Plan

### MVP scope

**In scope:** billing page, Kelviq hosted checkout, checkout return UI (Activating poll + cancel abandon), `pending`, deferred cancel, customer portal, catalog provision, env bootstrap, webhook.  
**Out of scope:** monitoring quotas, assessment limits, reconcile, resume, entitlement enforcement.

### Git branch

`billing-integration-mvp` from latest `main`.

### Return URLs

| | URL |
|---|-----|
| successUrl | `{NEXT_PUBLIC_APP_URL}/dashboard/family/billing?checkout=success` |
| cancelUrl | `{NEXT_PUBLIC_APP_URL}/dashboard/family/billing?checkout=canceled` |

### Required API routes

| Route | Method | Auth |
|-------|--------|------|
| `/api/billing/summary` | GET | JWT |
| `/api/billing/checkout` | POST | JWT |
| `/api/billing/checkout/abandon` | POST | JWT |
| `/api/billing/cancel` | POST | JWT |
| `/api/billing/portal` | POST | JWT |
| `/api/billing/kelviq/webhook` | POST | HMAC only |

### Deferred cancel

Kelviq `cancellationType: IMMEDIATE` + local `cancel_at_period_end=true`; webhook `subscription.cancelled` guarded by `isDeferredCancelActive`.

---

## 3. Plan and Pricing Recommendations

> **RECOMMENDED — human must review prices before provision.**

**Kelviq product slug:** `stayhome`

| Local `plan_code` | Display name | Price (RECOMMENDED) | Interval | Kelviq identifier | Env var |
|-------------------|--------------|---------------------|----------|-------------------|---------|
| `basic` | Basic | $0 | — | — | — |
| `pro` | Pro | $29/mo USD | monthly | `stayhome-pro` | `KELVIQ_VARIANT_PRO` |

**Catalog config:** `scripts/kelviq-catalog.config.json`

---

## 4. Database Design

**Billing owner:** user (Vibemend pattern)  
**Tables:** `billing_plans`, `billing_customers`, `user_subscriptions`, `billing_events`  
**RPC:** `ensure_basic_subscription_for_user(uuid)`

---

## 5. Migration Requirements

| Order | File | Purpose |
|-------|------|---------|
| 1 | `migrations/20260622140000_app-stayhome-billing-mvp.sql` | Billing tables, seeds, RPC |

**Verify after apply:**

```sql
SET search_path TO app_stayhome;
SELECT code, price_cents FROM billing_plans ORDER BY sort_order;
```

---

## 6. Kelviq Catalog and Environment Setup

### 6.1 Environment bootstrap

```bash
node ~/.cursor/skills/swiftsoftlabs-billing/scripts/bootstrap-env-local.mjs --app-dir .
```

| Variable | Source |
|----------|--------|
| `KELVIQ_MODE`, `KELVIQ_API_KEY`, `KELVIQ_WEBHOOK_SECRET`, `BILLING_PRE_LAUNCH`, `BILLING_TESTER_EMAILS` | COPY_ONEWORK |
| `KELVIQ_API_BASE_URL` | `https://sandboxapi.kelviq.com/api/v1` |
| `NEXT_PUBLIC_DB_SCHEMA` | `app_stayhome` |
| `DATABASE_URL` | Sibling InsForge pattern with `search_path=app_stayhome` |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | GENERATE (per app) |
| `KELVIQ_VARIANT_PRO` | After provision → `stayhome-pro` |

### 6.2 Catalog provision

```bash
node ~/.cursor/skills/swiftsoftlabs-billing/scripts/provision-kelviq-catalog.mjs \
  --config scripts/kelviq-catalog.config.json \
  --env-file .env.local \
  --write-env
```

### 6.3 Webhook

- Route: `POST /api/billing/kelviq/webhook`
- Sandbox URL: `https://{NEXT_PUBLIC_APP_URL}/api/billing/kelviq/webhook`
- Secret: same `KELVIQ_WEBHOOK_SECRET` as OneWork `.env.local`
- Events: `subscription.created`, `subscription.updated`, `subscription.cancelled`, `checkout.completed`

---

## 7. Implementation Checklist

- [ ] Branch `billing-integration-mvp` from `main`
- [ ] Bootstrap `.env.local` (Section 6.1)
- [ ] Provision Kelviq catalog (Section 6.2)
- [ ] Run migration `20260622140000_app-stayhome-billing-mvp.sql`
- [ ] Port billing lib + `/api/billing/*` routes (Vibemend baseline)
- [ ] Wire `BillingSettings` on `/dashboard/family/billing`
- [ ] Checkout return: Activating poll + abandon on cancel (no Pending flicker)
- [ ] Deferred cancel guards in webhook handler
- [ ] Register Kelviq sandbox webhook (tunnel)
- [ ] E2E: subscribe, abandon, cancel, portal, JWT `401`

---

## References

- SwiftSoftLabs billing skill (`swiftsoftlabs-billing`)
- Vibemend user-billed JWT + billing baseline
- OneWork `kelviq/webhook/route.ts` signature contract
