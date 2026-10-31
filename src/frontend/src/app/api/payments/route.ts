import { NextResponse } from "next/server";
import { serverStore } from "@/lib/server-store";

export async function GET() {
  const payments = serverStore.getPayments();
  return NextResponse.json(payments);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = serverStore.recordPayment(body);
    if (!result) {
      return NextResponse.json({ error: "Invoice not found or invalid payment" }, { status: 400 });
    }
    return NextResponse.json(result, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
