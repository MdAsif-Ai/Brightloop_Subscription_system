import { NextResponse } from "next/server";
import { serverStore } from "@/lib/server-store";

export async function GET() {
  return NextResponse.json({ date: serverStore.simulatedDate });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (body.date) {
      serverStore.simulatedDate = body.date;
    }
    return NextResponse.json({ date: serverStore.simulatedDate });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
