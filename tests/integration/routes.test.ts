import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as authModule from '@/backend/auth';
import { productService } from '@/backend/services/products';
import { planService } from '@/backend/services/plans';
import { taxRuleService } from '@/backend/services/tax-rules';
import { discountService } from '@/backend/services/discounts';

// Route handlers
import { GET as getProducts, POST as postProduct } from '@/app/api/products/route';
import { GET as getProductById, PATCH as patchProduct, DELETE as deleteProduct } from '@/app/api/products/[id]/route';
import { GET as getPlans, POST as postPlan } from '@/app/api/plans/route';
import { GET as getTaxRules, POST as postTaxRule } from '@/app/api/tax-rules/route';
import { GET as getDiscounts, POST as postDiscount } from '@/app/api/discounts/route';

describe('API Route Handlers Integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Default mock: authenticated as admin
    vi.spyOn(authModule, 'requireStaff').mockResolvedValue('admin-user-id');
    vi.spyOn(authModule, 'requireAdmin').mockResolvedValue('admin-user-id');
  });

  describe('Products API', () => {
    it('GET /api/products returns items and pagination metadata', async () => {
      vi.spyOn(productService, 'list').mockResolvedValueOnce({
        items: [
          {
            id: 'p1',
            name: 'Cloud Storage',
            price_minor: 50000,
            cost_minor: 20000,
            active: true,
            variants: [],
          },
        ],
        total: 1,
      });

      const req = new Request('http://localhost:3000/api/products?page=1&page_size=20');
      const res = await getProducts(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data).toHaveLength(1);
      expect(json.meta).toMatchObject({ total: 1, page: 1, pageSize: 20 });
    });

    it('POST /api/products creates product and returns 201', async () => {
      const mockCreated = {
        id: 'p-new',
        name: 'Enterprise ERP',
        price_minor: 200000,
        cost_minor: 80000,
        active: true,
        variants: [{ id: 'v1', product_id: 'p-new', name: 'Odoo', price_delta_minor: 56000 }],
      };

      vi.spyOn(productService, 'create').mockResolvedValueOnce(mockCreated as any);

      const req = new Request('http://localhost:3000/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Enterprise ERP',
          price_minor: 200000,
          cost_minor: 80000,
          variants: [{ name: 'Odoo', price_delta_minor: 56000 }],
        }),
      });

      const res = await postProduct(req);
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.success).toBe(true);
      expect(json.data.id).toBe('p-new');
      expect(json.data.variants).toHaveLength(1);
    });

    it('GET /api/products/:id returns product details', async () => {
      vi.spyOn(productService, 'getById').mockResolvedValueOnce({
        id: 'p1',
        name: 'Cloud Storage',
        price_minor: 50000,
        cost_minor: 20000,
        active: true,
        variants: [],
      });

      const req = new Request('http://localhost:3000/api/products/p1');
      const res = await getProductById(req, { params: { id: 'p1' } });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.id).toBe('p1');
    });

    it('PATCH /api/products/:id updates product', async () => {
      vi.spyOn(productService, 'update').mockResolvedValueOnce({
        id: 'p1',
        name: 'Cloud Storage Pro',
        price_minor: 60000,
        cost_minor: 20000,
        active: true,
      });

      const req = new Request('http://localhost:3000/api/products/p1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Cloud Storage Pro', price_minor: 60000 }),
      });

      const res = await patchProduct(req, { params: { id: 'p1' } });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.name).toBe('Cloud Storage Pro');
    });
  });

  describe('Plans API', () => {
    it('GET /api/plans returns plan items', async () => {
      vi.spyOn(planService, 'list').mockResolvedValueOnce({
        items: [
          {
            id: 'plan-1',
            name: 'Gold Monthly',
            billing_frequency: 'monthly',
            base_fee_minor: 299900,
            minimum_quantity: 1,
            allow_pause: true,
            allow_early_close: false,
            allow_renewal: true,
            auto_close_on_expiry: false,
            active: true,
          },
        ],
        total: 1,
      });

      const req = new Request('http://localhost:3000/api/plans');
      const res = await getPlans(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data).toHaveLength(1);
      expect(json.data[0].billing_frequency).toBe('monthly');
    });

    it('POST /api/plans creates plan and returns 201', async () => {
      const mockPlan = {
        id: 'plan-new',
        name: 'Startup Weekly',
        billing_frequency: 'weekly',
        base_fee_minor: 99900,
        minimum_quantity: 1,
        allow_pause: false,
        allow_early_close: false,
        allow_renewal: true,
        auto_close_on_expiry: true,
        active: true,
      };

      vi.spyOn(planService, 'create').mockResolvedValueOnce(mockPlan as any);

      const req = new Request('http://localhost:3000/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Startup Weekly',
          billing_frequency: 'weekly',
          base_fee_minor: 99900,
          minimum_quantity: 1,
        }),
      });

      const res = await postPlan(req);
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.data.id).toBe('plan-new');
    });
  });

  describe('Tax Rules API', () => {
    it('GET /api/tax-rules returns list', async () => {
      vi.spyOn(taxRuleService, 'list').mockResolvedValueOnce({
        items: [{ id: 'tax-1', name: 'GST 18%', rate_basis_points: 1800, active: true }],
        total: 1,
      });

      const req = new Request('http://localhost:3000/api/tax-rules');
      const res = await getTaxRules(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data[0].rate_basis_points).toBe(1800);
    });

    it('POST /api/tax-rules creates tax rule and returns 201', async () => {
      vi.spyOn(taxRuleService, 'create').mockResolvedValueOnce({
        id: 'tax-new',
        name: 'VAT 5%',
        rate_basis_points: 500,
        active: true,
      });

      const req = new Request('http://localhost:3000/api/tax-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'VAT 5%', rate_basis_points: 500 }),
      });

      const res = await postTaxRule(req);
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.data.rate_basis_points).toBe(500);
    });
  });

  describe('Discounts API', () => {
    it('GET /api/discounts returns discount rules', async () => {
      vi.spyOn(discountService, 'list').mockResolvedValueOnce({
        items: [
          {
            id: 'disc-1',
            name: 'Launch Discount',
            discount_type: 'percentage',
            value: 15,
            starts_at: '2026-01-01',
            ends_at: '2026-03-31',
            used_count: 5,
            active: true,
          },
        ],
        total: 1,
      });

      const req = new Request('http://localhost:3000/api/discounts');
      const res = await getDiscounts(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data[0].name).toBe('Launch Discount');
    });

    it('POST /api/discounts creates discount rule and returns 201', async () => {
      vi.spyOn(discountService, 'create').mockResolvedValueOnce({
        id: 'disc-new',
        name: 'Festival 10%',
        discount_type: 'percentage',
        value: 10,
        starts_at: '2026-10-01',
        ends_at: '2026-10-31',
        used_count: 0,
        active: true,
      });

      const req = new Request('http://localhost:3000/api/discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Festival 10%',
          discount_type: 'percentage',
          value: 10,
          starts_at: '2026-10-01',
          ends_at: '2026-10-31',
        }),
      });

      const res = await postDiscount(req);
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.data.value).toBe(10);
    });
  });
});
