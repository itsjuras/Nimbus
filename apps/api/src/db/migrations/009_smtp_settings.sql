-- ============================================================
-- 009_smtp_settings.sql
-- Replaces from_email with full SMTP credentials per company.
-- ============================================================

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS smtp_host   text,
  ADD COLUMN IF NOT EXISTS smtp_port   integer,
  ADD COLUMN IF NOT EXISTS smtp_user   text,
  ADD COLUMN IF NOT EXISTS smtp_pass   text,
  ADD COLUMN IF NOT EXISTS smtp_secure boolean NOT NULL DEFAULT false;
