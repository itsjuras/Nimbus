-- ============================================================
-- 013_drop_smtp.sql
-- Run after 012_payroll.sql. Safe to re-run.
-- Removes the never-used SMTP columns from 009 — custom email
-- sending is handled by the Gmail integration (migration 010
-- columns google_email / google_refresh_token) instead.
-- ============================================================

ALTER TABLE public.companies
  DROP COLUMN IF EXISTS smtp_host,
  DROP COLUMN IF EXISTS smtp_port,
  DROP COLUMN IF EXISTS smtp_user,
  DROP COLUMN IF EXISTS smtp_pass,
  DROP COLUMN IF EXISTS smtp_secure;
