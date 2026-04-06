import { NextResponse } from "next/server";
import { getCurrentUser } from "@/backend/auth/session";
import { addSnapComment } from "@/backend/snap/service";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { comment?: string; snapId?: string } | null;
  const snapId = body?.snapId?.trim() || "";
  const comment = body?.comment?.trim() || "";

  if (!snapId) {
    return NextResponse.json({ error: "Snap id is required." }, { status: 400 });
  }

  if (!comment) {
    return NextResponse.json({ error: "Comment is required." }, { status: 400 });
  }

  try {
    const snap = await addSnapComment(user, snapId, comment);
    return NextResponse.json({ snap, success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to add comment.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}