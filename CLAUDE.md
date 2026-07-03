# CLAUDE.md — Nimbus

This file is the source of truth for AI-assisted development on Nimbus. Read it fully before writing any code.

---

## What is Nimbus?

Nimbus is a multi-tenant B2B SaaS platform for commercial cleaning companies. Each tenant is a cleaning company (the "owner"). Their employees are "crew members". The businesses they clean for are "clients". The core loop is: schedule a job → crew completes a digital checklist with photos on mobile → owner sees real-time status → client receives a completion report.

Target customer: small commercial cleaning companies with 5–30 staff, running recurring contracts with offices, schools, and retail spaces.

---

## Tech stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, React Router v6, TanStack Query (React Query)
- **Backend**: Node.js 20, Express 5, TypeScript
- **Database**: PostgreSQL via Supabase
- **Auth**: Supabase Auth (JWT-based, row-level security enabled)
- **File storage**: Supabase Storage (for job completion photos)
- **Shared types**: `packages/shared` — imported by both `apps/web` and `apps/api`
- **Monorepo**: pnpm workspaces
- **Frontend deployment**: Vercel
- **Backend deployment**: Railway

---

## Repository structure

```
nimbus/
├── apps/
│   ├── web/                  # React frontend
│   │   └── src/
│   │       ├── components/   # Reusable UI components
│   │       ├── pages/        # One file per route
│   │       ├── hooks/        # Custom hooks (data fetching, auth, etc.)
│   │       ├── lib/          # supabase.ts client, api.ts fetch wrapper
│   │       └── types/        # Frontend-only types (extend shared types here)
│   └── api/                  # Express backend
│       └── src/
│           ├── routes/       # Route files — thin, delegate to services
│           ├── middleware/    # requireAuth, validate, errorHandler
│           ├── services/     # All business logic lives here
│           ├── db/           # Supabase client, typed query helpers
│           └── types/        # Backend-only types
└── packages/
    └── shared/               # Shared domain types and pure utils
        └── src/
            ├── types/        # Job, Client, CrewMember, Company, etc.
            └── utils/        # Date formatting, status helpers, etc.
```

---

## Database schema

All tables use UUIDs as primary keys. `company_id` is the multi-tenancy key — every query must be scoped to the authenticated user's company.

### Core tables

```sql
-- One row per cleaning company (tenant)
companies (
  id uuid PK,
  name text,
  owner_id uuid FK -> auth.users,
  created_at timestamptz
)

-- Auth users mapped to a company and role
profiles (
  id uuid PK FK -> auth.users,
  company_id uuid FK -> companies,
  role text CHECK (role IN ('owner', 'manager', 'crew')),
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz
)

-- The buildings / offices a cleaning company services
clients (
  id uuid PK,
  company_id uuid FK -> companies,
  name text,
  address text,
  contact_name text,
  contact_email text,
  notes text,
  created_at timestamptz
)

-- Checklist templates, one per client (customisable)
checklists (
  id uuid PK,
  client_id uuid FK -> clients,
  company_id uuid FK -> companies,
  name text,
  created_at timestamptz
)

checklist_items (
  id uuid PK,
  checklist_id uuid FK -> checklists,
  label text,
  requires_photo boolean DEFAULT false,
  position integer,
  created_at timestamptz
)

-- A scheduled cleaning job
jobs (
  id uuid PK,
  company_id uuid FK -> companies,
  client_id uuid FK -> clients,
  checklist_id uuid FK -> checklists,
  scheduled_at timestamptz,
  status text CHECK (status IN ('scheduled', 'in_progress', 'completed', 'missed')),
  notes text,
  created_at timestamptz
)

-- Crew members assigned to a job (many-to-many)
job_crew (
  job_id uuid FK -> jobs,
  profile_id uuid FK -> profiles,
  PRIMARY KEY (job_id, profile_id)
)

-- One row per completed job, created when crew marks job done
job_completions (
  id uuid PK,
  job_id uuid FK -> jobs,
  completed_by uuid FK -> profiles,
  completed_at timestamptz,
  notes text
)

-- Per-item completion records within a job
job_checklist_items (
  id uuid PK,
  job_id uuid FK -> jobs,
  checklist_item_id uuid FK -> checklist_items,
  completed boolean DEFAULT false,
  completed_by uuid FK -> profiles,
  completed_at timestamptz
)

-- Photos attached to a checklist item during a job
job_photos (
  id uuid PK,
  job_id uuid FK -> jobs,
  checklist_item_id uuid FK -> checklist_items,
  profile_id uuid FK -> profiles,
  storage_path text,
  created_at timestamptz
)
```

---

## Auth and multi-tenancy

- Auth is handled entirely by **Supabase Auth**. Do not build a custom auth system.
- Every signed-in user has a `profile` row that includes their `company_id` and `role`.
- **Row Level Security (RLS) is enabled** on all tables. Policies ensure users can only read/write rows belonging to their company.
- The backend uses `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS for server-side operations. The frontend uses `SUPABASE_ANON_KEY` and relies on RLS.
- When writing backend routes, always extract `company_id` from the verified JWT and pass it explicitly to service functions. Never trust `company_id` from the request body.

### User roles

| Role | Access |
|------|--------|
| `owner` | Full access — manage clients, crew, jobs, invoices, settings |
| `manager` | Manage jobs and crew; cannot access billing or company settings |
| `crew` | Mobile-only view — see assigned jobs, complete checklists, upload photos |

---

## API conventions

- All routes are prefixed `/api/v1/`
- Routes are thin — they validate input and call a service function. No business logic in route handlers.
- Services return plain objects or throw typed errors. They never touch `req`/`res`.
- Use `zod` for request body and param validation in middleware.
- Errors follow this shape:

```json
{ "error": { "code": "NOT_FOUND", "message": "Job not found" } }
```

- HTTP status codes: 200 success, 201 created, 400 bad request, 401 unauthenticated, 403 forbidden, 404 not found, 422 validation error, 500 server error.

### Example route structure

```
GET    /api/v1/jobs              — list jobs for the company (paginated)
GET    /api/v1/jobs/:id          — get single job with crew + checklist
POST   /api/v1/jobs              — create a job
PATCH  /api/v1/jobs/:id          — update job status or details
DELETE /api/v1/jobs/:id          — soft-delete a job

POST   /api/v1/jobs/:id/complete — mark job complete (crew action)
POST   /api/v1/jobs/:id/photos   — upload a photo to a job checklist item
```

---

## Frontend conventions

- Use **TanStack Query** for all server state. Do not use `useState` + `useEffect` for data fetching.
- Custom hooks live in `src/hooks/`. Each hook wraps one TanStack Query call. Example: `useJobs()`, `useJob(id)`, `useCompleteJob()`.
- Pages are route-level components only — they compose smaller components and hooks, they don't contain business logic.
- Use **React Router v6** with a file-per-page structure.
- Tailwind utility classes only — no custom CSS files unless unavoidable.
- All form handling uses **React Hook Form** with **Zod** schemas for validation.
- The mobile crew interface (`/crew/*` routes) must work well on small screens. Design these routes mobile-first.

### Supabase client

```ts
// apps/web/src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

Use this client directly for auth and realtime subscriptions. For all other data operations, go through the API (`apps/api`), not the Supabase client directly from the frontend.

---

## Key features and how to implement them

### Job status pipeline

Jobs move through: `scheduled` → `in_progress` → `completed` (or `missed`).

- Status transitions are validated server-side in the job service — the frontend cannot jump states arbitrarily.
- `in_progress` is set automatically when a crew member opens the job checklist.
- `completed` is set when the crew submits the completion, triggering the client report generation.

### Photo uploads

- Photos are uploaded directly to **Supabase Storage** from the frontend (not via the API server).
- Storage bucket: `job-photos` (private, RLS-protected).
- Storage path pattern: `{company_id}/{job_id}/{checklist_item_id}/{uuid}.jpg`
- After upload, the frontend calls `POST /api/v1/jobs/:id/photos` to register the photo's path in the `job_photos` table.

### Client completion reports

- Triggered server-side when a job's status transitions to `completed`.
- The report service queries all `job_checklist_items` and `job_photos` for the job, generates a structured report object, and sends it via email (use **Resend** for transactional email).
- Report email includes: client name, date/time, checklist with ticked items, and embedded photo thumbnails.

### Realtime job dashboard

- The owner dashboard subscribes to the `jobs` table via **Supabase Realtime** to show live status updates without polling.
- Use the Supabase JS client's `.channel()` API for this, scoped to `company_id`.

---

## What NOT to do

- Do not build a custom authentication system. Use Supabase Auth.
- Do not put business logic in route handlers. It belongs in service functions.
- Do not query Supabase directly from the frontend except for auth and realtime. All other data goes through the Express API.
- Do not hardcode `company_id`. Always derive it from the authenticated user's JWT.
- Do not skip Zod validation on API inputs.
- Do not use `any` types in TypeScript. Use `unknown` and narrow properly.
- Do not store secrets in the frontend. `VITE_` prefixed variables are public.
- Do not write raw SQL strings in service files. Use the Supabase JS query builder.

---

## Coding style

- TypeScript strict mode is on. No `// @ts-ignore` unless accompanied by a comment explaining why.
- Prefer named exports over default exports (exception: page components use default exports for React Router lazy loading).
- Use `async/await` throughout. No raw `.then()` chains.
- Keep functions small and single-purpose. If a function is over ~40 lines, consider splitting it.
- Shared types in `packages/shared/src/types/` are the source of truth. Import from `@nimbus/shared` in both `web` and `api`.

---

## Running the project

```bash
pnpm install          # install all workspace dependencies
pnpm dev              # run web + api concurrently
pnpm typecheck        # typecheck all packages
pnpm lint             # lint all packages
pnpm test             # run all tests
```

---

## Environment variables

See `.env.example` at the root. The API requires `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `JWT_SECRET`. The frontend requires `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_API_URL`.

---

## Current build status

The core product is substantially complete and functional. Below is the current state of each feature area.

### Completed and working

- **Auth** — Owner signup, crew invite via magic-link email, accept-invite flow, role-based access (`owner`, `manager`, `crew`)
- **Job lifecycle** — Full `scheduled → in_progress → completed → missed` pipeline with server-side validation
- **Recurring jobs** — Daily, weekly, biweekly, monthly recurrence with 2–52 occurrences
- **Realtime dashboard** — Owner Kanban board (4 status columns) with live updates via Supabase Realtime
- **Calendar** — Month view with job listing per day, touch swipe for month navigation
- **Client management** — Full CRUD with contact details
- **Checklists** — Per-client checklist templates, drag-reorder, photo-required flag
- **Crew checklist execution** — Mobile-first: start job, tick items, photo capture (WebP, capped at 1920px), complete job
- **Photo uploads** — Directly to Supabase Storage (`job-photos` bucket), path registered via API
- **Completion reports** — Auto-sent to client email on job completion (Resend, signed photo URLs, styled HTML)
- **AI email drafting** — Claude Haiku generates drafts; Resend delivers; reply-to from company settings
- **Invoicing** — Stripe invoice creation, line items, send (emails client via Stripe), webhook syncs paid/void status
- **Finance** — Expense tracking with approval flow, wage logging, per-period summary (revenue, costs, profit)
- **Pay rate management** — Crew members have `pay_type` (hourly/per_job) and `pay_rate_cents`; per-job wages auto-logged on completion
- **Push notifications** — Expo push tokens, crew notified on job assignment, owner notified on status changes
- **Mobile app** — Expo 52 / React Native with full feature parity: crew and owner flows, NativeWind styling
- **Demo mode** — Full parallel `/demo/*` routes using hardcoded data (no auth required), useful for sales demos
- **Company settings** — Company name and reply-to email

### Known gaps / not yet implemented

- **SMTP custom sending** — Migration 009 added SMTP columns to `companies`; no API route or UI exposes them. Dead schema. Decide: implement or remove.
- **Google OAuth / Gmail** — Migration 010 + `apps/api/src/lib/googleAuth.ts` exist with helpers; no route or UI uses them. Dead code.
- **Bank account settings** — Placeholder section in `SettingsPage.tsx`; no backend behind it.
- **Crew time-off / availability** — DB tables and API routes exist (`apps/api/src/routes/mobile.ts`); unclear if mobile app surfaces these to users.