-- Migration 003_quotation_templates.sql
-- Defines quotation templates used to generate quote invoices before confirmation.

CREATE TABLE public.quotation_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  items JSONB NOT NULL, -- array of {product_id, variant_id, quantity, unit_price_minor, tax_rule_id}
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security for quotation_templates
ALTER TABLE public.quotation_templates ENABLE ROW LEVEL SECURITY;

-- RLS policy: allow owners (customer) to manage their own templates via a linking table (quotation_template_customers)
CREATE TABLE public.quotation_template_customers (
  quotation_template_id UUID NOT NULL REFERENCES public.quotation_templates(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  PRIMARY KEY (quotation_template_id, customer_id)
);

ALTER TABLE public.quotation_template_customers ENABLE ROW LEVEL SECURITY;

-- Policy allowing a customer to select their own templates
CREATE POLICY "customer_select_template" ON public.quotation_template_customers
  FOR SELECT USING (auth.uid() = customer_id);

-- Policy allowing a customer to insert a link (assign a template to themselves)
CREATE POLICY "customer_insert_template" ON public.quotation_template_customers
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- Policy allowing a customer to delete their own link
CREATE POLICY "customer_delete_template" ON public.quotation_template_customers
  FOR DELETE USING (auth.uid() = customer_id);

-- Grant appropriate privileges to anon and authenticated roles
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quotation_templates TO anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.quotation_template_customers TO anon, authenticated;
