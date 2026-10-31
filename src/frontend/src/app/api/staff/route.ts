import { NextResponse } from "next/server";
import { serverStore } from "@/lib/server-store";

export async function GET() {
  const staff = serverStore.getStaff();
  return NextResponse.json(staff);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email } = body;
    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }
    const staff = serverStore.createStaff(name, email);
    return NextResponse.json(staff, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
