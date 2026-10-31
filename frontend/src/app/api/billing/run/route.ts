import { NextResponse } from "next/server";
import { serverStore } from "@/lib/server-store";

export async function GET() {
  const runs = serverStore.getBillingRuns();
  return NextResponse.json(runs);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const asOfDate = body.as_of_date || serverStore.simulatedDate;
    const result = serverStore.runBilling(asOfDate);
    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
