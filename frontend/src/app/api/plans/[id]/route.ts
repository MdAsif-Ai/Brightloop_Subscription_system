import { NextResponse } from "next/server";
import { serverStore } from "@/lib/server-store";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const plans = serverStore.getPlans();
    const idx = plans.findIndex((p) => p.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }
    plans[idx] = { ...plans[idx], ...body };
    return NextResponse.json(plans[idx]);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
