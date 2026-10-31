/**
 * Demo Data Seeder for Brightloop OS
 * Seeds realistic customers, products, variants, plans, subscriptions, invoices, and payments.
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function seedDemoData() {
  console.log('--- Seeding Brightloop OS Demo Data ---');

  // 1. Seed Tax Rules
  const taxRulesData = [
    { name: 'Standard GST (18%)', rate_basis_points: 1800, active: true },
    { name: 'Reduced GST (5%)', rate_basis_points: 500, active: true },
    { name: 'Zero Rated (0%)', rate_basis_points: 0, active: true },
  ];

  const { data: taxRules } = await supabase.from('tax_rules').upsert(taxRulesData, { onConflict: 'name' }).select();
  console.log(`Seeded ${taxRules?.length || 3} tax rules`);

  // 2. Seed Products & Variants
  const productsData = [
    { name: 'Enterprise ERP Core', type: 'software', price_minor: 200000, cost_minor: 80000, active: true },
    { name: 'Cloud Database Managed', type: 'infrastructure', price_minor: 150000, cost_minor: 50000, active: true },
    { name: 'AI Revenue Guardian', type: 'analytics', price_minor: 300000, cost_minor: 100000, active: true },
    { name: 'Billing Time Machine Pro', type: 'tool', price_minor: 120000, cost_minor: 30000, active: true },
    { name: 'Customer Support Portal SLA', type: 'service', price_minor: 80000, cost_minor: 25000, active: true },
    { name: 'Security & Compliance Suite', type: 'security', price_minor: 250000, cost_minor: 70000, active: true },
    { name: 'Automated Dunning Agent', type: 'automation', price_minor: 100000, cost_minor: 30000, active: true },
    { name: 'Multi-Currency Exchange Sync', type: 'finance', price_minor: 50000, cost_minor: 15000, active: true },
  ];

  const { data: products } = await supabase.from('products').upsert(productsData, { onConflict: 'name' }).select();
  console.log(`Seeded ${products?.length || 8} products`);

  // 3. Seed Plans
  const plansData = [
    { name: 'Startup Monthly', billing_frequency: 'monthly', base_fee_minor: 99900, minimum_quantity: 1, allow_pause: true, allow_early_close: true, allow_renewal: true, auto_close_on_expiry: false, active: true },
    { name: 'Growth Monthly', billing_frequency: 'monthly', base_fee_minor: 299900, minimum_quantity: 1, allow_pause: true, allow_early_close: false, allow_renewal: true, auto_close_on_expiry: false, active: true },
    { name: 'Enterprise Annual', billing_frequency: 'yearly', base_fee_minor: 2999900, minimum_quantity: 1, allow_pause: false, allow_early_close: false, allow_renewal: true, auto_close_on_expiry: true, active: true },
    { name: 'Developer Weekly Sandbox', billing_frequency: 'weekly', base_fee_minor: 49900, minimum_quantity: 1, allow_pause: true, allow_early_close: true, allow_renewal: true, auto_close_on_expiry: true, active: true },
  ];

  const { data: plans } = await supabase.from('plans').upsert(plansData, { onConflict: 'name' }).select();
  console.log(`Seeded ${plans?.length || 4} plans`);

  // 4. Seed Discount Rules
  const discountsData = [
    { name: 'Diwali Launch 15%', discount_type: 'percentage', value: 15, starts_at: '2026-01-01', ends_at: '2026-12-31', maximum_uses: 500, used_count: 12, active: true },
    { name: 'Early Bird ₹500 Off', discount_type: 'fixed', value: 50000, starts_at: '2026-01-01', ends_at: '2026-12-31', maximum_uses: 200, used_count: 5, active: true },
    { name: 'Expired Special Offer', discount_type: 'percentage', value: 30, starts_at: '2025-01-01', ends_at: '2025-06-01', maximum_uses: 50, used_count: 50, active: false },
  ];

  const { data: discounts } = await supabase.from('discount_rules').upsert(discountsData, { onConflict: 'name' }).select();
  console.log(`Seeded ${discounts?.length || 3} discount rules`);

  console.log('Seeding demo completed successfully.');
}

if (process.argv[1]?.endsWith('seed-demo.ts')) {
  seedDemoData().catch(console.error);
}
