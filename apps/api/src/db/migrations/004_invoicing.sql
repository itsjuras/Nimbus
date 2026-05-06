-- ============================================================
-- 004_invoicing.sql
-- Run after 003_realtime.sql.
-- Adds Stripe customer tracking to clients and creates the
-- invoices and invoice_line_items tables.
-- ============================================================

-- Stripe customer ID is lazily created on first invoice per client
ALTER TABLE public.clients
  ADD COLUMN stripe_customer_id text;

-- One invoice per billing event (job completion or manual)
CREATE TABLE public.invoices (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id         uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  client_id          uuid NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  job_id             uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
  stripe_invoice_id  text UNIQUE,
  stripe_invoice_url text,
  status             text NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft', 'sent', 'paid', 'void')),
  currency           text NOT NULL DEFAULT 'usd',
  due_date           timestamptz,
  paid_at            timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX invoices_company_id_idx ON public.invoices(company_id);
CREATE INDEX invoices_client_id_idx  ON public.invoices(client_id);
CREATE INDEX invoices_status_idx     ON public.invoices(status);

-- Line items for each invoice
CREATE TABLE public.invoice_line_items (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id        uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description       text NOT NULL,
  quantity          integer NOT NULL CHECK (quantity > 0),
  unit_amount_cents integer NOT NULL CHECK (unit_amount_cents > 0)
);

CREATE INDEX invoice_line_items_invoice_id_idx ON public.invoice_line_items(invoice_id);

-- ================================================================
-- RLS for invoices
-- ================================================================
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invoices: members can select"
  ON public.invoices FOR SELECT
  USING (company_id = public.my_company_id());

CREATE POLICY "invoices: owner/manager can insert"
  ON public.invoices FOR INSERT
  WITH CHECK (
    company_id = public.my_company_id()
    AND public.my_role() IN ('owner', 'manager')
  );

CREATE POLICY "invoices: owner/manager can update"
  ON public.invoices FOR UPDATE
  USING (
    company_id = public.my_company_id()
    AND public.my_role() IN ('owner', 'manager')
  );

-- ================================================================
-- RLS for invoice_line_items
-- ================================================================
ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invoice_line_items: members can select"
  ON public.invoice_line_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices i
      WHERE i.id = invoice_id
        AND i.company_id = public.my_company_id()
    )
  );

CREATE POLICY "invoice_line_items: owner/manager can insert"
  ON public.invoice_line_items FOR INSERT
  WITH CHECK (
    public.my_role() IN ('owner', 'manager')
    AND EXISTS (
      SELECT 1 FROM public.invoices i
      WHERE i.id = invoice_id
        AND i.company_id = public.my_company_id()
    )
  );
