import { describe, it, expect } from 'vitest';
import { createCustomerSchema, updateCustomerSchema } from '@/backend/validation/customers';

describe('Customer Validation', () => {
  it('validates a complete customer payload', () => {
    const input = {
      company_name: 'Acme Global Ltd',
      contact_name: 'John Doe',
      email: 'john@acme.com',
      billing_address: '123 Business Park, Mumbai, MH',
      notes: 'Strategic account',
    };

    const parsed = createCustomerSchema.parse(input);
    expect(parsed.email).toBe('john@acme.com');
    expect(parsed.company_name).toBe('Acme Global Ltd');
  });

  it('rejects invalid email address', () => {
    const input = {
      email: 'not-an-email',
      contact_name: 'Jane',
    };

    expect(() => createCustomerSchema.parse(input)).toThrow(/Valid email address is required/);
  });

  it('validates partial update schema', () => {
    const input = {
      billing_address: 'New HQ Tower, Bangalore, KA',
    };

    const parsed = updateCustomerSchema.parse(input);
    expect(parsed.billing_address).toBe('New HQ Tower, Bangalore, KA');
    expect(parsed.email).toBeUndefined();
  });
});
