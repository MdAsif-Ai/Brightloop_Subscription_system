import { subscriptionService } from './subscriptions';
import { CreateQuotationInput } from '@/backend/validation/subscriptions';
import { Subscription } from '@/shared/types';

export const quotationService = {
  async list(params: {
    limit?: number;
    offset?: number;
    customer_id?: string;
    search?: string;
    requestingUserId?: string;
    requestingRole?: string;
  }): Promise<{ items: Subscription[]; total: number }> {
    return subscriptionService.list({
      ...params,
      status: 'quotation',
    });
  },

  async getById(id: string, requestingUserId?: string, requestingRole?: string): Promise<Subscription> {
    const sub = await subscriptionService.getById(id, requestingUserId, requestingRole);
    return sub;
  },

  async create(payload: CreateQuotationInput, actorId?: string | null): Promise<Subscription> {
    return subscriptionService.create(
      {
        ...payload,
        status: 'quotation',
      },
      actorId
    );
  },

  async confirm(id: string, actorId?: string | null): Promise<Subscription> {
    return subscriptionService.transition(
      id,
      {
        to_status: 'confirmed',
      },
      actorId
    );
  },
};
