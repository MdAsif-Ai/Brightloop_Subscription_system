import { NextResponse } from "next/server";
import { serverStore } from "@/lib/server-store";
import { forwardToBackend, BACKEND_URL } from "@/lib/api-adapter";

export async function GET(req: Request) {
  if (BACKEND_URL) {
    const authHeader = req.headers.get("authorization");
    const result = await forwardToBackend("/api/plans", { method: "GET" }, authHeader);
    if (result.success && result.data) {
      return NextResponse.json(result.data);
    }
  }
  const plans = serverStore.getPlans();
  return NextResponse.json(plans);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (BACKEND_URL) {
      const authHeader = req.headers.get("authorization");
      const result = await forwardToBackend("/api/plans", {
        method: "POST",
        body: JSON.stringify(body),
      }, authHeader);
      if (result.success && result.data) {
        return NextResponse.json(result.data, { status: 201 });
      }
    }
    const plan = serverStore.createPlan(body);
    return NextResponse.json(plan, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
