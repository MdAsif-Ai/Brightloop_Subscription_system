# Brightloop OS — Complete API Contract & Backend Specification

This document provides the authoritative REST API specification for all backend modules in Brightloop OS.

- **Base URL:** `/api`
- **Exchange Format:** `application/json`
- **Authentication:** Bearer token in the `Authorization` header (`Authorization: Bearer <SUPABASE_ACCESS_TOKEN>`).
- **Financial Minor Currency Units:** All monetary values are integers representing paise (`₹1 = 100 paise`; `₹2,560 = 256000`).
- **Tax Format:** Expressed in basis points (`18% = 1800 basis points`).
- **Date Format:** `YYYY-MM-DD` ISO 8601 calendar date.

---

## Standard Envelope Formats

### Single Resource
```json
{
  "success": true,
  "data": { ... }
}
```

### Paginated Collection
```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "total": 50,
    "page": 1,
    "pageSize": 20
  }
}
```

### Structured Error
```json
{
  "success": false,
  "error": {
    "message": "Human-readable description",
    "code": "VALIDATION_ERROR | UNAUTHORIZED | FORBIDDEN | NOT_FOUND | INTERNAL_ERROR",
    "details": [ ... ]
  }
}
```

---

## 1. Customers API

| Method | Path | Required Role | Description |
|---|---|---|---|
| `GET` | `/api/customers` | Staff / Admin | Lists customers with search (`company_name`, `contact_name`, `email`) & pagination |
| `POST` | `/api/customers` | Staff / Admin | Creates a customer with duplicate email protection |
| `GET` | `/api/customers/:id` | Authenticated | Customer A cannot view Customer B's record (Customer isolation) |
| `PATCH` | `/api/customers/:id` | Staff / Admin | Updates customer details |
| `DELETE` | `/api/customers/:id` | Staff / Admin | Rejects deletion if financial history (invoices/subscriptions) exists |

### Customer Schema
```typescript
interface Customer {
  id: string;
  user_id?: string | null;
  company_name?: string | null;
  contact_name?: string | null;
  email: string;
  billing_address?: string | null;
  notes?: string | null;
  created_at?: string;
}
```

---

## 2. Quotations API

| Method | Path | Required Role | Description |
|---|---|---|---|
| `GET` | `/api/quotations` | Authenticated | Lists quotations (`status = 'quotation'`) |
| `POST` | `/api/quotations` | Staff / Admin | Creates quotation with items and `quote_valid_until` |
| `GET` | `/api/quotations/:id` | Authenticated | Retrieves quotation details |
| `POST` | `/api/quotations/:id/confirm` | Authenticated | Confirms quotation into subscription; rejects if expired |

---

## 3. Subscriptions API

| Method | Path | Required Role | Description |
|---|---|---|---|
| `GET` | `/api/subscriptions` | Authenticated | Lists subscriptions (filtered to own customer for portal users) |
| `POST` | `/api/subscriptions` | Staff / Admin | Creates subscription with items and trusted price snapshot |
| `GET` | `/api/subscriptions/:id` | Authenticated | Retrieves subscription with nested items, customer, and plan |
| `PATCH` | `/api/subscriptions/:id` | Staff / Admin | Updates subscription dates, terms, and items |
| `POST` | `/api/subscriptions/:id/transition` | Staff / Admin | Enforces valid lifecycle state machine and plan pause/close policies |

### State Transitions
- `draft` → `quotation` | `confirmed` | `closed`
- `quotation` → `confirmed` (enforces `quote_valid_until >= today`) | `closed`
- `confirmed` → `active` | `closed`
- `active` → `paused` (enforces `plan.allow_pause === true`) | `closed` (enforces `plan.allow_early_close`)
- `paused` → `active` | `closed`

---

## 4. Products & Variants API

| Method | Path | Required Role | Description |
|---|---|---|---|
| `GET` | `/api/products` | Staff / Admin | Lists products with nested variants & pagination |
| `POST` | `/api/products` | Admin only | Creates product with nested variants (non-negative price validation) |
| `GET` | `/api/products/:id` | Staff / Admin | Retrieves product by ID |
| `PATCH` | `/api/products/:id` | Admin only | Updates product & replaces/syncs variants |
| `DELETE` | `/api/products/:id` | Admin only | Deletes product |

---

## 5. Subscription Plans API

| Method | Path | Required Role | Description |
|---|---|---|---|
| `GET` | `/api/plans` | Staff / Admin | Lists plans (filters: `billing_frequency`, `active`) |
| `POST` | `/api/plans` | Admin only | Creates plan (`billing_frequency`: daily, weekly, monthly, yearly) |
| `GET` | `/api/plans/:id` | Staff / Admin | Retrieves plan by ID |
| `PATCH` | `/api/plans/:id` | Admin only | Updates plan |
| `DELETE` | `/api/plans/:id` | Admin only | Deletes plan |

---

## 6. Tax Rules API

| Method | Path | Required Role | Description |
|---|---|---|---|
| `GET` | `/api/tax-rules` | Staff / Admin | Lists tax rules |
| `POST` | `/api/tax-rules` | Admin only | Creates tax rule (`rate_basis_points >= 0`, e.g. 1800 for 18%) |
| `GET` | `/api/tax-rules/:id` | Staff / Admin | Retrieves tax rule by ID |
| `PATCH` | `/api/tax-rules/:id`| Admin only | Updates tax rule |
| `DELETE` | `/api/tax-rules/:id`| Admin only | Deletes tax rule |

---

## 7. Discount Rules API

| Method | Path | Required Role | Description |
|---|---|---|---|
| `GET` | `/api/discounts` | Staff / Admin | Lists discounts |
| `POST` | `/api/discounts` | Admin only | Creates discount (percentage: 0-100%, fixed: minor units) |
| `GET` | `/api/discounts/:id` | Staff / Admin | Retrieves discount rule |
| `PATCH` | `/api/discounts/:id`| Admin only | Updates discount rule |
| `DELETE` | `/api/discounts/:id`| Admin only | Deletes discount rule |

---

## 8. Invoices API

| Method | Path | Required Role | Description |
|---|---|---|---|
| `GET` | `/api/invoices` | Authenticated | Lists invoices with `outstanding_minor` (portal users see only their invoices) |
| `GET` | `/api/invoices/:id` | Authenticated | Retrieves invoice with line items, pricing trace, and payment history |
| `PATCH` | `/api/invoices/:id` | Staff / Admin | Updates status (`draft` → `confirmed` → `paid`, or cancellation; cannot cancel `paid`) |

---

## 9. Payments API

| Method | Path | Required Role | Description |
|---|---|---|---|
| `GET` | `/api/payments` | Staff / Admin | Lists recorded payments |
| `POST` | `/api/payments` | Staff / Admin | Records payment, reduces balance, prevents overpayment, auto-marks invoice `paid` |

### Payment Request Body
```json
{
  "invoice_id": "UUID",
  "amount_minor": 2718720,
  "method": "bank_transfer | upi | card | cash | other",
  "reference": "BANK-REF-001",
  "note": "Optional note"
}
```

---

## 10. Atomic Recurring Billing Engine API

| Method | Path | Required Role | Description |
|---|---|---|---|
| `POST` | `/api/billing/run` | Staff / Admin | Runs atomic billing batch as of `as_of_date`; zero duplicate invoices |

### Request Body
```json
{
  "as_of_date": "2026-11-30"
}
```

### Response `200 OK`
```json
{
  "success": true,
  "data": {
    "run_id": "run-uuid",
    "processed": 100,
    "invoices_created": 98,
    "already_billed": 2,
    "failed": 0,
    "total_invoiced_minor": 24500000
  }
}
```

---

## 11. Financial Analytics API

| Method | Path | Required Role | Description |
|---|---|---|---|
| `GET` | `/api/analytics` | Staff / Admin | Returns real-time MRR, ARR, collected, outstanding, overdue, renewals |

### Response `200 OK`
```json
{
  "success": true,
  "data": {
    "active_subscriptions": 25,
    "mrr_minor": 5000000,
    "arr_minor": 60000000,
    "collected_minor": 4200000,
    "outstanding_minor": 1800000,
    "overdue_invoices": 3,
    "upcoming_renewals": 4,
    "monthly_revenue": [
      {
        "month": "2026-10",
        "invoiced_minor": 5200000,
        "collected_minor": 4800000
      }
    ]
  }
}
```

---

## 12. Billing Time Machine Clock API

| Method | Path | Required Role | Description |
|---|---|---|---|
| `GET` | `/api/demo/clock` | Staff / Admin | Returns current simulated clock date |
| `POST` | `/api/demo/clock` | Staff / Admin | Sets or advances simulated date (`{"date": "2026-12-31"}`) or resets (`{"reset": true}`) |

---

## 13. Revenue Guardian & Recovery API

| Method | Path | Required Role | Description |
|---|---|---|---|
| `GET` | `/api/guardian` | Staff / Admin | Scans database for unbilled cycles, overdue invoices, failed runs, expiring subs |
| `POST` | `/api/guardian/recover` | Staff / Admin | Atomically recovers missing invoice for a subscription (`{"subscription_id": "UUID"}`) |

---

## 14. Staff API

| Method | Path | Required Role | Description |
|---|---|---|---|
| `GET` | `/api/staff` | Admin only | Lists staff and admin profiles |
| `POST` | `/api/staff` | Admin only | Creates new staff profile with role assignment |

---

## 15. Shared Types Location

Frontend engineers can import all models from:
```typescript
import type {
  Customer,
  Product,
  ProductVariant,
  Plan,
  TaxRule,
  DiscountRule,
  Subscription,
  SubscriptionItem,
  Invoice,
  InvoiceItem,
  Payment,
  BillingRun,
  AnalyticsResponse,
  GuardianIssue,
  GuardianResponse,
  ApiResponse,
} from '@/shared/types';
```
