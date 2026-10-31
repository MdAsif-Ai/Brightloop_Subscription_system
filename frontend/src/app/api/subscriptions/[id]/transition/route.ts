import { NextResponse } from "next/server";
import { serverStore } from "@/lib/server-store";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const action = body.action;
    if (!action) {
      return NextResponse.json({ error: "Missing action" }, { status: 400 });
    }

    const updated = serverStore.transitionSubscription(id, action);
    if (!updated) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
