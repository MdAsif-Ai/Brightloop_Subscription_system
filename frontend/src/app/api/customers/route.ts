import { NextResponse } from "next/server";
import { serverStore } from "@/lib/server-store";

export async function GET() {
  const customers = serverStore.getCustomers();
  return NextResponse.json(customers);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const customer = serverStore.createCustomer(body);
    return NextResponse.json(customer, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
