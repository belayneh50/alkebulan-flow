# Alkebulan Flow — AI Operations Hub for Service Businesses

## Role

Full-stack product developer and UX implementer, using AI-assisted development for iteration, testing support, and code review. I directed the product decisions, architecture, implementation, security controls, and final verification.

## Upwork description (under 600 characters)

Built Alkebulan Flow, a responsive operations hub for agencies and consultants. The app combines secure role-based access, client/project/task workflows, Kanban updates, KPI charts, activity history, validated file uploads with in-app previews, notifications, dark mode, and Gemini-assisted project briefs with a reliable offline fallback. Delivered as a tested Next.js/TypeScript portfolio product with SQLite persistence and a documented PostgreSQL production path.

## Five skills and deliverables

1. Next.js and TypeScript — responsive App Router product with protected pages and API routes.
2. Full-stack data design — relational SQLite persistence, transactions, constraints, and PostgreSQL migration notes.
3. Secure authentication — hashed credentials, opaque HTTP-only sessions, password reset, and owner/admin/team authorization.
4. AI integration — Gemini-assisted project briefs and workspace chat with schema validation, rate limits, and deterministic fallback.
5. Product UX and QA — Kanban workflows, client management, file preview/download/delete, dark mode, accessibility labels, automated tests, and browser verification.

## Problem

Small service businesses often manage client context, delivery status, tasks, files, and updates across disconnected tools. That makes deadlines harder to see and client communication slower to prepare.

## Solution

Alkebulan Flow brings those operations into one calm workspace. The overview surfaces key signals, detailed views support action, and Flow AI converts current project data into concise risks, next actions, and client-ready updates.

## Key features

- Responsive KPI dashboard and project-health signals
- Persistent client, project, and task workflows with Kanban status changes
- Clickable task editor with project, priority, assignee, status, and deadline controls
- Client creation plus accessible edit/delete actions
- Safe allowlisted uploads with authenticated in-app image/PDF preview, download, and deletion
- Activity records tied to the signed-in actor and persistent notification read state
- Optional Gemini chat and project briefs with bounded context and no-key/error fallback
- Light/dark themes with system preference and local persistence

## Architecture

Next.js App Router and React provide the interface and server routes. Zod validates API input. SQLite stores users, workspaces, memberships, clients, projects, tasks, files, sessions, notifications, and activities. Passwords use scrypt; sessions use hashed opaque tokens in HTTP-only cookies. File bytes stay outside the public directory and are served only through workspace-scoped authenticated routes. Gemini is server-only and optional.

## Verification evidence

- ESLint passed with no warnings.
- TypeScript type checking passed.
- Vitest passed: 5 files, 20 tests.
- Next.js production build passed with 19 application/API routes.
- Desktop and 390×844 mobile browser checks passed without console warnings.
- Client actions, task editing, file preview/download/delete, authentication, persistence, and AI fallback were exercised end to end.
- Secret audit confirmed the Gemini key exists only in ignored `.env.local` and is absent from tracked files and Git history.

## Suggested screenshot order

1. Desktop overview — KPI cards, revenue chart, project health, and activity.
2. Task board — all four Kanban columns with the task editor open.
3. Client management — portfolio cards with the Edit/Delete menu visible.
4. File management — authenticated screenshot preview with Download.
5. Flow AI — project selector and Generate project brief action.
6. Branded login — desktop, followed by the 390×844 mobile layout if Upwork allows an extra image.

The screenshots captured during the final Codex verification contain fictional `.local` demo credentials only and no real contact details or API secrets.
