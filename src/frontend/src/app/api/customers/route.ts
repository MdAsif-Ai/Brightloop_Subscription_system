import { NextResponse } from "next/server";
import { serverStore } from "@/lib/server-store";
import { forwardToBackend, BACKEND_URL } from "@/lib/api-adapter";

export async function GET(req: Request) {
  if (BACKEND_URL) {
    const authHeader = req.headers.get("authorization");
    const result = await forwardToBackend("/api/customers", { method: "GET" }, authHeader);
    if (result.success && result.data) {
      return NextResponse.json(result.data);
    }
  }
  const customers = serverStore.getCustomers();
  return NextResponse.json(customers);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (BACKEND_URL) {
      const authHeader = req.headers.get("authorization");
      const result = await forwardToBackend("/api/customers", {
        method: "POST",
        body: JSON.stringify(body),
      }, authHeader);
      if (result.success && result.data) {
        return NextResponse.json(result.data, { status: 201 });
      }
    }
    const customer = serverStore.createCustomer(body);
    return NextResponse.json(customer, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
