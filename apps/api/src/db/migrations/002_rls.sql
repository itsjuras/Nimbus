-- ============================================================
-- 002_rls.sql
-- Run after 001_schema.sql.
-- Enables RLS on every table and defines access policies.
--
-- Access model:
--   - The Express API uses the service-role key, which bypasses
--     RLS entirely. These policies protect direct Supabase access
--     (e.g. Realtime subscriptions from the frontend anon client).
--   - All policies scope data to the authenticated user's company.
-- ============================================================

-- ----------------------------------------------------------------
-- Helper: returns the company_id for the current auth user.
-- SECURITY DEFINER so it runs as the function owner and can read
-- profiles without the caller needing a separate SELECT policy.
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.my_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid()
$$;

-- ----------------------------------------------------------------
-- Helper: returns the role for the current auth user.
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

-- ================================================================
-- companies
-- ================================================================
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Users can only see their own company
CREATE POLICY "companies: members can select"
  ON public.companies FOR SELECT
  USING (id = public.my_company_id());

-- Only the owner can update company details
CREATE POLICY "companies: owner can update"
  ON public.companies FOR UPDATE
  USING (owner_id = auth.uid());

-- Any authenticated user can create a company (needed for sign-up)
CREATE POLICY "companies: authenticated can insert"
  ON public.companies FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- ================================================================
-- profiles
-- ================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can see all profiles in their company
CREATE POLICY "profiles: members can select"
  ON public.profiles FOR SELECT
  USING (company_id = public.my_company_id());

-- Users can update their own profile
CREATE POLICY "profiles: own profile update"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

-- Owners and managers can update any profile in their company
CREATE POLICY "profiles: owner/manager can update any"
  ON public.profiles FOR UPDATE
  USING (
    company_id = public.my_company_id()
    AND public.my_role() IN ('owner', 'manager')
  );

-- Insert is handled by the API (service role). Allow self-insert
-- so the sign-up trigger / function can write the first profile row.
CREATE POLICY "profiles: authenticated can insert own"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- ================================================================
-- clients
-- ================================================================
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clients: members can select"
  ON public.clients FOR SELECT
  USING (company_id = public.my_company_id());

CREATE POLICY "clients: owner/manager can insert"
  ON public.clients FOR INSERT
  WITH CHECK (
    company_id = public.my_company_id()
    AND public.my_role() IN ('owner', 'manager')
  );

CREATE POLICY "clients: owner/manager can update"
  ON public.clients FOR UPDATE
  USING (
    company_id = public.my_company_id()
    AND public.my_role() IN ('owner', 'manager')
  );

CREATE POLICY "clients: owner/manager can delete"
  ON public.clients FOR DELETE
  USING (
    company_id = public.my_company_id()
    AND public.my_role() IN ('owner', 'manager')
  );

-- ================================================================
-- checklists
-- ================================================================
ALTER TABLE public.checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "checklists: members can select"
  ON public.checklists FOR SELECT
  USING (company_id = public.my_company_id());

CREATE POLICY "checklists: owner/manager can insert"
  ON public.checklists FOR INSERT
  WITH CHECK (
    company_id = public.my_company_id()
    AND public.my_role() IN ('owner', 'manager')
  );

CREATE POLICY "checklists: owner/manager can update"
  ON public.checklists FOR UPDATE
  USING (
    company_id = public.my_company_id()
    AND public.my_role() IN ('owner', 'manager')
  );

CREATE POLICY "checklists: owner/manager can delete"
  ON public.checklists FOR DELETE
  USING (
    company_id = public.my_company_id()
    AND public.my_role() IN ('owner', 'manager')
  );

-- ================================================================
-- checklist_items
-- ================================================================
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;

-- Join through checklists to verify company membership
CREATE POLICY "checklist_items: members can select"
  ON public.checklist_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.checklists c
      WHERE c.id = checklist_id
        AND c.company_id = public.my_company_id()
    )
  );

CREATE POLICY "checklist_items: owner/manager can insert"
  ON public.checklist_items FOR INSERT
  WITH CHECK (
    public.my_role() IN ('owner', 'manager')
    AND EXISTS (
      SELECT 1 FROM public.checklists c
      WHERE c.id = checklist_id
        AND c.company_id = public.my_company_id()
    )
  );

CREATE POLICY "checklist_items: owner/manager can update"
  ON public.checklist_items FOR UPDATE
  USING (
    public.my_role() IN ('owner', 'manager')
    AND EXISTS (
      SELECT 1 FROM public.checklists c
      WHERE c.id = checklist_id
        AND c.company_id = public.my_company_id()
    )
  );

CREATE POLICY "checklist_items: owner/manager can delete"
  ON public.checklist_items FOR DELETE
  USING (
    public.my_role() IN ('owner', 'manager')
    AND EXISTS (
      SELECT 1 FROM public.checklists c
      WHERE c.id = checklist_id
        AND c.company_id = public.my_company_id()
    )
  );

-- ================================================================
-- jobs
-- ================================================================
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- All company members can see jobs (needed for Realtime on owner dashboard)
CREATE POLICY "jobs: members can select"
  ON public.jobs FOR SELECT
  USING (company_id = public.my_company_id());

CREATE POLICY "jobs: owner/manager can insert"
  ON public.jobs FOR INSERT
  WITH CHECK (
    company_id = public.my_company_id()
    AND public.my_role() IN ('owner', 'manager')
  );

CREATE POLICY "jobs: owner/manager can update"
  ON public.jobs FOR UPDATE
  USING (
    company_id = public.my_company_id()
    AND public.my_role() IN ('owner', 'manager')
  );

CREATE POLICY "jobs: owner/manager can delete"
  ON public.jobs FOR DELETE
  USING (
    company_id = public.my_company_id()
    AND public.my_role() IN ('owner', 'manager')
  );

-- ================================================================
-- job_crew
-- ================================================================
ALTER TABLE public.job_crew ENABLE ROW LEVEL SECURITY;

CREATE POLICY "job_crew: members can select"
  ON public.job_crew FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = job_id
        AND j.company_id = public.my_company_id()
    )
  );

CREATE POLICY "job_crew: owner/manager can insert"
  ON public.job_crew FOR INSERT
  WITH CHECK (
    public.my_role() IN ('owner', 'manager')
    AND EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = job_id
        AND j.company_id = public.my_company_id()
    )
  );

CREATE POLICY "job_crew: owner/manager can delete"
  ON public.job_crew FOR DELETE
  USING (
    public.my_role() IN ('owner', 'manager')
    AND EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = job_id
        AND j.company_id = public.my_company_id()
    )
  );

-- ================================================================
-- job_completions
-- ================================================================
ALTER TABLE public.job_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "job_completions: members can select"
  ON public.job_completions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = job_id
        AND j.company_id = public.my_company_id()
    )
  );

-- Crew inserts their own completion record
CREATE POLICY "job_completions: crew can insert"
  ON public.job_completions FOR INSERT
  WITH CHECK (
    completed_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = job_id
        AND j.company_id = public.my_company_id()
    )
  );

-- ================================================================
-- job_checklist_items
-- ================================================================
ALTER TABLE public.job_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "job_checklist_items: members can select"
  ON public.job_checklist_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = job_id
        AND j.company_id = public.my_company_id()
    )
  );

-- Crew can insert (rows are seeded when job starts via API/service-role,
-- but policy covers any direct insert)
CREATE POLICY "job_checklist_items: members can insert"
  ON public.job_checklist_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = job_id
        AND j.company_id = public.my_company_id()
    )
  );

CREATE POLICY "job_checklist_items: members can update"
  ON public.job_checklist_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = job_id
        AND j.company_id = public.my_company_id()
    )
  );

-- ================================================================
-- job_photos
-- ================================================================
ALTER TABLE public.job_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "job_photos: members can select"
  ON public.job_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = job_id
        AND j.company_id = public.my_company_id()
    )
  );

-- Crew inserts their own photo records
CREATE POLICY "job_photos: crew can insert"
  ON public.job_photos FOR INSERT
  WITH CHECK (
    profile_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = job_id
        AND j.company_id = public.my_company_id()
    )
  );
