# Production migration guide

The local MVP runs on SQLite + local file uploads by design. This doc is the concrete
procedure for moving to production-grade persistence. The production boxes in the README
stay unchecked until these steps are executed **and verified** against real infrastructure.

## 1. PostgreSQL

### 1.1 Schema conversion (`src/lib/db/schema.ts`)

| SQLite | PostgreSQL |
|---|---|
| `TEXT PRIMARY KEY` (UUIDs) | `UUID PRIMARY KEY` (keep UUIDv4 values generated in app code) |
| `created_at TEXT DEFAULT CURRENT_TIMESTAMP` | `created_at TIMESTAMPTZ NOT NULL DEFAULT now()` |
| `expires_at TEXT` / `read_at TEXT` / `used_at TEXT` | `TIMESTAMPTZ` (nullable where SQLite allowed NULL) |
| `CHECK(role IN (...))`, `CHECK(status IN (...))` | identical `CHECK` constraints — they port as-is |
| `PRAGMA foreign_keys = ON` | FKs are always enforced; also add `ON DELETE` behavior review |
| `CREATE INDEX idx_*` | identical, plus `CREATE INDEX idx_tasks_due ON tasks(workspace_id, due)` for deadline queries |

Order matters: `users`, `workspaces`, `memberships`, `clients`, `projects`, `tasks`,
`activities`, `notifications`, `uploaded_files`, `sessions`, `password_reset_tokens`.

### 1.2 Adapter work

- `src/lib/db/index.ts` — replace `better-sqlite3` with a `pg`/`postgres-js` pool. The
  singleton becomes an async pool getter; every call site that does
  `db.prepare(...).run(...)` becomes `await`ed (`db.query(...)`) — the SQL itself is
  compatible except the `date()`/`datetime('now',…)` functions:
  `date(created_at)>=?` → `created_at::date>=?`, `datetime('now','-2 hours')` → `now() - interval '2 hours'`.
- Synchronous transactions (`db.transaction(...)`) become `BEGIN`/`COMMIT` on a leased
  client. All mutation routes already wrap writes in one transaction — keep that shape.
- The due-date migration (`migrateTaskDueDates`) is a local-data concern; production
  starts clean with ISO dates and the Zod `z.string().date()` validation stays.
- Seed: keep the demo seed behind an explicit `SEED_DEMO=1` flag, never on production boot.

### 1.3 Verification checklist (before ticking the README box)

1. `npm run build` passes with the driver installed.
2. Integration suite (`src/app/api/api.integration.test.ts`) runs against a disposable
   Postgres database (point the pool at `DATABASE_URL`, run the converted schema first).
3. Session expiry, password-reset single-use, and `read_at` notification persistence
   behave identically (timestamps round-trip through `TIMESTAMPTZ`).
4. Audit-log date filters return the same rows as SQLite for a fixed dataset.

## 2. Object storage (uploads)

`src/app/api/uploads/route.ts` (write) and `src/app/api/uploads/[id]/route.ts` (read/delete)
are the only two files touching the filesystem, plus the `data/uploads` path helpers.

- Keep the `uploaded_files` metadata table; add a `storage_key` column replacing
  `stored_name` semantics (object key, e.g. `workspaceId/storedName`).
- Replace `writeFile`/`readFile`/`unlink` with the provider SDK (`S3.PutObjectCommand`,
  `GetObjectCommand` with response streaming, `DeleteObjectCommand`).
- Keep the existing guards unchanged: extension↔MIME match, 5 MB cap, workspace-scoped
  lookups, `basename` check becomes a key-prefix check, inline only for image/PDF,
  `X-Content-Type-Options: nosniff`, private cache.
- Presigned URLs are the production-grade alternative to proxy-streaming GETs; if used,
  keep the route as the authorizer and issue short-lived (≤60s) URLs.

## 3. Environment

```
DATABASE_URL=postgres://…            # required in production
UPLOADS_BUCKET=…                     # or S3-compatible endpoint vars
GOOGLE_GENERATIVE_AI_API_KEY=…       # optional, server-only
GEMINI_MODEL=gemini-3.6-flash        # optional override
```

## 4. Rate limiting and email (the other two production gaps)

- `src/lib/auth/rate-limit.ts` is per-process memory. For multi-instance hosting, swap
  `allowAttempt` to Redis (e.g. `INCR`+`EXPIRE`) behind the same signature.
- `src/app/api/auth/reset/route.ts` returns `developmentToken` outside production. Wire
  the same token into an email provider (Resend/SES) behind `NODE_ENV=production` and
  delete the dev-token response path.
