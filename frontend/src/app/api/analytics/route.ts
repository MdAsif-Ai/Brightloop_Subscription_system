import { NextResponse } from "next/server";
import { serverStore } from "@/lib/server-store";

export async function GET() {
  const analytics = serverStore.getAnalytics();
  return NextResponse.json(analytics);
}
