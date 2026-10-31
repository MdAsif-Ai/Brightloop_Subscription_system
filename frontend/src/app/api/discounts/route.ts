import { NextResponse } from "next/server";
import { serverStore } from "@/lib/server-store";

export async function GET() {
  const discounts = serverStore.getDiscounts();
  return NextResponse.json(discounts);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const discount = serverStore.createDiscount(body);
    return NextResponse.json(discount, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
