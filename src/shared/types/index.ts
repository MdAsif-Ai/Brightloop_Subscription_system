export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  price_delta_minor: number;
  created_at?: string;
}

export interface Product {
  id: string;
  name: string;
  type?: string | null;
  price_minor: number;
  cost_minor: number;
  notes?: string | null;
  active: boolean;
  created_at?: string;
  variants?: ProductVariant[];
}

export type BillingFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Plan {
  id: string;
  name: string;
  description?: string | null;
  billing_frequency: BillingFrequency;
  base_fee_minor: number;
  minimum_quantity: number;
  available_from?: string | null;
  available_until?: string | null;
  allow_pause: boolean;
  allow_early_close: boolean;
  allow_renewal: boolean;
  auto_close_on_expiry: boolean;
  tax_rule_id?: string | null;
  active: boolean;
  created_at?: string;
}

export interface TaxRule {
  id: string;
  name: string;
  rate_basis_points: number; // e.g., 1800 for 18%
  active: boolean;
  created_at?: string;
}

export type DiscountType = 'fixed' | 'percentage';

export interface DiscountRule {
  id: string;
  name: string;
  discount_type: DiscountType;
  value: number; // minor units if fixed, percentage (0-100) if percentage
  minimum_quantity?: number | null;
  minimum_spend_minor?: number | null;
  starts_at: string;
  ends_at: string;
  maximum_uses?: number | null;
  used_count: number;
  product_id?: string | null;
  active: boolean;
  created_at?: string;
}

export interface Customer {
  id: string;
  user_id?: string | null;
  company_name?: string | null;
  contact_name?: string | null;
  email: string;
  billing_address?: string | null;
  notes?: string | null;
  created_at?: string;
}

export type SubscriptionStatus = 'draft' | 'quotation' | 'confirmed' | 'active' | 'paused' | 'closed';

export interface SubscriptionItem {
  id: string;
  subscription_id: string;
  product_id: string;
  variant_id?: string | null;
  quantity: number;
  unit_price_minor: number;
  tax_rule_id?: string | null;
  product_name?: string;
  variant_name?: string;
  created_at?: string;
}

export interface Subscription {
  id: string;
  number: string;
  customer_id: string;
  plan_id: string;
  quotation_template_id?: string | null;
  status: SubscriptionStatus;
  start_date: string;
  expiry_date: string;
  next_billing_on: string;
  billing_anchor_day?: number | null;
  payment_terms_days: number;
  quote_valid_until?: string | null;
  discount_rule_id?: string | null;
  base_fee_snapshot_minor: number;
  plan_tax_rule_id?: string | null;
  created_at?: string;
  updated_at?: string;
  items?: SubscriptionItem[];
  customer?: Customer;
  plan?: Plan;
}

export type InvoiceStatus = 'draft' | 'confirmed' | 'paid' | 'canceled';

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  product_id?: string | null;
  product_name: string;
  variant_name?: string | null;
  quantity: number;
  unit_price_minor: number;
  discount_minor: number;
  tax_minor: number;
  total_minor: number;
  pricing_trace: Record<string, unknown>;
  created_at?: string;
}

export type PaymentMethod = 'bank_transfer' | 'upi' | 'card' | 'cash' | 'other';

export interface Payment {
  id: string;
  invoice_id: string;
  method: PaymentMethod;
  amount_minor: number;
  paid_at: string;
  reference?: string | null;
  note?: string | null;
  recorded_by?: string | null;
  created_at?: string;
}

export interface Invoice {
  id: string;
  number: string;
  subscription_id: string;
  customer_id: string;
  period_start: string;
  period_end: string;
  issued_on: string;
  due_date: string;
  status: InvoiceStatus;
  subtotal_minor: number;
  discount_minor: number;
  tax_minor: number;
  total_minor: number;
  outstanding_minor?: number;
  sent_at?: string | null;
  created_at?: string;
  items?: InvoiceItem[];
  payments?: Payment[];
  customer?: Customer;
  subscription?: Subscription;
}

export type BillingRunStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface BillingRun {
  id: string;
  as_of_date: string;
  started_at: string;
  finished_at?: string | null;
  processed_count: number;
  created_count: number;
  already_billed_count: number;
  failed_count: number;
  status: BillingRunStatus;
  created_by?: string | null;
  total_invoiced_minor?: number;
}

export interface MonthlyRevenuePoint {
  month: string; // YYYY-MM
  invoiced_minor: number;
  collected_minor: number;
}

export interface AnalyticsResponse {
  active_subscriptions: number;
  mrr_minor: number;
  arr_minor: number;
  collected_minor: number;
  outstanding_minor: number;
  overdue_invoices: number;
  upcoming_renewals: number;
  monthly_revenue: MonthlyRevenuePoint[];
}

export type GuardianIssueType = 'missing_invoice' | 'overdue_payment' | 'failed_billing' | 'expiring_subscription';
export type GuardianSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface GuardianIssue {
  id: string;
  type: GuardianIssueType;
  severity: GuardianSeverity;
  title: string;
  description: string;
  entity_id: string;
  entity_type: string;
  subscription_id?: string;
  invoice_id?: string;
  amount_minor?: number;
  recoverable: boolean;
  detected_at: string;
}

export interface GuardianResponse {
  health_score: number; // 0 - 100
  issues: GuardianIssue[];
  summary: {
    total_issues: number;
    at_risk_amount_minor: number;
    critical_count: number;
  };
}

export interface AuditEvent {
  id: string;
  actor_id?: string | null;
  entity_type: string;
  entity_id: string;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
}

export interface PaginationMeta {
  total?: number;
  page: number;
  pageSize: number;
  totalPages?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  meta?: PaginationMeta | Record<string, unknown>;
  error?: {
    code?: string;
    message: string;
    details?: unknown;
  };
}
