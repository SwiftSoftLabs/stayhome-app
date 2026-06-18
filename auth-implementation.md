# JWT Auth Standard (Isolated Schema)

This document defines the reusable authentication pattern for SwiftSoftLabs apps that use first-party JWT auth with per-app schema isolation.

## 1) Non-Negotiable Rules

- Every app has its own schema: `app_{project_name}`.
- Auth tables live in the app schema (not `public`, not shared across apps):
  - `users`
  - `auth_sessions`
  - `auth_verification_codes`
  - `auth_audit_logs` (recommended)
- JWT is cookie-based for web apps:
  - Access token: short-lived
  - Refresh token: long-lived, rotated, hashed-at-rest in DB
- Never store tokens in localStorage/sessionStorage.

## 2) Required Environment Variables

- `NEXT_PUBLIC_DB_SCHEMA=app_{project_name}`
- `DATABASE_URL=...` (must resolve to app schema via `search_path`)
- `JWT_ACCESS_SECRET` (>= 32 chars)
- `JWT_REFRESH_SECRET` (>= 32 chars)
- `JWT_ACCESS_TTL_SECONDS` (default 900)
- `JWT_REFRESH_TTL_SECONDS` (default 2592000)
- `AUTH_VERIFY_CODE_TTL_SECONDS` (default 900)
- `AUTH_RESET_CODE_TTL_SECONDS` (default 900)
- Optional:
  - `DATABASE_SSL=true|false`
  - `DATABASE_SSL_REJECT_UNAUTHORIZED=true|false`
  - `AUTH_BCRYPT_ROUNDS` (default 12)
  - `INSFORGE_URL`
  - `INSFORGE_ANON_KEY`
  - `AUTH_EMAIL_FROM` (or `INSFORGE_EMAIL_FROM`)

## 3) Table Contract

Minimum table fields expected by the app:

- `users`
  - `id uuid pk`
  - `email unique`
  - `password_hash`
  - `email_verified`
  - `role ('client'|'expert')`
  - `app_origin`
- `auth_sessions`
  - `id uuid pk`
  - `user_id -> users.id`
  - `refresh_token_hash`
  - `expires_at`
  - `revoked_at`
- `auth_verification_codes`
  - `user_id`
  - `email`
  - `code`
  - `type ('email_verification'|'password_reset')`
  - `expires_at`
  - `consumed_at`

## 4) API Contract

Auth endpoints:

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/verify-email`
- `POST /api/auth/resend-verification`
- `GET /api/auth/me`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password`
- `POST /api/auth/exchange-reset-token`
- `POST /api/auth/reset-password`
- `POST /api/auth/change-password` (authenticated; requires current password)
- `GET /api/auth/oauth/{provider}/start`
- `GET /api/auth/oauth/{provider}/callback`

Response conventions:

- `401`: unauthenticated / expired session
- `403`: verified user action blocked (for example unverified email)
- `409`: domain conflict (for example duplicate email)
- Always return safe user-facing messages; avoid leaking sensitive auth internals.

## 5) Middleware / Guard Pattern

- For protected server routes:
  - Read access token cookie.
  - Verify JWT signature + claims.
  - Resolve user from `users`.
  - Reject request if user/session invalid.
- For refresh flow:
  - Verify refresh JWT.
  - Match hashed refresh token in `auth_sessions`.
  - Revoke old session row.
  - Issue new access + refresh tokens.

## 6) Migration Checklist For New Projects

1. Create schema `app_{project_name}` and role `app_{project_name}_user`.
2. Apply bootstrap isolation migration (revoke public access, set search_path).
3. Apply JWT auth migration (users, auth_sessions, verification, audit logs).
4. Repoint all app FK references from provider auth tables to `app_{project_name}.users`.
5. Run app build and test signup/login/refresh/logout/reset flows.
6. Confirm auth tables exist only in app schema.

## 7) Security Baseline

- Hash passwords with bcrypt (or argon2id).
- Hash refresh tokens before storing.
- Rotate refresh token on every refresh.
- Clear cookies on logout and revoke DB session.
- Set cookie flags:
  - `HttpOnly: true`
  - `Secure: true` in production
  - `SameSite: Lax`
  - Path `/`
- Add rate limiting on login/signup/reset routes.
- For OAuth:
  - Validate `state` on callback.
  - Require verified provider email before account creation/linking.
  - Store provider account mapping in isolated schema table (`auth_oauth_accounts`).

## 8) OAuth Setup (Google/GitHub)

Add app-specific OAuth credentials (do not share credentials across apps):

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`

Callback URLs must target app API routes:

- `https://{app-domain}/api/auth/oauth/google/callback`
- `https://{app-domain}/api/auth/oauth/github/callback`

## 9) Transactional Email (InsForge)

Use InsForge email sending for verification and reset flows from server-side auth service code.

Recommended pattern:

- Keep auth logic in app server (`lib/auth/service.ts`).
- Call InsForge SDK email client (`client.emails.send`) from server-only helper.
- Use HTML templates with short-lived OTP codes.
- In development, optionally log code fallback if send fails.

Required env:

- `INSFORGE_URL`
- `INSFORGE_ANON_KEY`
- `AUTH_EMAIL_FROM` (preferred) or `INSFORGE_EMAIL_FROM`

## 10) Incident / Recovery Playbook

- Secret compromise:
  1. Rotate `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`.
  2. Revoke all rows in `auth_sessions`.
  3. Force re-login globally.
- Suspicious account:
  1. Revoke all sessions for user.
  2. Trigger password reset.
  3. Audit `auth_audit_logs`.

## 11) Reuse Instructions For Agents

When implementing auth on a new project:

1. Copy this pattern exactly.
2. Replace `app_aura` with target `app_{project_name}`.
3. Keep cookie + JWT architecture unchanged unless explicitly requested.
4. Do not introduce third-party auth providers unless requested.


## 12) StayHome Implementation Notes

- **Schema:** `app_stayhome`
- **Cookies:** `sh_access`, `sh_refresh`, `sh_oauth_state`
- **Client:** `src/lib/AuthProvider.tsx` + `src/lib/auth/client.ts`
- **Store:** `src/lib/store.ts` hydrates session via JWT `/api/auth/me` + profiles table
- **Middleware:** `src/middleware.ts` protects `/dashboard`, `/onboarding`, and role routes
- **UI:** login, signup (inline verify), Navbar logout via store
- **InsForge:** `src/lib/insforge.ts` retained for database/realtime only (no `auth` export)
