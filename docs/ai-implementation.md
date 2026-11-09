# AI Implementation — StayHome

Audit summaries use OpenRouter with the pinned model `google/gemini-2.5-flash-lite`.

## Flow

```
POST /api/ai/audit-summary
  sh_access JWT
  assigned assessor of a completed audit
  findings: at most 50, each at most 500 characters
  Postgres caps: 3 runs per audit, 5 runs per family per UTC month
  google/gemini-2.5-flash-lite
```

Runs are counted on the audit's family account, including when an assessor requests the summary.

## Routes

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/ai/audit-summary` | `sh_access` access JWT, assigned assessor | Family-facing summary of a completed audit |

`GET /api/ai/health` is removed. It called the model without an admin check.

## Environment

`AI_QUALITY_MODEL` and `AI_CHAT_MODEL` are documented as Flash-Lite. The server pins that model and ignores a larger override. Schema: `app_stayhome`.
