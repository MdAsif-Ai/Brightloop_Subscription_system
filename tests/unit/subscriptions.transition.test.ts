import { describe, it, expect, vi, beforeEach } from 'vitest';
import { subscriptionService } from '@/backend/services/subscriptions';
import { supabase } from '@/backend/database/client';
import { ValidationError } from '@/backend/services/products';

describe('Subscription State Transitions & Policies', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects invalid state transition (draft -> paused)', async () => {
    vi.spyOn(subscriptionService, 'getById').mockResolvedValueOnce({
      id: 'sub-1',
      number: 'SUB-001',
      status: 'draft',
      start_date: '2026-01-01',
      expiry_date: '2026-12-31',
    } as any);

    await expect(
      subscriptionService.transition('sub-1', { to_status: 'paused' })
    ).rejects.toThrow(ValidationError);
  });

  it('rejects confirmation of an expired quotation', async () => {
    vi.spyOn(subscriptionService, 'getById').mockResolvedValueOnce({
      id: 'quote-1',
      number: 'SUB-QUOTE',
      status: 'quotation',
      start_date: '2026-01-01',
      expiry_date: '2026-12-31',
      quote_valid_until: '2026-01-15', // Past date relative to today
    } as any);

    await expect(
      subscriptionService.transition('quote-1', { to_status: 'confirmed' })
    ).rejects.toThrow(/Quotation expired/);
  });

  it('rejects pausing if plan policy disallows pausing', async () => {
    vi.spyOn(subscriptionService, 'getById').mockResolvedValueOnce({
      id: 'sub-active',
      number: 'SUB-ACTIVE',
      status: 'active',
      start_date: '2026-01-01',
      expiry_date: '2026-12-31',
      plan: {
        name: 'Strict Enterprise',
        allow_pause: false, // Disallowed
      },
    } as any);

    await expect(
      subscriptionService.transition('sub-active', { to_status: 'paused' })
    ).rejects.toThrow(/does not allow pausing/);
  });

  it('rejects early close if plan policy disallows early close before expiry', async () => {
    vi.spyOn(subscriptionService, 'getById').mockResolvedValueOnce({
      id: 'sub-active',
      number: 'SUB-ACTIVE',
      status: 'active',
      start_date: '2026-01-01',
      expiry_date: '2029-12-31', // Far in the future
      plan: {
        name: 'Fixed 3-Year Commitment',
        allow_early_close: false, // Disallowed
      },
    } as any);

    await expect(
      subscriptionService.transition('sub-active', { to_status: 'closed' })
    ).rejects.toThrow(/does not allow early close/);
  });
});
