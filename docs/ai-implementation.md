# AI Implementation — StayHome

Audit report summaries use **InsForge Model Gateway** (Pattern B).

## Flow

```
Report builder (future wiring)
    └─ POST /api/ai/audit-summary (Bearer JWT)
           └─ google/gemini-2.5-flash
```

## Routes

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/ai/health` | Service | Gateway smoke test |
| POST | `/api/ai/audit-summary` | Bearer JWT | Family-friendly audit summary |

## Environment

See `.env.example`. Schema: `app_stayhome`.
