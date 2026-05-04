-- ============================================================
-- 003_realtime.sql
-- Enables Supabase Realtime publication for the jobs table.
-- Run this after 002_rls.sql.
-- ============================================================

-- Add jobs table to the realtime publication so the owner
-- dashboard receives live status updates from crew actions.
ALTER PUBLICATION supabase_realtime ADD TABLE public.jobs;
