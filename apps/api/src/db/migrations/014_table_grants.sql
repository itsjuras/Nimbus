-- ============================================================
-- 014_table_grants.sql
-- Run after 013_drop_smtp.sql. Safe to re-run.
-- The tables from migrations 007 and 012 were created without the
-- standard Supabase role grants — even service_role was denied,
-- which silently broke expenses, wage logging, and payroll.
-- RLS policies (already in place) remain the real access control
-- for anon/authenticated; these grants restore the baseline.
-- ============================================================

GRANT ALL ON TABLE public.expenses          TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.wage_entries      TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.payroll_runs      TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.payroll_run_items TO anon, authenticated, service_role;
