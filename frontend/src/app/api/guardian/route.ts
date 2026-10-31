import { NextResponse } from "next/server";
import { serverStore } from "@/lib/server-store";

export async function GET() {
  const issues = serverStore.getGuardianIssues();
  return NextResponse.json(issues);
}
