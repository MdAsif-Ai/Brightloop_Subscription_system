/**
 * Brightloop OS — Server-Side API Adapter
 * 
 * Bridges Next.js 16 frontend Route Handlers with the deployed Next.js 13 backend.
 * When BACKEND_INTERNAL_URL is configured, proxies requests to the deployed backend,
 * normalizes response envelopes ({ success: true, data }), and falls back to serverStore
 * if the remote backend is unconfigured or unreachable.
 */

import { serverStore } from "./server-store";

export const BACKEND_URL =
  process.env.BACKEND_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "";

export const IS_REAL_MODE =
  process.env.APP_MODE === "real" || Boolean(BACKEND_URL);

/**
 * Forward a request to the deployed backend server.
 */
export async function forwardToBackend<T>(
  path: string,
  options?: RequestInit,
  authHeader?: string | null
): Promise<{ success: boolean; data?: T; error?: string; status: number }> {
  if (!BACKEND_URL) {
    return { success: false, status: 503, error: "Backend URL not configured" };
  }

  try {
    const url = `${BACKEND_URL.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
    
    // Construct headers, forwarding auth if provided or using service role token in real mode
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options?.headers as Record<string, string> || {}),
    };

    if (authHeader) {
      headers["Authorization"] = authHeader;
    } else if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      headers["Authorization"] = `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`;
    }

    const res = await fetch(url, {
      ...options,
      headers,
      cache: "no-store",
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      const errMsg = json?.error?.message || json?.error || `Backend responded with status ${res.status}`;
      return { success: false, error: errMsg, status: res.status };
    }

    // Backend wraps response in { success: true, data: T }
    const unwrappedData = json && typeof json === "object" && "data" in json ? json.data : json;

    return {
      success: true,
      data: unwrappedData as T,
      status: res.status,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to connect to backend";
    return { success: false, error: msg, status: 502 };
  }
}
