import { NextResponse } from "next/server";
import { serverStore } from "@/lib/server-store";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const issueId = body.issue_id || body.id;
    if (!issueId) {
      return NextResponse.json({ error: "Missing issue_id" }, { status: 400 });
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
