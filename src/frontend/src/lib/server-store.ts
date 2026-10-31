import {
  INITIAL_CUSTOMERS,
  INITIAL_PRODUCTS,
  INITIAL_PLANS,
  INITIAL_TAX_RULES,
  INITIAL_DISCOUNT_RULES,
  INITIAL_QUOTATION_TEMPLATES,
  INITIAL_SUBSCRIPTIONS,
  INITIAL_INVOICES,
  INITIAL_PAYMENTS,
  INITIAL_GUARDIAN_ISSUES,
  INITIAL_ANALYTICS,
  INITIAL_STAFF,
} from "./demo-fixtures";
import {
  Customer,
  Product,
  SubscriptionPlan,
  TaxRule,
  DiscountRule,
  QuotationTemplate,
  Subscription,
  Invoice,
  Payment,
  RevenueAnalytics,
  GuardianIssue,
  TimeMachineRunResult,
  StaffAccount,
  SubscriptionStatus,
} from "@/types";

// In-memory persistent singleton for the Next.js runtime
class Store {
  customers: Customer[] = [...INITIAL_CUSTOMERS];
  products: Product[] = [...INITIAL_PRODUCTS];
  plans: SubscriptionPlan[] = [...INITIAL_PLANS];
  taxRules: TaxRule[] = [...INITIAL_TAX_RULES];
  discountRules: DiscountRule[] = [...INITIAL_DISCOUNT_RULES];
  quotationTemplates: QuotationTemplate[] = [...INITIAL_QUOTATION_TEMPLATES];
  subscriptions: Subscription[] = [...INITIAL_SUBSCRIPTIONS];
  invoices: Invoice[] = [...INITIAL_INVOICES];
  payments: Payment[] = [...INITIAL_PAYMENTS];
  guardianIssues: GuardianIssue[] = [...INITIAL_GUARDIAN_ISSUES];
  billingRuns: TimeMachineRunResult[] = [];
  staff: StaffAccount[] = [...INITIAL_STAFF];
  simulatedDate: string = "2026-10-31"; // Default demo clock date

  // Products
  getProducts(): Product[] {
    return this.products;
  }

  createProduct(data: Partial<Product>): Product {
    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      name: data.name || "Untitled Product",
      type: data.type || "software",
      sales_price_minor: data.sales_price_minor || 0,
      cost_price_minor: data.cost_price_minor || 0,
      description: data.description,
      status: "active",
      variants: data.variants || [],
      created_at: new Date().toISOString(),
    };
    this.products.unshift(newProduct);
    return newProduct;
  }

  updateProduct(id: string, data: Partial<Product>): Product | null {
    const idx = this.products.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    this.products[idx] = { ...this.products[idx], ...data };
    return this.products[idx];
  }

  // Plans
  getPlans(): SubscriptionPlan[] {
    return this.plans;
  }

  createPlan(data: Partial<SubscriptionPlan>): SubscriptionPlan {
    const newPlan: SubscriptionPlan = {
      id: `plan-${Date.now()}`,
      name: data.name || "New Plan",
      description: data.description,
      frequency: data.frequency || "monthly",
      min_quantity: data.min_quantity || 1,
      price_minor: data.price_minor || 0,
      start_date: data.start_date || this.simulatedDate,
      end_date: data.end_date,
      allow_pause: data.allow_pause ?? true,
      allow_renewal: data.allow_renewal ?? true,
      allow_early_closure: data.allow_early_closure ?? true,
      auto_close_on_expiry: data.auto_close_on_expiry ?? false,
      status: "active",
      created_at: new Date().toISOString(),
    };
    this.plans.unshift(newPlan);
    return newPlan;
  }

  // Tax & Discount Rules
  getTaxRules(): TaxRule[] {
    return this.taxRules;
  }

  createTaxRule(data: Partial<TaxRule>): TaxRule {
    const newTax: TaxRule = {
      id: `tax-${Date.now()}`,
      name: data.name || "Tax Rule",
      rate_percentage: data.rate_percentage ?? 18,
      is_active: data.is_active ?? true,
    };
    this.taxRules.unshift(newTax);
    return newTax;
  }

  getDiscounts(): DiscountRule[] {
    return this.discountRules;
  }

  createDiscount(data: Partial<DiscountRule>): DiscountRule {
    const newDisc: DiscountRule = {
      id: `disc-${Date.now()}`,
      name: data.name || "Special Discount",
      type: data.type || "percentage",
      value: data.value ?? 10,
      min_quantity: data.min_quantity,
      min_purchase_minor: data.min_purchase_minor,
      start_date: data.start_date,
      expiry_date: data.expiry_date,
      max_uses: data.max_uses,
      used_count: 0,
      scope: data.scope || "whole_subscription",
      applicable_product_id: data.applicable_product_id,
      is_active: true,
    };
    this.discountRules.unshift(newDisc);
    return newDisc;
  }

  // Customers
  getCustomers(): Customer[] {
    return this.customers;
  }

  createCustomer(data: Partial<Customer>): Customer {
    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      company_name: data.company_name || "New Client",
      contact_name: data.contact_name || "",
      email: data.email || "",
      billing_address: data.billing_address,
      notes: data.notes,
      active_subscriptions_count: 0,
      total_outstanding_minor: 0,
      status: "active",
      created_at: new Date().toISOString(),
    };
    this.customers.unshift(newCust);
    return newCust;
  }

  // Subscriptions
  getSubscriptions(): Subscription[] {
    return this.subscriptions;
  }

  getSubscription(id: string): Subscription | null {
    return this.subscriptions.find((s) => s.id === id || s.subscription_number === id) || null;
  }

  createSubscription(data: Partial<Subscription>): Subscription {
    const subNumber = `SUB-${1000 + this.subscriptions.length + 1}`;
    const sub: Subscription = {
      id: `sub-${Date.now()}`,
      subscription_number: subNumber,
      customer_id: data.customer_id || "cust-1",
      customer_name: data.customer_name || "Unknown Customer",
      customer_email: data.customer_email || "billing@customer.com",
      plan_id: data.plan_id || "plan-1",
      plan_name: data.plan_name || "Business Pro Monthly",
      frequency: data.frequency || "monthly",
      recurring_amount_minor: data.recurring_amount_minor || 0,
      start_date: data.start_date || this.simulatedDate,
      expiry_date: data.expiry_date || "2027-10-31",
      next_billing_date: data.next_billing_date || this.simulatedDate,
      payment_terms: data.payment_terms || "Net 15",
      status: data.status || "active",
      discount_id: data.discount_id,
      discount_name: data.discount_name,
      valid_until: data.valid_until,
      items: data.items || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      notes: data.notes,
    };
    this.subscriptions.unshift(sub);

    // Update customer subscription count
    const cust = this.customers.find((c) => c.id === sub.customer_id);
    if (cust && sub.status === "active") {
      cust.active_subscriptions_count += 1;
    }

    return sub;
  }

  updateSubscription(id: string, data: Partial<Subscription>): Subscription | null {
    const idx = this.subscriptions.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    this.subscriptions[idx] = {
      ...this.subscriptions[idx],
      ...data,
      updated_at: new Date().toISOString(),
    };
    return this.subscriptions[idx];
  }

  transitionSubscription(id: string, action: string): Subscription | null {
    const sub = this.subscriptions.find((s) => s.id === id || s.subscription_number === id);
    if (!sub) return null;

    let newStatus: SubscriptionStatus = sub.status;
    if (action === "confirm_quotation" || action === "confirm") {
      newStatus = "confirmed";
    } else if (action === "activate") {
      newStatus = "active";
    } else if (action === "pause") {
      newStatus = "paused";
    } else if (action === "resume") {
      newStatus = "active";
    } else if (action === "close" || action === "cancel") {
      newStatus = "closed";
    } else if (action === "renew") {
      newStatus = "active";
      // Advance expiry date
      const d = new Date(sub.expiry_date);
      d.setFullYear(d.getFullYear() + 1);
      sub.expiry_date = d.toISOString().split("T")[0];
    }

    sub.status = newStatus;
    sub.updated_at = new Date().toISOString();
    return sub;
  }

  // Quotation Templates
  getQuotationTemplates(): QuotationTemplate[] {
    return this.quotationTemplates;
  }

  createQuotationTemplate(data: Partial<QuotationTemplate>): QuotationTemplate {
    const tpl: QuotationTemplate = {
      id: `quot-tpl-${Date.now()}`,
      name: data.name || "Standard Quotation",
      plan_id: data.plan_id || "plan-1",
      validity_days: data.validity_days || 15,
      items: data.items || [],
    };
    this.quotationTemplates.unshift(tpl);
    return tpl;
  }

  // Invoices
  getInvoices(filters?: { status?: string; customer_id?: string; subscription_id?: string }): Invoice[] {
    let result = [...this.invoices];
    if (filters?.status) {
      result = result.filter((i) => i.status === filters.status);
    }
    if (filters?.customer_id) {
      result = result.filter((i) => i.customer_id === filters.customer_id);
    }
    if (filters?.subscription_id) {
      result = result.filter((i) => i.subscription_id === filters.subscription_id);
    }
    return result;
  }

  getInvoice(id: string): Invoice | null {
    return this.invoices.find((i) => i.id === id || i.invoice_number === id) || null;
  }

  updateInvoice(id: string, data: Partial<Invoice>): Invoice | null {
    const idx = this.invoices.findIndex((i) => i.id === id);
    if (idx === -1) return null;
    this.invoices[idx] = { ...this.invoices[idx], ...data };
    return this.invoices[idx];
  }

  // Payments
  getPayments(): Payment[] {
    return this.payments;
  }

  recordPayment(data: {
    invoice_id: string;
    amount_minor: number;
    payment_method: Payment["payment_method"];
    payment_date: string;
    reference_number: string;
    notes?: string;
  }): { payment: Payment; invoice: Invoice } | null {
    const invoice = this.invoices.find((i) => i.id === data.invoice_id || i.invoice_number === data.invoice_id);
    if (!invoice) return null;

    const payment: Payment = {
      id: `pay-${Date.now()}`,
      invoice_id: invoice.id,
      invoice_number: invoice.invoice_number,
      customer_name: invoice.customer_name,
      amount_minor: data.amount_minor,
      payment_method: data.payment_method || "bank_transfer",
      payment_date: data.payment_date || this.simulatedDate,
      reference_number: data.reference_number || `REF-${Math.floor(Math.random() * 1000000)}`,
      notes: data.notes,
      created_at: new Date().toISOString(),
    };
    this.payments.unshift(payment);

    // Update invoice paid and outstanding
    invoice.amount_paid_minor += data.amount_minor;
    invoice.outstanding_minor = Math.max(0, invoice.total_minor - invoice.amount_paid_minor);
    if (invoice.outstanding_minor === 0) {
      invoice.status = "paid";
      invoice.is_overdue = false;
    }
    invoice.payments.push({
      id: payment.id,
      amount_minor: payment.amount_minor,
      payment_method: payment.payment_method,
      payment_date: payment.payment_date,
      reference_number: payment.reference_number,
      notes: payment.notes,
    });

    // Update customer outstanding
    const cust = this.customers.find((c) => c.id === invoice.customer_id);
    if (cust) {
      cust.total_outstanding_minor = Math.max(0, cust.total_outstanding_minor - data.amount_minor);
    }

    return { payment, invoice };
  }

  // Analytics
  getAnalytics(): RevenueAnalytics {
    let activeSubs = 0;
    let totalOutstanding = 0;

    for (const sub of this.subscriptions) {
      if (sub.status === "active") activeSubs++;
    }

    for (const inv of this.invoices) {
      if (inv.status !== "paid" && inv.status !== "canceled") {
        totalOutstanding += inv.outstanding_minor;
      }
    }

    const openGuardian = this.guardianIssues.filter((g) => !g.is_resolved);
    const urgentGuardian = openGuardian.filter((g) => g.severity === "critical");

    return {
      ...INITIAL_ANALYTICS,
      active_subscriptions: activeSubs > 0 ? activeSubs : INITIAL_ANALYTICS.active_subscriptions,
      outstanding_minor: totalOutstanding > 0 ? totalOutstanding : INITIAL_ANALYTICS.outstanding_minor,
      guardian_issues_count: openGuardian.length,
      urgent_guardian_issues_count: urgentGuardian.length,
    };
  }

  // Revenue Guardian
  getGuardianIssues(): GuardianIssue[] {
    return this.guardianIssues;
  }

  recoverIssue(issueId: string): { issue: GuardianIssue; invoice?: Invoice } | null {
    const issue = this.guardianIssues.find((g) => g.id === issueId);
    if (!issue) return null;

    issue.is_resolved = true;
    issue.severity = "resolved";
    issue.resolved_at = new Date().toISOString();

    // If it was a missing invoice for a subscription, generate the recovered invoice!
    let generatedInvoice: Invoice | undefined;
    if (issue.type === "missing_invoice" && issue.subscription_id) {
      const sub = this.subscriptions.find((s) => s.id === issue.subscription_id);
      if (sub) {
        const invNum = `INV-${3000 + this.invoices.length + 1}`;
        generatedInvoice = {
          id: `inv-${Date.now()}`,
          invoice_number: invNum,
          subscription_id: sub.id,
          subscription_number: sub.subscription_number,
          customer_id: sub.customer_id,
          customer_name: sub.customer_name,
          customer_email: sub.customer_email,
          issue_date: this.simulatedDate,
          due_date: this.simulatedDate,
          period_start: sub.start_date,
          period_end: sub.next_billing_date,
          subtotal_minor: sub.recurring_amount_minor,
          discount_minor: 0,
          tax_minor: Math.round(sub.recurring_amount_minor * 0.18),
          tax_label: "GST (18%)",
          total_minor: Math.round(sub.recurring_amount_minor * 1.18),
          amount_paid_minor: 0,
          outstanding_minor: Math.round(sub.recurring_amount_minor * 1.18),
          status: "confirmed",
          items: sub.items.map((it) => ({
            id: `ili-${Date.now()}-${Math.random()}`,
            product_name: it.product_name,
            variant_name: it.variant_name,
            base_price_minor: it.unit_price_minor,
            variant_adjustment_minor: 0,
            quantity: it.quantity,
            unit_price_minor: it.unit_price_minor,
            amount_minor: it.amount_minor,
            tax_rate: 18,
          })),
          payments: [],
          is_overdue: false,
        };
        this.invoices.unshift(generatedInvoice);

        // Update customer balance
        const cust = this.customers.find((c) => c.id === sub.customer_id);
        if (cust) {
          cust.total_outstanding_minor += generatedInvoice.total_minor;
        }
      }
    }

    return { issue, invoice: generatedInvoice };
  }

  // Billing Time Machine
  runBilling(asOfDate: string): TimeMachineRunResult {
    this.simulatedDate = asOfDate;
    const simTime = new Date(asOfDate).getTime();

    // Evaluate all active subscriptions
    const activeSubs = this.subscriptions.filter((s) => s.status === "active");

    let invoicesCreated = 0;
    let alreadyBilled = 0;
    let failed = 0;
    let totalInvoicedMinor = 0;
    const createdInvoicesList: Array<{ id: string; invoice_number: string; customer_name: string; total_minor: number }> = [];

    for (const sub of activeSubs) {
      // DUPLICATE BILLING CHECK:
      // Does an invoice already exist for this subscription for this billing period?
      const existing = this.invoices.find(
        (inv) =>
          inv.subscription_id === sub.id &&
          (inv.period_end === asOfDate || inv.issue_date === asOfDate) &&
          inv.status !== "canceled"
      );

      if (existing) {
        alreadyBilled++;
        continue;
      }

      // Check if subscription is due on or before asOfDate
      const nextBillingTime = new Date(sub.next_billing_date).getTime();
      if (nextBillingTime > simTime) {
        continue;
      }

      // Generate Invoice
      const invNum = `INV-${4000 + this.invoices.length + 1}`;
      const periodStart = sub.next_billing_date;
      const subtotal = sub.recurring_amount_minor;
      const taxAmount = Math.round(subtotal * 0.18);
      const totalAmount = subtotal + taxAmount;

      const newInv: Invoice = {
        id: `inv-${Date.now()}-${sub.id}`,
        invoice_number: invNum,
        subscription_id: sub.id,
        subscription_number: sub.subscription_number,
        customer_id: sub.customer_id,
        customer_name: sub.customer_name,
        customer_email: sub.customer_email,
        issue_date: asOfDate,
        due_date: new Date(simTime + 15 * 86400000).toISOString().split("T")[0],
        period_start: periodStart,
        period_end: asOfDate,
        subtotal_minor: subtotal,
        discount_minor: 0,
        tax_minor: taxAmount,
        tax_label: "GST (18%)",
        total_minor: totalAmount,
        amount_paid_minor: 0,
        outstanding_minor: totalAmount,
        status: "confirmed",
        items: sub.items.map((it) => ({
          id: `ili-${Date.now()}-${it.id}`,
          product_name: it.product_name,
          variant_name: it.variant_name,
          base_price_minor: it.unit_price_minor,
          variant_adjustment_minor: 0,
          quantity: it.quantity,
          unit_price_minor: it.unit_price_minor,
          amount_minor: it.amount_minor,
          tax_rate: 18,
        })),
        payments: [],
        is_overdue: false,
      };

      this.invoices.unshift(newInv);
      invoicesCreated++;
      totalInvoicedMinor += totalAmount;
      createdInvoicesList.push({
        id: newInv.id,
        invoice_number: newInv.invoice_number,
        customer_name: newInv.customer_name,
        total_minor: newInv.total_minor,
      });

      // Advance next billing date for subscription (e.g. +1 month or frequency)
      const nextDate = new Date(simTime);
      if (sub.frequency === "daily") nextDate.setDate(nextDate.getDate() + 1);
      else if (sub.frequency === "weekly") nextDate.setDate(nextDate.getDate() + 7);
      else if (sub.frequency === "yearly") nextDate.setFullYear(nextDate.getFullYear() + 1);
      else nextDate.setMonth(nextDate.getMonth() + 1);
      sub.next_billing_date = nextDate.toISOString().split("T")[0];
      sub.updated_at = new Date().toISOString();

      // Update customer outstanding
      const cust = this.customers.find((c) => c.id === sub.customer_id);
      if (cust) {
        cust.total_outstanding_minor += totalAmount;
      }
    }

    const runResult: TimeMachineRunResult = {
      run_id: `RUN-${Date.now().toString(36).toUpperCase()}`,
      simulation_date: asOfDate,
      processed: activeSubs.length,
      invoices_created: invoicesCreated,
      already_billed: alreadyBilled,
      failed,
      total_invoiced_minor: totalInvoicedMinor,
      created_at: new Date().toISOString(),
      invoices: createdInvoicesList,
    };

    this.billingRuns.unshift(runResult);
    return runResult;
  }

  getBillingRuns(): TimeMachineRunResult[] {
    return this.billingRuns;
  }

  // Staff
  getStaff(): StaffAccount[] {
    return this.staff;
  }

  createStaff(name: string, email: string): StaffAccount {
    const newStaff: StaffAccount = {
      id: `staff-${Date.now()}`,
      name,
      email,
      role: "staff",
      status: "active",
      created_at: new Date().toISOString(),
    };
    this.staff.push(newStaff);
    return newStaff;
  }
}

// Global declaration to survive Next.js dev reloads
declare global {
  // eslint-disable-next-line no-var
  var __brightloopStore: Store | undefined;
}

export const serverStore = globalThis.__brightloopStore || new Store();
if (process.env.NODE_ENV !== "production") {
  globalThis.__brightloopStore = serverStore;
}
