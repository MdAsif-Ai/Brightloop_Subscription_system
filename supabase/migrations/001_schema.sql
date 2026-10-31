/*
  Migration 001_schema.sql
  Creates core tables for Brightloop OS.
  All monetary amounts are stored as BIGINT minor units (paise).
*/

-- Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'customer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT role_check CHECK (role IN ('admin', 'staff', 'customer'))
);

-- customers table
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NULL REFERENCES public.auth.users(id) ON DELETE SET NULL,
  company_name TEXT,
  contact_name TEXT,
  email TEXT NOT NULL,
  billing_address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT email_unique UNIQUE (LOWER(email)),
  CONSTRAINT user_id_unique UNIQUE (user_id)
);

-- products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT,
  price_minor BIGINT NOT NULL CHECK (price_minor >= 0),
  cost_minor BIGINT NOT NULL CHECK (cost_minor >= 0),
  notes TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- product_variants table
CREATE TABLE public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_delta_minor BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- tax_rules table
CREATE TABLE public.tax_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  rate_basis_points INTEGER NOT NULL CHECK (rate_basis_points >= 0),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- currencies table
CREATE TABLE public.currencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  rate_to_base NUMERIC NOT NULL CHECK (rate_to_base > 0),
  symbol TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);




-- discount_rules table
CREATE TABLE public.discount_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('fixed','percentage')),
  value BIGINT NOT NULL CHECK (value >= 0),
  minimum_quantity INTEGER NULL CHECK (minimum_quantity IS NULL OR minimum_quantity > 0),
  minimum_spend_minor BIGINT NULL CHECK (minimum_spend_minor IS NULL OR minimum_spend_minor >= 0),
  starts_at DATE NOT NULL,
  ends_at DATE NOT NULL,
  maximum_uses INTEGER NULL CHECK (maximum_uses IS NULL OR maximum_uses > 0),
  used_count INTEGER NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  product_id UUID NULL REFERENCES public.products(id),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- plans table
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  billing_frequency TEXT NOT NULL CHECK (billing_frequency IN ('daily','weekly','monthly','yearly')),
  base_fee_minor BIGINT NOT NULL CHECK (base_fee_minor >= 0),
  minimum_quantity INTEGER NOT NULL CHECK (minimum_quantity > 0),
  available_from DATE,
  available_until DATE,
  allow_pause BOOLEAN NOT NULL DEFAULT FALSE,
  allow_early_close BOOLEAN NOT NULL DEFAULT FALSE,
  allow_renewal BOOLEAN NOT NULL DEFAULT FALSE,
  auto_close_on_expiry BOOLEAN NOT NULL DEFAULT FALSE,
  tax_rule_id UUID NULL REFERENCES public.tax_rules(id),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- subscriptions table
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number TEXT NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE RESTRICT,
  quotation_template_id UUID NULL,
  status TEXT NOT NULL CHECK (status IN ('draft','quotation','confirmed','active','paused','closed')),
  start_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  next_billing_on DATE NOT NULL,
  billing_anchor_day INTEGER NULL CHECK (billing_anchor_day IS NULL OR billing_anchor_day BETWEEN 1 AND 28),
  payment_terms_days INTEGER NOT NULL CHECK (payment_terms_days >= 0),
  quote_valid_until DATE NULL,
  discount_rule_id UUID NULL REFERENCES public.discount_rules(id),
  base_fee_snapshot_minor BIGINT NOT NULL,
  plan_tax_rule_id UUID NULL REFERENCES public.tax_rules(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- subscription_items table
CREATE TABLE public.subscription_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  variant_id UUID NULL REFERENCES public.product_variants(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_minor BIGINT NOT NULL CHECK (unit_price_minor >= 0),
  tax_rule_id UUID NULL REFERENCES public.tax_rules(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- invoices table
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number TEXT NOT NULL UNIQUE,
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE RESTRICT,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  issued_on DATE NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft','confirmed','paid','canceled')),
  subtotal_minor BIGINT NOT NULL CHECK (subtotal_minor >= 0),
  discount_minor BIGINT NOT NULL CHECK (discount_minor >= 0),
  tax_minor BIGINT NOT NULL CHECK (tax_minor >= 0),
  total_minor BIGINT NOT NULL CHECK (total_minor >= 0),
  sent_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- invoice_items table
CREATE TABLE public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  product_id UUID NULL,
  product_name TEXT NOT NULL,
  variant_name TEXT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_minor BIGINT NOT NULL CHECK (unit_price_minor >= 0),
  discount_minor BIGINT NOT NULL CHECK (discount_minor >= 0),
  tax_minor BIGINT NOT NULL CHECK (tax_minor >= 0),
  total_minor BIGINT NOT NULL CHECK (total_minor >= 0),
  pricing_trace JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE RESTRICT,
  method TEXT NOT NULL CHECK (method IN ('bank_transfer','upi','card','cash','other')),
  amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
  paid_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reference TEXT NULL,
  note TEXT NULL,
  recorded_by UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_reference UNIQUE (reference) DEFERRABLE INITIALLY DEFERRED
);

-- billing_runs table
CREATE TABLE public.billing_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  as_of_date DATE NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ NULL,
  processed_count INTEGER NOT NULL DEFAULT 0,
  created_count INTEGER NOT NULL DEFAULT 0,
  already_billed_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('pending','running','completed','failed')),
  created_by UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- audit_events table
CREATE TABLE public.audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  details JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_subscriptions_status_billing ON public.subscriptions(status, next_billing_on);
CREATE INDEX idx_invoices_customer ON public.invoices(customer_id);
CREATE INDEX idx_invoices_due_date ON public.invoices(due_date);
CREATE INDEX idx_payments_invoice ON public.payments(invoice_id);
CREATE UNIQUE INDEX uq_recurring_invoice_cycle ON public.invoices(subscription_id, period_start);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;
