export type UserRole = "admin" | "staff" | "customer";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  business_name?: string;
  role: UserRole;
  avatar_url?: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  price_adjustment_minor: number; // in paise
}

export interface Product {
  id: string;
  name: string;
  type: "software" | "service" | "addon";
  sales_price_minor: number; // in paise (e.g. 200000 = ₹2,000)
  cost_price_minor: number;
  description?: string;
  status: "active" | "archived";
  variants: ProductVariant[];
  created_at?: string;
}

export type BillingFrequency = "daily" | "weekly" | "monthly" | "yearly";

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  frequency: BillingFrequency;
  min_quantity: number;
  price_minor?: number;
  start_date?: string;
  end_date?: string;
  allow_pause: boolean;
  allow_renewal: boolean;
  allow_early_closure: boolean;
  auto_close_on_expiry: boolean;
  status: "active" | "archived";
  created_at?: string;
}

export interface TaxRule {
  id: string;
  name: string;
  rate_percentage: number; // e.g. 18 for 18% GST
  is_active: boolean;
}

export interface DiscountRule {
  id: string;
  name: string;
  type: "percentage" | "fixed";
  value: number; // percentage (e.g. 10 for 10%) or minor amount for fixed
  min_quantity?: number;
  min_purchase_minor?: number;
  start_date?: string;
  expiry_date?: string;
  max_uses?: number;
  used_count?: number;
  scope: "whole_subscription" | "specific_product";
  applicable_product_id?: string;
  is_active: boolean;
}

export interface Customer {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  billing_address?: string;
  notes?: string;
  active_subscriptions_count: number;
  total_outstanding_minor: number;
  status: "active" | "suspended" | "inactive";
  created_at: string;
}

export type SubscriptionStatus =
  | "draft"
  | "quotation"
  | "confirmed"
  | "active"
  | "paused"
  | "closed";

export interface SubscriptionLineItem {
  id: string;
  product_id: string;
  product_name: string;
  variant_id?: string;
  variant_name?: string;
  quantity: number;
  unit_price_minor: number;
  tax_rule_id?: string;
  tax_percentage?: number;
  amount_minor: number;
}

export interface Subscription {
  id: string;
  subscription_number: string; // e.g. SUB-1042
  customer_id: string;
  customer_name: string;
  customer_email: string;
  plan_id: string;
  plan_name: string;
  frequency: BillingFrequency;
  recurring_amount_minor: number;
  start_date: string;
  expiry_date: string;
  next_billing_date: string;
  payment_terms: string;
  status: SubscriptionStatus;
  discount_id?: string;
  discount_name?: string;
  valid_until?: string; // For quotations
  items: SubscriptionLineItem[];
  created_at: string;
  updated_at: string;
  notes?: string;
}

export interface QuotationTemplate {
  id: string;
  name: string;
  plan_id: string;
  validity_days: number;
  items: Array<{
    product_id: string;
    variant_id?: string;
    quantity: number;
  }>;
}

export type InvoiceStatus = "draft" | "confirmed" | "paid" | "canceled";

export interface InvoiceLineItem {
  id: string;
  product_name: string;
  variant_name?: string;
  base_price_minor: number;
  variant_adjustment_minor: number;
  quantity: number;
  unit_price_minor: number;
  amount_minor: number;
  tax_rate?: number;
}

export interface InvoicePaymentRecord {
  id: string;
  amount_minor: number;
  payment_method: string;
  payment_date: string;
  reference_number: string;
  notes?: string;
}

export interface Invoice {
  id: string;
  invoice_number: string; // e.g. INV-2051
  subscription_id: string;
  subscription_number: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  issue_date: string;
  due_date: string;
  period_start: string;
  period_end: string;
  subtotal_minor: number;
  discount_minor: number;
  discount_label?: string;
  tax_minor: number;
  tax_label?: string;
  total_minor: number;
  amount_paid_minor: number;
  outstanding_minor: number;
  status: InvoiceStatus;
  items: InvoiceLineItem[];
  payments: InvoicePaymentRecord[];
  is_overdue?: boolean;
}

export interface Payment {
  id: string;
  invoice_id: string;
  invoice_number: string;
  customer_name: string;
  amount_minor: number;
  payment_method: "bank_transfer" | "upi" | "card" | "cash" | "other";
  payment_date: string;
  reference_number: string;
  notes?: string;
  created_at: string;
}

export interface RevenueAnalytics {
  mrr_minor: number;
  active_subscriptions: number;
  total_collected_minor: number;
  outstanding_minor: number;
  upcoming_renewals_count: number;
  guardian_issues_count: number;
  urgent_guardian_issues_count: number;
  trend: Array<{
    month: string;
    recurring_revenue_minor: number;
    collections_minor: number;
  }>;
  distribution: Array<{
    status: string;
    count: number;
    color: string;
  }>;
  upcoming_renewals: Array<{
    id: string;
    subscription_number: string;
    customer_name: string;
    plan_name: string;
    renewal_date: string;
    amount_minor: number;
    status: SubscriptionStatus;
  }>;
  recent_activity: Array<{
    id: string;
    time: string;
    text: string;
    type: "invoice" | "subscription" | "payment" | "rule";
  }>;
}

export type GuardianSeverity = "critical" | "warning" | "notice" | "resolved";
export type GuardianIssueType =
  | "missing_invoice"
  | "overdue_payment"
  | "expiring_subscription"
  | "billing_failed";
export type GuardianCategory = "billing" | "payments" | "renewals";

export interface GuardianIssue {
  id: string;
  severity: GuardianSeverity;
  type: GuardianIssueType;
  category: GuardianCategory;
  title: string;
  explanation: string;
  subscription_id?: string;
  subscription_number?: string;
  invoice_id?: string;
  invoice_number?: string;
  amount_minor?: number;
  days_overdue?: number;
  days_to_expiry?: number;
  recommended_action: string;
  is_resolved: boolean;
  resolved_at?: string;
}

export interface TimeMachineRunResult {
  run_id: string;
  simulation_date: string;
  processed: number;
  invoices_created: number;
  already_billed: number;
  failed: number;
  total_invoiced_minor: number;
  created_at: string;
  invoices?: Array<{
    id: string;
    invoice_number: string;
    customer_name: string;
    total_minor: number;
  }>;
}

export interface StaffAccount {
  id: string;
  name: string;
  email: string;
  role: "staff" | "admin";
  status: "active" | "invited";
  created_at: string;
}
