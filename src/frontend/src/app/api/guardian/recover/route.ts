import { NextResponse } from "next/server";
import { serverStore } from "@/lib/server-store";
import { forwardToBackend, BACKEND_URL } from "@/lib/api-adapter";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const issueId = body.issue_id || body.id;
    if (!issueId) {
      return NextResponse.json({ error: "Missing issue_id" }, { status: 400 });
    }

    if (BACKEND_URL) {
      const authHeader = req.headers.get("authorization");
      const result = await forwardToBackend("/api/guardian/recover", {
        method: "POST",
        body: JSON.stringify({ issue_id: issueId }),
      }, authHeader);
      if (result.success && result.data) {
        return NextResponse.json(result.data);
      }
    }

    const result = serverStore.recoverIssue(issueId);
    if (!result) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
