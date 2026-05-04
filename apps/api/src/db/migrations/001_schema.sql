-- ============================================================
-- 001_schema.sql
-- Run this first. Creates all tables in dependency order.
-- ============================================================

-- Tenant: one row per cleaning company
CREATE TABLE public.companies (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  owner_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Maps auth users to a company and role
CREATE TABLE public.profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id  uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  role        text NOT NULL CHECK (role IN ('owner', 'manager', 'crew')),
  full_name   text NOT NULL,
  phone       text,
  avatar_url  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Index for the most common lookup: find a user's company
CREATE INDEX profiles_company_id_idx ON public.profiles(company_id);

-- The offices / buildings a cleaning company services
CREATE TABLE public.clients (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name          text NOT NULL,
  address       text,
  contact_name  text,
  contact_email text,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX clients_company_id_idx ON public.clients(company_id);

-- Checklist template assigned to a client
CREATE TABLE public.checklists (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id  uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX checklists_client_id_idx  ON public.checklists(client_id);
CREATE INDEX checklists_company_id_idx ON public.checklists(company_id);

-- Individual tasks within a checklist template
CREATE TABLE public.checklist_items (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id   uuid NOT NULL REFERENCES public.checklists(id) ON DELETE CASCADE,
  label          text NOT NULL,
  requires_photo boolean NOT NULL DEFAULT false,
  position       integer NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX checklist_items_checklist_id_idx ON public.checklist_items(checklist_id);

-- A scheduled cleaning job
CREATE TABLE public.jobs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  client_id    uuid NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  checklist_id uuid NOT NULL REFERENCES public.checklists(id) ON DELETE RESTRICT,
  scheduled_at timestamptz NOT NULL,
  status       text NOT NULL DEFAULT 'scheduled'
               CHECK (status IN ('scheduled', 'in_progress', 'completed', 'missed')),
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX jobs_company_id_idx   ON public.jobs(company_id);
CREATE INDEX jobs_status_idx       ON public.jobs(status);
CREATE INDEX jobs_scheduled_at_idx ON public.jobs(scheduled_at);

-- Crew members assigned to a specific job (many-to-many)
CREATE TABLE public.job_crew (
  job_id     uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (job_id, profile_id)
);

CREATE INDEX job_crew_profile_id_idx ON public.job_crew(profile_id);

-- Created when a crew member marks a job as complete
CREATE TABLE public.job_completions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id       uuid NOT NULL UNIQUE REFERENCES public.jobs(id) ON DELETE CASCADE,
  completed_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  completed_at timestamptz NOT NULL DEFAULT now(),
  notes        text
);

-- Tracks completion of each checklist item within a job
CREATE TABLE public.job_checklist_items (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id            uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  checklist_item_id uuid NOT NULL REFERENCES public.checklist_items(id) ON DELETE CASCADE,
  completed         boolean NOT NULL DEFAULT false,
  completed_by      uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  completed_at      timestamptz,
  UNIQUE (job_id, checklist_item_id)
);

CREATE INDEX job_checklist_items_job_id_idx ON public.job_checklist_items(job_id);

-- Photos attached to checklist items during a job
CREATE TABLE public.job_photos (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id            uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  checklist_item_id uuid NOT NULL REFERENCES public.checklist_items(id) ON DELETE CASCADE,
  profile_id        uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  storage_path      text NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX job_photos_job_id_idx            ON public.job_photos(job_id);
CREATE INDEX job_photos_checklist_item_id_idx ON public.job_photos(checklist_item_id);
