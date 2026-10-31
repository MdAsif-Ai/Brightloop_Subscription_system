import { NextResponse } from "next/server";
import { serverStore } from "@/lib/server-store";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const customerId = searchParams.get("customer_id");
  const subscriptionId = searchParams.get("subscription_id");

  const invoices = serverStore.getInvoices({
    status: status || undefined,
    customer_id: customerId || undefined,
    subscription_id: subscriptionId || undefined,
  });

  return NextResponse.json(invoices);
}
