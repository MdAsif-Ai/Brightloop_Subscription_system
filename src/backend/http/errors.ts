import { ZodError } from 'zod';
import { AuthError } from '@/backend/auth';
import { NotFoundError, ValidationError } from '@/backend/services/products';
import { errorResponse } from './response';

export function handleApiError(err: unknown): Response {
  if (err instanceof ZodError) {
    const messages = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    return errorResponse(messages || 'Validation failed', 400, err.errors, 'VALIDATION_ERROR');
  }

  if (err instanceof AuthError) {
    return errorResponse(err.message, err.status, undefined, err.code);
  }

  if (err instanceof NotFoundError) {
    return errorResponse(err.message, 404, undefined, err.code);
  }

  if (err instanceof ValidationError) {
    return errorResponse(err.message, 400, undefined, err.code);
  }

  const message = err instanceof Error ? err.message : 'Internal Server Error';
  const status = typeof (err as any)?.status === 'number' ? (err as any).status : 500;
  return errorResponse(message, status, undefined, 'INTERNAL_ERROR');
}
