import { NextResponse } from "next/server";
import { serverStore } from "@/lib/server-store";
import { forwardToBackend, BACKEND_URL } from "@/lib/api-adapter";

export async function GET(req: Request) {
  if (BACKEND_URL) {
    const authHeader = req.headers.get("authorization");
    const result = await forwardToBackend("/api/guardian", { method: "GET" }, authHeader);
    if (result.success && result.data) {
      return NextResponse.json(result.data);
    }
  }
  const issues = serverStore.getGuardianIssues();
  return NextResponse.json(issues);
}
