-- ============================================================
-- 011_reply_to_email.sql
-- Adds reply_to_email per company for platform-sent emails.
-- ============================================================

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS reply_to_email text;
