import { NextResponse } from "next/server";
import { serverStore } from "@/lib/server-store";

export async function GET() {
  const taxRules = serverStore.getTaxRules();
  return NextResponse.json(taxRules);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rule = serverStore.createTaxRule(body);
    return NextResponse.json(rule, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
