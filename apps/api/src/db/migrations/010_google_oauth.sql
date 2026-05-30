-- ============================================================
-- 010_google_oauth.sql
-- Stores Google OAuth tokens per company for Gmail sending.
-- ============================================================

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS google_email         text,
  ADD COLUMN IF NOT EXISTS google_refresh_token text;
