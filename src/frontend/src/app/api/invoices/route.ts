import { NextResponse } from "next/server";
import { serverStore } from "@/lib/server-store";
import { forwardToBackend, BACKEND_URL } from "@/lib/api-adapter";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const customerId = searchParams.get("customer_id");
  const subscriptionId = searchParams.get("subscription_id");

  if (BACKEND_URL) {
    const authHeader = req.headers.get("authorization");
    const query = searchParams.toString();
    const result = await forwardToBackend(`/api/invoices${query ? `?${query}` : ""}`, { method: "GET" }, authHeader);
    if (result.success && result.data) {
      return NextResponse.json(result.data);
    }
  }

  const invoices = serverStore.getInvoices({
    status: status || undefined,
    customer_id: customerId || undefined,
    subscription_id: subscriptionId || undefined,
  });

  return NextResponse.json(invoices);
}
