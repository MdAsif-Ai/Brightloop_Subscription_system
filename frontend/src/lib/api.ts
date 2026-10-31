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
} from "@/types";

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    let errorMsg = `Request failed with status ${res.status}`;
    try {
      const data = await res.json();
      if (data.error) errorMsg = data.error;
    } catch {
      // ignore
    }
    throw new ApiError(errorMsg, res.status);
  }

  return res.json();
}

export const api = {
  products: {
    list: async (): Promise<Product[]> => {
      return request<Product[]>("/api/products");
    },
    create: async (data: Partial<Product>): Promise<Product> => {
      return request<Product[]>("/api/products", {
        method: "POST",
        body: JSON.stringify(data),
      }) as unknown as Promise<Product>;
    },
    patch: async (id: string, data: Partial<Product>): Promise<Product> => {
      return request<Product>(`/api/products/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
  },

  plans: {
    list: async (): Promise<SubscriptionPlan[]> => {
      return request<SubscriptionPlan[]>("/api/plans");
    },
    create: async (data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> => {
      return request<SubscriptionPlan>("/api/plans", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    patch: async (id: string, data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> => {
      return request<SubscriptionPlan>(`/api/plans/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
  },

  taxRules: {
    list: async (): Promise<TaxRule[]> => {
      return request<TaxRule[]>("/api/tax-rules");
    },
    create: async (data: Partial<TaxRule>): Promise<TaxRule> => {
      return request<TaxRule>("/api/tax-rules", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
  },

  discounts: {
    list: async (): Promise<DiscountRule[]> => {
      return request<DiscountRule[]>("/api/discounts");
    },
    create: async (data: Partial<DiscountRule>): Promise<DiscountRule> => {
      return request<DiscountRule>("/api/discounts", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
  },

  customers: {
    list: async (): Promise<Customer[]> => {
      return request<Customer[]>("/api/customers");
    },
    create: async (data: Partial<Customer>): Promise<Customer> => {
      return request<Customer>("/api/customers", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
  },

  subscriptions: {
    list: async (filters?: { status?: string; customer_id?: string }): Promise<Subscription[]> => {
      const params = new URLSearchParams();
      if (filters?.status) params.set("status", filters.status);
      if (filters?.customer_id) params.set("customer_id", filters.customer_id);
      const query = params.toString() ? `?${params.toString()}` : "";
      return request<Subscription[]>(`/api/subscriptions${query}`);
    },
    get: async (id: string): Promise<Subscription> => {
      return request<Subscription>(`/api/subscriptions/${id}`);
    },
    create: async (data: Partial<Subscription>): Promise<Subscription> => {
      return request<Subscription>("/api/subscriptions", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    patch: async (id: string, data: Partial<Subscription>): Promise<Subscription> => {
      return request<Subscription>(`/api/subscriptions/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    transition: async (id: string, action: string): Promise<Subscription> => {
      return request<Subscription>(`/api/subscriptions/${id}/transition`, {
        method: "POST",
        body: JSON.stringify({ action }),
      });
    },
  },

  quotations: {
    listTemplates: async (): Promise<QuotationTemplate[]> => {
      return request<QuotationTemplate[]>("/api/quotation-templates");
    },
    createTemplate: async (data: Partial<QuotationTemplate>): Promise<QuotationTemplate> => {
      return request<QuotationTemplate>("/api/quotation-templates", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
  },

  invoices: {
    list: async (filters?: { status?: string; customer_id?: string; subscription_id?: string }): Promise<Invoice[]> => {
      const params = new URLSearchParams();
      if (filters?.status) params.set("status", filters.status);
      if (filters?.customer_id) params.set("customer_id", filters.customer_id);
      if (filters?.subscription_id) params.set("subscription_id", filters.subscription_id);
      const query = params.toString() ? `?${params.toString()}` : "";
      return request<Invoice[]>(`/api/invoices${query}`);
    },
    get: async (id: string): Promise<Invoice> => {
      return request<Invoice>(`/api/invoices/${id}`);
    },
    patch: async (id: string, data: Partial<Invoice>): Promise<Invoice> => {
      return request<Invoice>(`/api/invoices/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
  },

  payments: {
    list: async (): Promise<Payment[]> => {
      return request<Payment[]>("/api/payments");
    },
    create: async (data: {
      invoice_id: string;
      amount_minor: number;
      payment_method: Payment["payment_method"];
      payment_date: string;
      reference_number: string;
      notes?: string;
    }): Promise<{ payment: Payment; invoice: Invoice }> => {
      return request<{ payment: Payment; invoice: Invoice }>("/api/payments", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
  },

  analytics: {
    overview: async (): Promise<RevenueAnalytics> => {
      return request<RevenueAnalytics>("/api/analytics");
    },
  },

  guardian: {
    issues: async (): Promise<GuardianIssue[]> => {
      return request<GuardianIssue[]>("/api/guardian");
    },
    recover: async (issue_id: string): Promise<{ issue: GuardianIssue; invoice?: Invoice }> => {
      return request<{ issue: GuardianIssue; invoice?: Invoice }>("/api/guardian/recover", {
        method: "POST",
        body: JSON.stringify({ issue_id }),
      });
    },
  },

  billing: {
    run: async (as_of_date: string): Promise<TimeMachineRunResult> => {
      return request<TimeMachineRunResult>("/api/billing/run", {
        method: "POST",
        body: JSON.stringify({ as_of_date }),
      });
    },
    history: async (): Promise<TimeMachineRunResult[]> => {
      return request<TimeMachineRunResult[]>("/api/billing/run");
    },
  },

  clock: {
    get: async (): Promise<{ date: string }> => {
      return request<{ date: string }>("/api/demo/clock");
    },
    set: async (date: string): Promise<{ date: string }> => {
      return request<{ date: string }>("/api/demo/clock", {
        method: "POST",
        body: JSON.stringify({ date }),
      });
    },
  },

  staff: {
    list: async (): Promise<StaffAccount[]> => {
      return request<StaffAccount[]>("/api/staff");
    },
    create: async (data: { name: string; email: string }): Promise<StaffAccount> => {
      return request<StaffAccount>("/api/staff", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
  },
};
