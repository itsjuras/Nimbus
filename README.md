# Nimbus

Nimbus is a SaaS platform built for commercial cleaning companies. It replaces WhatsApp group chats, paper checklists, and manual invoicing with a streamlined operations tool — giving owners real-time visibility of their crews, and giving clients proof that the job was done right.

---

## What it does

- **Job scheduling** — assign crews to client locations with recurring schedule support
- **Digital checklists** — per-client task lists that cleaners work through on their phones
- **Photo proof of work** — cleaners attach photos to checklist items on completion
- **Live job dashboard** — owners see every job's status in real time
- **Client completion reports** — auto-generated reports with photos sent to clients after each clean
- **Recurring invoicing** — automated billing for regular contracts

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL via Supabase |
| Auth | Supabase Auth |
| File storage | Supabase Storage |
| Frontend deployment | Vercel |
| Backend deployment | Railway |
| Monorepo tooling | pnpm workspaces |

---

## Project structure

```
nimbus/
├── apps/
│   ├── web/                  # React + TypeScript frontend
│   │   ├── src/
│   │   │   ├── components/   # Shared UI components
│   │   │   ├── pages/        # Route-level page components
│   │   │   ├── hooks/        # Custom React hooks
│   │   │   ├── lib/          # Supabase client, utilities
│   │   │   └── types/        # Frontend-specific types
│   │   ├── index.html
│   │   └── vite.config.ts
│   └── api/                  # Node.js + Express backend
│       ├── src/
│       │   ├── routes/       # Express route handlers
│       │   ├── middleware/    # Auth, error handling, validation
│       │   ├── services/     # Business logic layer
│       │   ├── db/           # Supabase client, query helpers
│       │   └── types/        # Backend-specific types
│       └── tsconfig.json
├── packages/
│   └── shared/               # Shared TypeScript types and utilities
│       └── src/
│           ├── types/        # Shared domain types (Job, Client, etc.)
│           └── utils/        # Shared pure utility functions
├── .env.example
├── package.json              # Root workspace config
├── pnpm-workspace.yaml
├── README.md
└── CLAUDE.md
```

---

## Getting started

### Prerequisites

- Node.js 20+
- pnpm 9+
- A Supabase project ([supabase.com](https://supabase.com))

### 1. Clone and install

```bash
git clone https://github.com/your-username/nimbus.git
cd nimbus
pnpm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Fill in the values in `.env` — see the [Environment variables](#environment-variables) section below.

### 3. Set up the database

Run the migrations in `apps/api/src/db/migrations/` against your Supabase project using the Supabase CLI or dashboard SQL editor.

### 4. Run in development

```bash
# Run both frontend and backend concurrently
pnpm dev

# Or run individually
pnpm --filter web dev       # Frontend on http://localhost:5173
pnpm --filter api dev       # Backend on http://localhost:3000
```

---

## Environment variables

Create a `.env` file at the root with the following:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Backend
PORT=3000
NODE_ENV=development
JWT_SECRET=your-jwt-secret

# Frontend (Vite — must be prefixed with VITE_)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:3000
```

---

## Deployment

### Frontend — Vercel

1. Connect your GitHub repo to Vercel
2. Set the root directory to `apps/web`
3. Add all `VITE_` environment variables in the Vercel dashboard
4. Deploy — Vercel detects Vite automatically

### Backend — Railway

1. Create a new Railway project and connect your GitHub repo
2. Set the root directory to `apps/api`
3. Add all non-`VITE_` environment variables in the Railway dashboard
4. Railway will build and run the Node.js server automatically

---

## Development scripts

```bash
pnpm dev           # Run all apps in development mode
pnpm build         # Build all apps for production
pnpm lint          # Lint all packages
pnpm typecheck     # TypeScript check across all packages
pnpm test          # Run tests across all packages
```

---

## Roadmap

- [x] Project setup and architecture
- [ ] Authentication (company owner + crew member roles)
- [ ] Client management
- [ ] Job scheduling with recurring support
- [ ] Mobile-optimised crew checklist interface
- [ ] Photo capture and storage
- [ ] Owner dashboard with live job status
- [ ] Client-facing completion reports
- [ ] Recurring invoicing and payment collection

---