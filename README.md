# Nimbus

Nimbus is a multi-tenant B2B SaaS platform built for commercial cleaning companies. It replaces WhatsApp group chats, paper checklists, and manual invoicing with a purpose-built operations tool — giving owners real-time visibility of their crews and giving clients verifiable proof that the job was done right.

**Target customer:** Small commercial cleaning companies with 5–30 staff running recurring contracts with offices, schools, and retail spaces.

---

## Features

### For company owners and managers
- **Client management** — maintain a directory of client locations with addresses, contact details, and custom notes
- **Per-client checklists** — create and manage task lists tailored to each client's specific requirements
- **Job scheduling** — assign jobs to client locations, specify date/time, attach a checklist, and assign crew members
- **Live operations dashboard** — Kanban board showing every job's status in real time via Supabase Realtime (no polling)
- **Crew management** — invite crew members by email; manage roles (owner, manager, crew)
- **Client completion reports** — automatically generated and emailed to clients after each job, including a full checklist summary and embedded photo thumbnails
- **Invoicing** — create and send Stripe-powered invoices directly from the platform; Stripe handles payment collection and emails the client a hosted invoice link

### For crew members (mobile-first)
- **Assigned job list** — crew see only the jobs they've been assigned to
- **Digital checklist** — tap through checklist items one by one; the job moves to `in_progress` automatically on first open
- **Photo proof of work** — capture photos from the camera or photo library and attach them to specific checklist items; images are converted to WebP before upload
- **Job completion** — submit the job with optional notes when the checklist is done; this triggers the client report email

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Routing | React Router v6 |
| Server state | TanStack Query (React Query) v5 |
| Forms | React Hook Form + Zod |
| Backend | Node.js 24, Express 5, TypeScript |
| Database | PostgreSQL via Supabase |
| Auth | Supabase Auth (JWT + Row Level Security) |
| File storage | Supabase Storage |
| Realtime | Supabase Realtime (Postgres changes) |
| Email | Resend |
| Payments | Stripe (invoices + webhooks) |
| Shared types | `@nimbus/shared` — pnpm workspace package |
| Monorepo tooling | pnpm workspaces |
| Frontend deployment | Vercel |
| Backend deployment | Railway |

---

## Repository structure

```
nimbus/
├── apps/
│   ├── web/                        # React + TypeScript frontend (Vite)
│   │   └── src/
│   │       ├── components/
│   │       │   └── layouts/        # OwnerLayout (sidebar nav), CrewLayout
│   │       ├── pages/
│   │       │   ├── LoginPage.tsx
│   │       │   ├── SignUpPage.tsx
│   │       │   ├── AcceptInvitePage.tsx
│   │       │   ├── owner/
│   │       │   │   ├── DashboardPage.tsx   # Live Kanban board
│   │       │   │   ├── JobsPage.tsx
│   │       │   │   ├── JobDetailPage.tsx
│   │       │   │   ├── ClientsPage.tsx
│   │       │   │   ├── ClientDetailPage.tsx
│   │       │   │   ├── CrewPage.tsx
│   │       │   │   └── InvoicesPage.tsx
│   │       │   └── crew/
│   │       │       ├── JobsPage.tsx        # Assigned jobs list
│   │       │       └── ChecklistPage.tsx   # Mobile checklist + camera
│   │       ├── hooks/
│   │       │   ├── useAuth.ts
│   │       │   ├── useClients.ts
│   │       │   ├── useJobs.ts
│   │       │   ├── useLiveJobs.ts          # Supabase Realtime subscription
│   │       │   ├── useChecklist.ts
│   │       │   ├── useCrewJobs.ts
│   │       │   ├── useCrew.ts
│   │       │   └── useInvoices.ts
│   │       └── lib/
│   │           ├── supabase.ts             # Supabase anon client
│   │           ├── api.ts                  # Fetch wrapper (attaches JWT)
│   │           └── storage.ts             # WebP conversion + Supabase Storage upload
│   └── api/                        # Node.js + Express 5 backend
│       └── src/
│           ├── routes/
│           │   ├── auth.ts                 # /auth/signup, /auth/me, /crew/invite
│           │   ├── clients.ts              # CRUD + checklist management
│           │   ├── jobs.ts                 # CRUD + complete + photos
│           │   ├── checklists.ts
│           │   └── invoices.ts             # Create, send, Stripe webhook
│           ├── middleware/
│           │   ├── requireAuth.ts          # JWT verification via Supabase
│           │   ├── requireRole.ts          # Role-based access control
│           │   ├── validate.ts             # Zod schema validation
│           │   └── errorHandler.ts         # Typed AppError → JSON response
│           ├── services/
│           │   ├── authService.ts
│           │   ├── clientService.ts
│           │   ├── jobService.ts
│           │   ├── reportService.ts        # Completion report email via Resend
│           │   └── invoiceService.ts       # Stripe invoice creation + webhook handler
│           ├── db/
│           │   ├── supabase.ts             # Service-role client (bypasses RLS)
│           │   ├── migrations/
│           │   │   ├── 001_schema.sql      # All tables
│           │   │   ├── 002_rls.sql         # Row Level Security policies
│           │   │   ├── 003_realtime.sql    # Enable Realtime on jobs table
│           │   │   └── 004_invoicing.sql   # Invoices + Stripe customer tracking
│           │   └── queries/                # Typed query helpers per domain
│           └── lib/
│               └── stripe.ts              # Lazy-initialised Stripe client
└── packages/
    └── shared/                     # @nimbus/shared — imported by both apps
        └── src/
            ├── types/              # Company, Profile, Client, Job, Invoice, etc.
            └── schemas/            # Zod schemas + inferred request types
```

---

## Data model

All tables use UUIDs as primary keys. Every query is scoped to `company_id` — the multi-tenancy key. Row Level Security is enabled on all tables.

```
companies        → one row per cleaning company (tenant)
profiles         → auth users, each linked to a company with a role
clients          → the buildings/offices a company services
checklists       → per-client task templates
checklist_items  → individual tasks within a checklist
jobs             → scheduled cleaning jobs (scheduled → in_progress → completed | missed)
job_crew         → many-to-many: crew assigned to a job
job_completions  → created when crew submits a completed job
job_checklist_items → per-item completion state within a job
job_photos       → photo records (storage path + metadata) per checklist item
invoices         → one per billing event, linked to Stripe invoice
invoice_line_items → line items within an invoice
```

### User roles

| Role | Access |
|---|---|
| `owner` | Full access — clients, crew, jobs, invoices, settings |
| `manager` | Manage jobs and crew; no billing access |
| `crew` | Mobile only — assigned jobs and checklist completion |

---

## Getting started

### Prerequisites

- Node.js 20+
- pnpm 9+
- A [Supabase](https://supabase.com) project
- A [Stripe](https://stripe.com) account (for invoicing)
- A [Resend](https://resend.com) account (for completion report emails)

### 1. Clone and install

```bash
git clone https://github.com/your-username/nimbus.git
cd nimbus
pnpm install
```

### 2. Configure environment variables

**`apps/api/.env`**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

PORT=3001
NODE_ENV=development

RESEND_API_KEY=re_your_key
REPORT_FROM_EMAIL=reports@yourdomain.com

STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret
```

**`apps/web/.env`**
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:3001
```

### 3. Run database migrations

In your Supabase project, open the **SQL Editor** and run each migration file in order:

1. `apps/api/src/db/migrations/001_schema.sql` — creates all tables
2. `apps/api/src/db/migrations/002_rls.sql` — enables RLS and defines access policies
3. `apps/api/src/db/migrations/003_realtime.sql` — enables Realtime on the jobs table
4. `apps/api/src/db/migrations/004_invoicing.sql` — adds invoices tables and Stripe customer tracking

Then grant the required permissions (required after manual migration):

```sql
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role, authenticated;
```

### 4. Create the photo storage bucket

In your Supabase project → **Storage** → create a bucket named `job-photos`. Set it to **private** (RLS handles access).

### 5. Start the dev server

```bash
pnpm dev
```

This runs both the API and web app concurrently:
- Frontend → http://localhost:5173
- API → http://localhost:3001

### 6. (Optional) Test Stripe webhooks locally

Install the [Stripe CLI](https://stripe.com/docs/stripe-cli) and run:

```bash
stripe listen --forward-to localhost:3001/api/v1/webhooks/stripe
```

This forwards `invoice.paid` and `invoice.voided` events to your local API so invoice statuses update correctly in development.

---

## API reference

All routes are prefixed `/api/v1/`. Protected routes require a `Bearer` JWT in the `Authorization` header.

### Auth
| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/auth/signup` | Public | Create a company + owner account |
| GET | `/auth/me` | Authenticated | Get the current user's profile |
| POST | `/crew/invite` | Owner/Manager | Invite a crew member by email |
| GET | `/crew` | Authenticated | List all crew in the company |

### Clients
| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/clients` | Authenticated | List all clients |
| POST | `/clients` | Owner/Manager | Create a client |
| GET | `/clients/:id` | Authenticated | Get client with checklist |
| PATCH | `/clients/:id` | Owner/Manager | Update client details |
| DELETE | `/clients/:id` | Owner/Manager | Delete a client |
| PUT | `/clients/:id/checklist` | Owner/Manager | Replace the client's checklist |

### Jobs
| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/jobs` | Authenticated | List jobs (filterable by status) |
| POST | `/jobs` | Owner/Manager | Schedule a new job |
| GET | `/jobs/:id` | Authenticated | Get job with crew, checklist, and photos |
| PATCH | `/jobs/:id` | Owner/Manager | Update job details or status |
| DELETE | `/jobs/:id` | Owner/Manager | Delete a job |
| POST | `/jobs/:id/complete` | Crew | Submit a completed job |
| POST | `/jobs/:id/photos` | Crew | Register an uploaded photo |

### Invoices
| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/invoices` | Authenticated | List all invoices |
| POST | `/invoices` | Owner/Manager | Create and send a Stripe invoice |
| GET | `/invoices/:id` | Authenticated | Get a single invoice |
| POST | `/invoices/:id/send` | Owner/Manager | Send a draft invoice |
| POST | `/webhooks/stripe` | Stripe | Handle `invoice.paid` / `invoice.voided` |

---

## Development scripts

```bash
pnpm dev           # Run web + api concurrently
pnpm build         # Build all apps for production
pnpm typecheck     # TypeScript check across all packages
pnpm lint          # Lint all packages
```

Run a single app:

```bash
pnpm --filter web dev
pnpm --filter api dev
pnpm --filter @nimbus/shared build
```

---

## Deployment

### Frontend — Vercel

1. Connect your GitHub repo to Vercel
2. Set the **root directory** to `apps/web`
3. Add all `VITE_` environment variables in the Vercel dashboard
4. Set `VITE_API_URL` to your Railway API URL
5. Deploy — Vercel detects Vite automatically

### Backend — Railway

1. Create a new Railway service and connect your GitHub repo
2. Set the **root directory** to `apps/api`
3. Set the **start command** to `node dist/index.js`
4. Add all API environment variables in Railway
5. Set `CORS_ORIGIN` to your Vercel frontend URL (e.g. `https://nimbus.vercel.app`)
6. Deploy

### Stripe webhook (production)

Register your production webhook endpoint in the Stripe dashboard:

- **URL:** `https://your-api.railway.app/api/v1/webhooks/stripe`
- **Events:** `invoice.paid`, `invoice.voided`

Copy the webhook signing secret into your Railway `STRIPE_WEBHOOK_SECRET` env var.

---

## Architecture decisions

**Service-role key on the backend only.** The Express API uses Supabase's service-role key, which bypasses RLS. This lets the API freely read and write across the schema while still enforcing RLS for direct frontend access (Realtime subscriptions, auth).

**No direct Supabase queries from the frontend.** All data operations go through the Express API. The frontend uses the Supabase JS client only for auth (sign in/out) and Realtime subscriptions.

**Lazy Stripe initialisation.** The Stripe client is initialised on first use rather than at startup. This means a missing `STRIPE_SECRET_KEY` only throws when an invoice endpoint is called, not when the server boots — useful when running the API in environments without Stripe configured.

**Shared types package.** Both `apps/web` and `apps/api` import domain types and Zod schemas from `@nimbus/shared`. This ensures the API and frontend always agree on request/response shapes without duplicating type definitions.

**WebP conversion before upload.** The crew checklist converts captured photos to WebP via a canvas element before uploading to Supabase Storage. This reduces storage and bandwidth costs without any server-side image processing.
