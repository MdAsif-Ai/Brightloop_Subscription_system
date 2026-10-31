/**
 * Standard JSON response helpers for API routes.
 */
export function successResponse<T>(
  data: T,
  meta?: Record<string, unknown>,
  status: number = 200
): Response {
  return Response.json({ success: true, data, meta }, { status });
}

export function errorResponse(
  message: string,
  status: number = 400,
  details?: unknown,
  code?: string
): Response {
  return Response.json(
    {
      success: false,
      error: {
        message,
        ...(code ? { code } : {}),
        ...(details !== undefined ? { details } : {}),
      },
    },
    { status }
  );
}
