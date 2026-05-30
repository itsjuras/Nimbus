-- ============================================================
-- 007_finance.sql
-- Run after 006_client_phone.sql.
-- Adds pay rates to profiles, supply expense receipts table,
-- and wage entry log table.
-- ============================================================

-- Pay rate settings per crew member
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pay_type text CHECK (pay_type IN ('hourly', 'per_job')),
  ADD COLUMN IF NOT EXISTS pay_rate_cents integer CHECK (pay_rate_cents >= 0);

-- Supply expense receipts submitted by crew
CREATE TABLE public.expenses (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id           uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  submitted_by         uuid NOT NULL REFERENCES public.profiles(id),
  job_id               uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  amount_cents         integer NOT NULL CHECK (amount_cents > 0),
  description          text NOT NULL,
  category             text NOT NULL DEFAULT 'supplies' CHECK (category IN ('supplies', 'other')),
  receipt_storage_path text,
  status               text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by          uuid REFERENCES public.profiles(id),
  reviewed_at          timestamptz,
  created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX expenses_company_id_idx ON public.expenses(company_id);
CREATE INDEX expenses_status_idx     ON public.expenses(status);
CREATE INDEX expenses_submitted_by_idx ON public.expenses(submitted_by);

-- Wage log entries (manually recorded by owner/manager)
CREATE TABLE public.wage_entries (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  profile_id   uuid NOT NULL REFERENCES public.profiles(id),
  job_id       uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  pay_type     text NOT NULL CHECK (pay_type IN ('hourly', 'per_job')),
  hours        numeric CHECK (hours > 0),
  rate_cents   integer NOT NULL CHECK (rate_cents > 0),
  total_cents  integer NOT NULL CHECK (total_cents > 0),
  period_date  date NOT NULL DEFAULT current_date,
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX wage_entries_company_id_idx  ON public.wage_entries(company_id);
CREATE INDEX wage_entries_profile_id_idx  ON public.wage_entries(profile_id);
CREATE INDEX wage_entries_period_date_idx ON public.wage_entries(period_date);

-- ================================================================
-- RLS for expenses
-- ================================================================
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expenses: members can select"
  ON public.expenses FOR SELECT
  USING (company_id = public.my_company_id());

CREATE POLICY "expenses: crew can insert own"
  ON public.expenses FOR INSERT
  WITH CHECK (
    company_id = public.my_company_id()
    AND submitted_by = auth.uid()
  );

CREATE POLICY "expenses: owner/manager can update"
  ON public.expenses FOR UPDATE
  USING (
    company_id = public.my_company_id()
    AND public.my_role() IN ('owner', 'manager')
  );

CREATE POLICY "expenses: owner/manager can delete"
  ON public.expenses FOR DELETE
  USING (
    company_id = public.my_company_id()
    AND public.my_role() IN ('owner', 'manager')
  );

-- ================================================================
-- RLS for wage_entries
-- ================================================================
ALTER TABLE public.wage_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wage_entries: members can select"
  ON public.wage_entries FOR SELECT
  USING (company_id = public.my_company_id());

CREATE POLICY "wage_entries: owner/manager can insert"
  ON public.wage_entries FOR INSERT
  WITH CHECK (
    company_id = public.my_company_id()
    AND public.my_role() IN ('owner', 'manager')
  );

CREATE POLICY "wage_entries: owner/manager can update"
  ON public.wage_entries FOR UPDATE
  USING (
    company_id = public.my_company_id()
    AND public.my_role() IN ('owner', 'manager')
  );

CREATE POLICY "wage_entries: owner/manager can delete"
  ON public.wage_entries FOR DELETE
  USING (
    company_id = public.my_company_id()
    AND public.my_role() IN ('owner', 'manager')
  );
