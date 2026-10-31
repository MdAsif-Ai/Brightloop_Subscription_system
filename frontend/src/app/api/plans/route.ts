import { NextResponse } from "next/server";
import { serverStore } from "@/lib/server-store";

export async function GET() {
  const plans = serverStore.getPlans();
  return NextResponse.json(plans);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const plan = serverStore.createPlan(body);
    return NextResponse.json(plan, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
