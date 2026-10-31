import { NextResponse } from "next/server";
import { serverStore } from "@/lib/server-store";
import { forwardToBackend, BACKEND_URL } from "@/lib/api-adapter";

export async function GET(req: Request) {
  if (BACKEND_URL) {
    const authHeader = req.headers.get("authorization");
    const result = await forwardToBackend("/api/billing/run", { method: "GET" }, authHeader);
    if (result.success && result.data) {
      return NextResponse.json(result.data);
    }
  }
  const runs = serverStore.getBillingRuns();
  return NextResponse.json(runs);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const asOfDate = body.as_of_date || serverStore.simulatedDate;
    if (BACKEND_URL) {
      const authHeader = req.headers.get("authorization");
      const result = await forwardToBackend("/api/billing/run", {
        method: "POST",
        body: JSON.stringify({ as_of_date: asOfDate }),
      }, authHeader);
      if (result.success && result.data) {
        return NextResponse.json(result.data, { status: 200 });
      }
    }
    const result = serverStore.runBilling(asOfDate);
    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
