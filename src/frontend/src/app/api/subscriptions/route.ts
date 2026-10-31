import { NextResponse } from "next/server";
import { serverStore } from "@/lib/server-store";
import { forwardToBackend, BACKEND_URL } from "@/lib/api-adapter";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const customerId = searchParams.get("customer_id");

  if (BACKEND_URL) {
    const authHeader = req.headers.get("authorization");
    const query = searchParams.toString();
    const result = await forwardToBackend(`/api/subscriptions${query ? `?${query}` : ""}`, { method: "GET" }, authHeader);
    if (result.success && result.data) {
      return NextResponse.json(result.data);
    }
  }

  let subs = serverStore.getSubscriptions();
  if (status && status !== "all") {
    subs = subs.filter((s) => s.status === status);
  }
  if (customerId) {
    subs = subs.filter((s) => s.customer_id === customerId);
  }
  return NextResponse.json(subs);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (BACKEND_URL) {
      const authHeader = req.headers.get("authorization");
      const result = await forwardToBackend("/api/subscriptions", {
        method: "POST",
        body: JSON.stringify(body),
      }, authHeader);
      if (result.success && result.data) {
        return NextResponse.json(result.data, { status: 201 });
      }
    }
    const subscription = serverStore.createSubscription(body);
    return NextResponse.json(subscription, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
