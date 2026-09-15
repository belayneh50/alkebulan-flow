# Vercel production persistence

Alkebulan Flow now supports two storage modes without changing the UI:

- Local development and tests use `better-sqlite3` plus `data/uploads`.
- Vercel uses Neon PostgreSQL when `DATABASE_URL` is configured and private Vercel Blob when `BLOB_READ_WRITE_TOKEN` is configured.

The seeded workspace is fictional and remains fully editable through the application.

## Required Vercel environment variables

```text
DATABASE_URL=
BLOB_READ_WRITE_TOKEN=
SEED_DEMO=1
GOOGLE_GENERATIVE_AI_API_KEY=
GEMINI_MODEL=gemini-3.6-flash
```

`GOOGLE_GENERATIVE_AI_API_KEY` is optional because every AI feature has a deterministic fallback. Set `SEED_DEMO=1` for the public portfolio deployment so the first database connection creates the fictional demo workspace. Omit it for an empty production workspace.

## Runtime behavior

The database adapter initializes the PostgreSQL schema idempotently and uses pooled, parameterized queries. Mutations retain transactions and workspace scoping. Passwords remain scrypt-hashed and sessions remain opaque, hashed, HTTP-only-cookie records.

Uploads keep the existing 5 MB MIME/extension allowlist. In Vercel they are stored as private Blob objects under a workspace prefix; authenticated routes proxy preview/download bytes and enforce workspace ownership. Local development retains filesystem storage.

## Provisioning order

1. Import the GitHub repository into Vercel using the project name `alkebulan-flow`.
2. Add a Neon database from the Vercel Marketplace and connect it to the project.
3. Add a private Vercel Blob store and connect it to the project.
4. Add `SEED_DEMO=1` and the optional Gemini variables to Preview and Production.
5. Deploy a preview and verify login, CRUD, file preview/download/delete, audit, and AI fallback.
6. Promote the verified preview to production.

Never paste secret values into source files or commit `.env.local`.
