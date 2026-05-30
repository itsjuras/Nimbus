-- ============================================================
-- 008_company_settings.sql
-- Adds configurable email settings to companies table.
-- ============================================================

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS from_email   text,
  ADD COLUMN IF NOT EXISTS company_name text;

COMMENT ON COLUMN public.companies.from_email IS
  'Verified sender address used for outbound emails via Resend. Must be verified in the Resend dashboard.';
COMMENT ON COLUMN public.companies.company_name IS
  'Display name used in emails and reports. Falls back to companies.name if not set.';
