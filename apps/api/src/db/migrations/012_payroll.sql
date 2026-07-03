-- ============================================================
-- 012_payroll.sql
-- Run after 011_reply_to_email.sql. Safe to re-run.
-- Stripe Connect payroll (Canadian rails): company onboarding +
-- funding bank (PAD), crew payout accounts, payroll runs, and
-- wage entry linkage.
-- ============================================================

-- Company: Connect account (KYC) + funding bank for pre-authorized debits
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS stripe_account_id            text,
  ADD COLUMN IF NOT EXISTS stripe_onboarding_complete   boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_customer_id           text,
  ADD COLUMN IF NOT EXISTS stripe_payment_method_id     text,
  ADD COLUMN IF NOT EXISTS stripe_setup_intent_id       text,
  ADD COLUMN IF NOT EXISTS stripe_mandate_id            text,
  ADD COLUMN IF NOT EXISTS bank_status                  text NOT NULL DEFAULT 'none'
                           CHECK (bank_status IN ('none', 'pending_verification', 'verified')),
  ADD COLUMN IF NOT EXISTS bank_last4                   text,
  ADD COLUMN IF NOT EXISTS bank_name                    text;

-- Crew: recipient account + display info (raw bank numbers never stored)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_account_id text,
  ADD COLUMN IF NOT EXISTS bank_last4        text;

-- One row per confirmed payroll run
CREATE TABLE IF NOT EXISTS public.payroll_runs (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id                uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  initiated_by              uuid NOT NULL REFERENCES public.profiles(id),
  period_from               date NOT NULL,
  period_to                 date NOT NULL,
  total_cents               integer NOT NULL CHECK (total_cents > 0),
  status                    text NOT NULL DEFAULT 'funding'
                            CHECK (status IN ('funding', 'paying', 'paid', 'failed')),
  stripe_payment_intent_id  text,
  failure_message           text,
  created_at                timestamptz NOT NULL DEFAULT now(),
  paid_at                   timestamptz
);

CREATE INDEX IF NOT EXISTS payroll_runs_company_id_idx ON public.payroll_runs(company_id);
CREATE INDEX IF NOT EXISTS payroll_runs_status_idx     ON public.payroll_runs(status);

-- Per-crew-member line within a run
CREATE TABLE IF NOT EXISTS public.payroll_run_items (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_run_id      uuid NOT NULL REFERENCES public.payroll_runs(id) ON DELETE CASCADE,
  company_id          uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  profile_id          uuid NOT NULL REFERENCES public.profiles(id),
  amount_cents        integer NOT NULL CHECK (amount_cents > 0),
  status              text NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'paid', 'failed')),
  stripe_transfer_id  text,
  failure_message     text,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payroll_run_items_run_id_idx     ON public.payroll_run_items(payroll_run_id);
CREATE INDEX IF NOT EXISTS payroll_run_items_company_id_idx ON public.payroll_run_items(company_id);

-- Wage entries claimed by a run (NULL = unpaid, eligible for next run)
ALTER TABLE public.wage_entries
  ADD COLUMN IF NOT EXISTS payroll_run_id uuid REFERENCES public.payroll_runs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS wage_entries_payroll_run_id_idx ON public.wage_entries(payroll_run_id);

-- ================================================================
-- RLS for payroll_runs
-- ================================================================
ALTER TABLE public.payroll_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payroll_runs: owner/manager can select" ON public.payroll_runs;
CREATE POLICY "payroll_runs: owner/manager can select"
  ON public.payroll_runs FOR SELECT
  USING (
    company_id = public.my_company_id()
    AND public.my_role() IN ('owner', 'manager')
  );

-- ================================================================
-- RLS for payroll_run_items
-- ================================================================
ALTER TABLE public.payroll_run_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payroll_run_items: owner/manager can select" ON public.payroll_run_items;
CREATE POLICY "payroll_run_items: owner/manager can select"
  ON public.payroll_run_items FOR SELECT
  USING (
    company_id = public.my_company_id()
    AND public.my_role() IN ('owner', 'manager')
  );

DROP POLICY IF EXISTS "payroll_run_items: crew can select own" ON public.payroll_run_items;
CREATE POLICY "payroll_run_items: crew can select own"
  ON public.payroll_run_items FOR SELECT
  USING (
    company_id = public.my_company_id()
    AND profile_id = auth.uid()
  );
