-- Migration 002_issue_due_invoice.sql
-- Implements atomic invoice generation for a subscription billing period.

-- Function issue_due_invoice(subscription_id UUID, billing_date DATE)
-- Returns JSON with status: 'created', 'already_billed', or 'error' and invoice_id if created.

CREATE OR REPLACE FUNCTION public.issue_due_invoice(
    p_subscription_id UUID,
    p_billing_date DATE
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    sub RECORD;
    plan RECORD;
    subtotal BIGINT := 0;
    discount_amount BIGINT := 0;
    tax_amount BIGINT := 0;
    total BIGINT := 0;
    existing_invoice_id UUID;
    new_invoice_id UUID;
    item RECORD;
    tax_rate_bp INTEGER := 0; -- basis points
BEGIN
    -- Lock subscription row to prevent concurrent billing
    SELECT * INTO sub FROM public.subscriptions WHERE id = p_subscription_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('status', 'error', 'message', 'Subscription not found');
    END IF;

    -- Ensure subscription is in a billable state
    IF sub.status NOT IN ('active') THEN
        RETURN jsonb_build_object('status', 'error', 'message', 'Subscription not active');
    END IF;

    -- Check billing eligibility (next_billing_on <= billing_date)
    IF sub.next_billing_on > p_billing_date THEN
        RETURN jsonb_build_object('status', 'error', 'message', 'Not eligible for billing yet');
    END IF;

    -- Prevent duplicate invoices (unique constraint on subscription_id, period_start)
    SELECT id INTO existing_invoice_id FROM public.invoices
        WHERE subscription_id = p_subscription_id AND period_start = sub.next_billing_on;
    IF existing_invoice_id IS NOT NULL THEN
        RETURN jsonb_build_object('status', 'already_billed', 'invoice_id', existing_invoice_id);
    END IF;

    -- Load plan for frequency handling and optional plan tax rule
    SELECT * INTO plan FROM public.plans WHERE id = sub.plan_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('status', 'error', 'message', 'Plan not found');
    END IF;

    -- Determine tax rate from subscription's tax rule or plan tax rule
    IF sub.plan_tax_rule_id IS NOT NULL THEN
        SELECT rate_basis_points INTO tax_rate_bp FROM public.tax_rules WHERE id = sub.plan_tax_rule_id AND active = TRUE;
    ELSIF sub.discount_rule_id IS NOT NULL THEN
        SELECT rate_basis_points INTO tax_rate_bp FROM public.tax_rules WHERE id = (SELECT tax_rule_id FROM public.discount_rules WHERE id = sub.discount_rule_id) AND active = TRUE;
    END IF;
    IF tax_rate_bp IS NULL THEN
        tax_rate_bp := 0;
    END IF;

    -- Calculate subtotal from subscription_items
    FOR item IN SELECT * FROM public.subscription_items WHERE subscription_id = p_subscription_id LOOP
        subtotal := subtotal + (item.unit_price_minor * item.quantity);
    END LOOP;

    -- Apply discount if any
    IF sub.discount_rule_id IS NOT NULL THEN
        DECLARE
            disc RECORD;
        BEGIN
            SELECT * INTO disc FROM public.discount_rules WHERE id = sub.discount_rule_id AND active = TRUE;
            IF disc.discount_type = 'fixed' THEN
                discount_amount := disc.value;
            ELSIF disc.discount_type = 'percentage' THEN
                discount_amount := (subtotal * disc.value) / 100; -- value stored as percent (e.g., 10 for 10%)
            END IF;
            -- Ensure discount does not exceed subtotal
            IF discount_amount > subtotal THEN
                discount_amount := subtotal;
            END IF;
        END;
    END IF;

    -- Tax on (subtotal - discount)
    tax_amount := ((subtotal - discount_amount) * tax_rate_bp) / 10000; -- basis points to percent

    total := subtotal - discount_amount + tax_amount;

    -- Insert invoice
    INSERT INTO public.invoices (
        id, number, subscription_id, customer_id, period_start, period_end,
        issued_on, due_date, status,
        subtotal_minor, discount_minor, tax_minor, total_minor, created_at
    ) VALUES (
        gen_random_uuid(),
        'INV-' || gen_random_uuid()::text,
        sub.id,
        sub.customer_id,
        sub.next_billing_on,
        sub.next_billing_on, -- For simplicity, period_end equals start; real impl would add frequency
        p_billing_date,
        p_billing_date + INTERVAL '30 days', -- due date 30 days later
        'draft',
        subtotal, discount_amount, tax_amount, total,
        now()
    ) RETURNING id INTO new_invoice_id;

    -- Insert invoice items snapshot
    FOR item IN SELECT * FROM public.subscription_items WHERE subscription_id = p_subscription_id LOOP
        INSERT INTO public.invoice_items (
            id, invoice_id, product_id, product_name, variant_name,
            quantity, unit_price_minor, discount_minor, tax_minor, total_minor, pricing_trace, created_at
        ) VALUES (
            gen_random_uuid(),
            new_invoice_id,
            item.product_id,
            (SELECT name FROM public.products WHERE id = item.product_id),
            (SELECT name FROM public.product_variants WHERE id = item.variant_id),
            item.quantity,
            item.unit_price_minor,
            0,
            0,
            item.unit_price_minor * item.quantity,
            jsonb_build_object(
                'unit_price_minor', item.unit_price_minor,
                'quantity', item.quantity,
                'subtotal_minor', item.unit_price_minor * item.quantity
            ),
            now()
        );
    END LOOP;

    -- Update subscription next billing date based on plan frequency
    IF plan.billing_frequency = 'daily' THEN
        UPDATE public.subscriptions SET next_billing_on = sub.next_billing_on + INTERVAL '1 day' WHERE id = sub.id;
    ELSIF plan.billing_frequency = 'weekly' THEN
        UPDATE public.subscriptions SET next_billing_on = sub.next_billing_on + INTERVAL '1 week' WHERE id = sub.id;
    ELSIF plan.billing_frequency = 'monthly' THEN
        UPDATE public.subscriptions SET next_billing_on = sub.next_billing_on + INTERVAL '1 month' WHERE id = sub.id;
    ELSIF plan.billing_frequency = 'yearly' THEN
        UPDATE public.subscriptions SET next_billing_on = sub.next_billing_on + INTERVAL '1 year' WHERE id = sub.id;
    END IF;

    -- Record audit event
    INSERT INTO public.audit_events (actor_id, entity_type, entity_id, action, details, created_at)
    VALUES (
        NULL,
        'invoice',
        new_invoice_id,
        'created',
        jsonb_build_object('source', 'issue_due_invoice'),
        now()
    );

    RETURN jsonb_build_object('status', 'created', 'invoice_id', new_invoice_id);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('status', 'error', 'message', SQLERRM);
END;
$$;

-- Grant execute to the service role (public schema role handled by Supabase)
REVOKE ALL ON FUNCTION public.issue_due_invoice(UUID, DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.issue_due_invoice(UUID, DATE) TO anon, authenticated, service_role;
