-- Migration 004_create_subscription.sql
-- Implements a stored procedure to create a subscription with items atomically.

CREATE OR REPLACE FUNCTION public.pg_create_subscription(
    p_number TEXT,
    p_customer_id UUID,
    p_plan_id UUID,
    p_start_date DATE,
    p_expiry_date DATE,
    p_payment_terms_days INTEGER,
    p_discount_rule_id UUID DEFAULT NULL,
    p_items JSONB DEFAULT '[]'::jsonb
) RETURNS TABLE (
    id UUID,
    number TEXT,
    status TEXT,
    start_date DATE,
    expiry_date DATE,
    next_billing_on DATE,
    payment_terms_days INTEGER,
    discount_rule_id UUID,
    base_fee_snapshot_minor BIGINT,
    plan_tax_rule_id UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_plan RECORD;
    v_sub_id UUID;
    v_base_fee BIGINT;
    v_tax_rule UUID;
    v_next_billing DATE;
BEGIN
    -- Validate plan exists and fetch details
    SELECT * INTO v_plan FROM public.plans WHERE id = p_plan_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Plan % not found', p_plan_id;
    END IF;

    -- Determine initial next billing date based on start_date and plan frequency
    v_next_billing := p_start_date; -- simple; real logic could adjust to anchor day

    -- Insert subscription row
    INSERT INTO public.subscriptions (
        id, number, customer_id, plan_id, status, start_date, expiry_date,
        next_billing_on, payment_terms_days, discount_rule_id,
        base_fee_snapshot_minor, plan_tax_rule_id, created_at, updated_at
    ) VALUES (
        gen_random_uuid(), p_number, p_customer_id, p_plan_id,
        'draft', p_start_date, p_expiry_date,
        v_next_billing, p_payment_terms_days, p_discount_rule_id,
        v_plan.base_fee_minor,
        v_plan.tax_rule_id,
        now(), now()
    ) RETURNING * INTO STRICT v_sub_id, number, status, start_date, expiry_date,
        next_billing_on, payment_terms_days, discount_rule_id,
        base_fee_snapshot_minor, plan_tax_rule_id, created_at, updated_at;

    -- Insert subscription items from JSON array
    IF jsonb_array_length(p_items) > 0 THEN
        INSERT INTO public.subscription_items (
            subscription_id, product_id, variant_id, quantity, unit_price_minor, tax_rule_id, created_at
        )
        SELECT
            v_sub_id,
            (item->>'product_id')::uuid,
            NULLIF(item->>'variant_id','')::uuid,
            (item->>'quantity')::int,
            prod.price_minor,
            prod.tax_rule_id,
            now()
        FROM jsonb_to_recordset(p_items) AS item(product_id TEXT, variant_id TEXT, quantity INT)
        JOIN public.products prod ON prod.id = (item->>'product_id')::uuid;
    END IF;

    RETURN QUERY SELECT * FROM public.subscriptions WHERE id = v_sub_id;
END;
$$;

-- Revoke public execute and grant to service role only
REVOKE ALL ON FUNCTION public.pg_create_subscription FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pg_create_subscription TO service_role;
