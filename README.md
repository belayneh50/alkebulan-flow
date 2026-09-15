# Alkebulan Flow

**AI Operations Hub for Service Businesses**

Alkebulan Flow is a portfolio-grade operations workspace for small agencies, contractors, consultants, and freelancers. It brings clients, projects, tasks, files, deadlines, activity, and AI-assisted updates into one calm dashboard.

## Current status

The core MVP is implemented and verified: local SQLite plus a Vercel-ready Neon PostgreSQL adapter, secure credential auth, workspace roles, server-backed task workflows, validated client/project APIs, local or private Blob uploads, and optional Gemini generation with deterministic fallback. Hosted reset email and distributed rate limiting remain later production hardening.

## Quick start

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Protected routes redirect to `/login`; use the seeded demo account below. If port 3000 is taken, Next.js picks the next free port—the live URL is printed in the server log.

```text
Demo workspace: demo@alkebulan.local
Demo password:  FlowDemo2026!
```

These are fictional local-only demo credentials, not contact information or production secrets.

## Architecture

```mermaid
flowchart LR
  UI[Next.js App Router UI] --> API[Validated Route Handlers]
  API --> Auth[Opaque HTTP-only sessions]
  API --> DB[(Local SQLite)]
  API --> Files[Validated local uploads]
  API --> Fallback[Deterministic AI fallback]
  API -. optional key .-> Gemini[Google Gemini]
  DB -. production migration .-> PG[(PostgreSQL)]
```

- Next.js 16 App Router, React 19, TypeScript
- Tailwind CSS 4 with owned shadcn-style primitives and Radix foundations
- Recharts for responsive analytics
- Zod contracts for structured AI output
- Vercel AI SDK with optional Google Gemini provider
- Better SQLite3 with normalized relational schema and foreign keys
- Node scrypt password hashing and opaque database-backed sessions
- Vitest for deterministic logic tests

## Roadmap and progress ledger

Checkboxes are marked complete only after implementation and verification.

### 1. Scope and foundation

- [x] Select a credential-free, locally runnable portfolio architecture
- [x] Initialize Next.js, TypeScript, Tailwind, Git, and dependency lockfile
- [x] Establish Alkebulan visual tokens and product positioning
- [x] Create the authoritative README roadmap
- [x] Commit the initial staged history

### 2. Design system and demo experience

- [x] Responsive navigation shell with mobile drawer
- [x] Dashboard information architecture and branded workspace chrome
- [x] Reusable Button, Card, Badge, Input, and avatar patterns
- [x] Light and dark color themes with toggles on the login page and in the dashboard header
- [x] Workspace search over projects, clients, tasks, and files with a navigable results dropdown
- [x] Accessible labels, focus states, and semantic navigation
- [x] Contact-free demo mode indicator and fictional account
- [x] Verify representative desktop and mobile layouts in a browser

### 3. Data, authentication, and core workflows

- [x] Typed client, project, task, activity, priority, status, and role models
- [x] Seeded demo clients, projects, tasks, and activity
- [x] Secure sign-up, login, logout, and protected routes
- [x] Scrypt password hashing and revocable opaque sessions
- [x] Safe development password reset with one-time expiring tokens
- [x] Owner/Admin/Team roles with server-side authorization
- [x] Client portfolio and project progress views
- [x] Interactive Kanban board with cross-column task movement
- [x] New-task workflow with validation
- [x] Structured ISO task due dates with one-time legacy migration, overdue highlighting, and due-date sorting
- [x] Credential-free relational SQLite adapter and automatic seed
- [x] Persistent client/project/task CRUD route handlers
- [x] Dual SQLite/Neon PostgreSQL persistence adapter with idempotent hosted schema and optional demo seed
- [ ] Hosted reset-email delivery

### 4. Operations and AI

- [x] KPI cards, project-health signals, and responsive revenue chart
- [x] Deadline visibility and unified activity feed (live due-this-week and overdue counts)
- [x] File library and validated local upload handling
- [x] Notification popover and attention signals
- [x] Structured AI project brief contract
- [x] Project summaries, risks, next actions, and client-update drafting
- [x] Floating Flow AI chatbot available from every page
- [x] Deterministic no-key AI fallback served from a route handler
- [x] Optional credential-backed Gemini structured generation
- [x] Local file metadata persistence with size/type enforcement
- [x] Private Vercel Blob storage adapter with authenticated preview/download/delete routes
- [ ] Content-signature scanning
- [x] Persistent notification read state with outside-click dismissal
- [x] Dark-mode readability sweep: theme-aware badges, links, avatars, and charts in both modes

### 5. Quality and release confidence

- [x] Lint clean
- [x] Typecheck clean
- [x] Unit tests passing
- [x] Production build passing
- [x] Browser smoke test: dashboard, views, task creation, Kanban, AI brief
- [x] Responsive verification at mobile and desktop widths
- [x] Automated accessibility scan (axe-core WCAG 2.x A/AA runs in the test suite against the modal patterns)
- [x] Keyboard-flow review
- [x] Local security review for auth, uploads, authorization, and AI inputs

### 6. Portfolio and deployment package

- [x] Contact-free polished screenshots captured at verified desktop and mobile sizes
- [x] Short walkthrough script and recording plan
- [x] Architecture diagram
- [x] Upwork-ready case study with role, deliverables, architecture, verification, and screenshot order
- [x] Setup, test, and implementation documentation
- [x] Environment-variable template
- [x] Vercel deployment instructions and production data checklist
- [ ] Live deployment (requires explicit authorization)

### Stretch features

- [ ] Real-time collaboration
- [ ] Stripe subscriptions
- [ ] Email delivery
- [x] PDF/CSV export (CSV downloads from Tasks/Projects/Clients with Excel-safe BOM, plus a print-ready PDF project report generated from the grounded AI brief with a copyable client update)
- [x] Audit log (owner/admin-only view and API with actor, action, kind, and date-range filtering over the activity ledger)
- [x] Dark mode with a header toggle, system-preference detection, localStorage persistence, and a no-flash init script

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start the development server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript without emitting files |
| `npm test` | Run deterministic unit tests |
| `npm run build` | Create a production build |

## Theming

The interface ships in light and dark. On first visit the theme follows the operating system (`prefers-color-scheme`); the sun/moon toggle overrides it—top right on the login page, in the dashboard header—and the choice persists in `localStorage` under `alkebulan-theme`. A tiny inline script in `src/app/layout.tsx` applies the class before hydration, so there is no flash of the wrong theme; `<html>` carries `suppressHydrationWarning` because that intentional pre-hydration mutation otherwise trips React's hydration check. All components read semantic tokens (`--background`, `--card`, `--muted`, `--primary`, …) defined in `src/app/globals.css`, including chart colors (`--chart-line`, `--chart-fill`) so the revenue chart flips with the theme; status badges, nav states, and avatars use explicit dark variants. Dark mode also sets `color-scheme: dark` so native controls and scrollbars match. Both modes were contrast-checked against WCAG AA/AAA with computed-style measurements.

## Workspace search

The header search indexes live workspace data—projects (by name), clients (by company and industry), tasks (by title), and uploaded files. Results appear in a dropdown capped at eight entries with kind badges and context, a result count or a no-match line, and are ranked in project, client, task, file order. Picking a result switches to the matching view and clears the query; Escape clears, clicking outside closes. Search reflects what currently exists—the activity feed shows historical events for tasks that may have been deleted, so it is not a search source.

## Local data, migration, and seed

The first server request creates `data/alkebulan-flow.sqlite`, applies the idempotent schema, and inserts the fictional demo workspace. Runtime data and file bytes are gitignored. To reset locally, stop the server and remove the SQLite file and `data/uploads` directory, then restart. This intentionally destructive reset is never run automatically.

The schema covers users, workspaces, memberships, clients, projects, tasks, activities, notifications, uploaded-file metadata, sessions, and one-time reset tokens. For PostgreSQL, preserve UUID identifiers, convert timestamps to `timestamptz`, retain foreign keys/check constraints, and replace synchronous SQLite transactions with the selected PostgreSQL adapter.

## Authentication and roles

- Passwords use Node `scrypt` with a unique 128-bit salt.
- Sessions are 256-bit opaque tokens; only SHA-256 token hashes are stored.
- Cookies are HTTP-only, `SameSite=Strict`, path-scoped, and secure in production.
- Mutation routes check same-origin requests and validate payloads with Zod.
- Owner: full workspace, deletion, and membership management.
- Admin: client/project/task management without owner-only destructive controls.
- Team: workspace read access and task management only.
- Reset requests do not reveal account existence. Development tokens appear only outside production, expire after 15 minutes, are single-use, and revoke existing sessions after a password change.

## Optional Gemini configuration

Copy `.env.example` to `.env.local` and set `GOOGLE_GENERATIVE_AI_API_KEY` locally. Never commit the key. With no key—or if Gemini fails—the validated deterministic brief is returned, and the failure reason is logged server-side. No external AI call is required for development or tests.

The default model is `gemini-3.6-flash`, overridable with `GEMINI_MODEL` in `.env.local`. Earlier flash models are retired for new Google AI Studio accounts, so an outdated model name silently degrades every request to the fallback; if replies feel canned, check the server log for `[ai/chat]` errors and confirm the model is one your key can use.

## Continuation manual

### What is implemented

- A global bottom-right Flow AI widget appears on login and protected workspace pages.
- Anonymous users receive local demo guidance; workspace questions require authentication.
- The client keeps at most 12 displayed messages and sends at most 8 recent messages to the server.
- `POST /api/ai/chat` validates messages, rate-limits each signed-in user, injects concise project/task context server-side, and caps the Gemini instruction at short operations-focused replies.
- The Gemini key is read only on the server. The browser bundle and API response never contain it.
- Missing or failed Gemini requests return a deterministic workspace-priority answer.

### Configure and run safely

1. Copy `.env.example` to `.env.local`.
2. Put the Gemini key after `GOOGLE_GENERATIVE_AI_API_KEY=` in `.env.local` only.
3. Keep `.env.local` ignored and verify with `git check-ignore .env.local`.
4. Run `npm run dev`, sign in, and open the round Flow AI button at the bottom right.
5. For a no-network fallback check, temporarily leave the key blank, restart the server, and ask “What needs attention?”
6. Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` before committing.

### Known limitations

- Chat history is intentionally in-memory in the current browser tab and is not persisted.
- The fallback is deterministic and prioritizes high-priority open tasks; it is not a general language model.
- Local rate limiting is per process; hosted multi-instance deployment needs a distributed limiter.
- SQLite and local uploads are for a single local instance, not Vercel serverless storage.
- Gemini is optional and its free-tier availability, model access, and quotas depend on the user’s Google account.

### Recommended next steps

1. Execute the production PostgreSQL and object-storage migration per [`docs/MIGRATION.md`](docs/MIGRATION.md), including its verification checklist.
2. Add hosted reset-email delivery and distributed rate limiting.
3. Add an automated accessibility scan before a public production launch; the portfolio screenshot set is already captured and ordered in `docs/PORTFOLIO.md`.
4. Deploy only after replacing local persistence and reviewing environment variables in the hosting dashboard.
5. Consider remaining stretch work—realtime, billing, exports, and audit log—only after the hosted core passes the same gates. Dark mode is already shipped.

## Latest verification — 2026-09-15

- `npm run lint` — passed with 0 errors and 0 warnings
- `npm run typecheck` — passed
- `npm test` — 8 files, 37 tests passed, covering auth, role enforcement, client/project/task CRUD, AI protection, uploads, due-date validation and migration, modal accessibility (axe-core WCAG 2.x A/AA), CSV/report escaping, the audit log, and the weekly digest
- `npm run build` — passed; 24 application/API routes generated successfully, including the new `/api/audit` and `/api/ai/digest`
- Browser — desktop and mobile protected layouts render without console errors; the floating chat, dark mode, audit log filters, workspace search, and digest card were exercised end-to-end in the running app
- AI — live Gemini replies verified for chat, grounded project briefs, and the weekly digest (provider badge confirms the source); deterministic fallbacks verified truthful
- Security — the API key remains only in ignored `.env.local`; audit log is role-enforced server-side; uploads stay workspace-scoped with no-sniff and inline-only image/PDF preview

## Production migration

The concrete procedure for PostgreSQL, object storage, distributed rate limiting, and hosted reset email lives in [`docs/MIGRATION.md`](docs/MIGRATION.md). The production roadmap boxes stay unchecked until those steps are executed and verified against real infrastructure.

## Portfolio proof pack

- [`docs/UPWORK_CASE_STUDY.md`](docs/UPWORK_CASE_STUDY.md) — concise Upwork description, role, five deliverables, problem/solution narrative, architecture, verification evidence, and final screenshot order
- [`docs/PORTFOLIO.md`](docs/PORTFOLIO.md) — 60–90 second walkthrough, capture manifest, talking points, and deployment checklist
- Final verified captures: desktop overview, task editor/Kanban, client actions, in-app file preview, Flow AI, and branded desktop/mobile login. These were captured as artifacts in the final Codex task and contain only fictional demo data.

## Session additions — 2026-09-14 (post-MVP)

- **Gemini repair** — the configured `gemini-2.5-flash` model was retired for new Google AI Studio keys, so every request failed silently into the deterministic fallback; default moved to `gemini-3.6-flash`, fallback catches now log the provider error server-side, and live Gemini replies were verified end-to-end in the browser
- **Workspace search** — header search previously rendered a decorative input with no handlers; it now searches projects, clients, tasks, and files with a navigable dropdown, verified across hit, navigation, and no-match cases
- **Notifications** — added outside-click dismissal; read-state persistence via `PATCH /api/notifications` and SQLite `read_at` re-verified across reload
- **Dark mode** — new: theme toggles on login and dashboard, `prefers-color-scheme` default, persisted choice, no-flash init script, `suppressHydrationWarning` to keep hydration clean, theme-aware chart tokens, and a full dark-readability sweep (inputs, badges, links, avatars, nav, promo cards) with measured contrast of 7.1:1+ in light and 9.8:1+ in dark on primary actions
- **Completed interaction audit** — New client now posts through the API; client menus provide Edit/Delete; task cards open a full editor with status, priority, assignee, and due-date controls; images/PDFs preview in-app while every uploaded file exposes Download and confirmed Delete
- **Exports & client-ready reporting** — one-click CSV downloads for tasks, projects, and clients (RFC-4180 escaping, Excel-safe UTF-8 BOM, ISO dates); the AI assistant turns any grounded brief into a print-ready PDF report (summary, risks, next actions, client update, auto-opens the print dialog) and copies the client update to the clipboard; unit-tested escaping and HTML safety
- **Audit log** — owner/admin-only view and API over the activity ledger with server-side filtering by actor, action, kind, and date range (debounced, 200-entry window, role-enforced 403 for team); covered by integration tests
- **Weekly AI digest** — new `/api/ai/digest` generates a Monday-morning priorities digest (headline + up to six attention items) grounded in all live projects and tasks, with strict Zod validation, JSON-mode prompting with fence-stripping, and a truthful deterministic fallback; surfaced as an Overview card with refresh, PDF download, and copy actions; verified live with Gemini
- **Production migration guide** — `docs/MIGRATION.md` documents schema conversion, adapter swap points, upload-to-object-storage mapping, env vars, and the verification checklist; the production roadmap boxes remain honestly unchecked until executed
- **Structured due dates & dialog accessibility** — ISO task due dates with a one-time legacy migration, overdue highlighting, due-date sorting, live deadline KPIs, and date pickers in both task modals; modals and the AI slide-over now close on Escape and backdrop click, trap Tab with initial focus on the first field and focus restore on close; the floating chat was re-layered below dialogs; an automated axe-core WCAG 2.x A/AA scan covers the modal patterns (6 new tests, 28 total)
- **Activity integrity** — client create/update/delete, task create/update/delete, and file upload/delete are persisted with the signed-in actor and reflected immediately in the Activity view
- **File retrieval security** — authenticated workspace-scoped file serving uses exact stored metadata, inline preview only for images/PDFs, attachment delivery for other types, no-sniff headers, and owner/admin deletion
- **Quality gates re-run after all changes** — lint clean, typecheck clean, 20/20 tests passing, production build passing

## AI behavior

`POST /api/ai/brief` returns a Zod-compatible summary, risk list, next actions, and client-update draft. If `GOOGLE_GENERATIVE_AI_API_KEY` is configured, the Vercel AI SDK requests structured output from Gemini. Otherwise—or on provider failure—the route returns the local deterministic fallback contract.

## Deployment notes

Local development uses SQLite and filesystem uploads. When `DATABASE_URL` and `BLOB_READ_WRITE_TOKEN` are present, the same routes use Neon PostgreSQL and private Vercel Blob storage. Before handling real users, add distributed rate limiting and hosted reset-email delivery. The Gemini key remains optional and server-only.

## Privacy

All visible organizations and people are fictional. The public demo must not display email addresses, phone numbers, social handles, or other direct contact information. The `.local` login identifier exists only as non-routable sample data.
