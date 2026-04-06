import { NextResponse } from "next/server";
import { getCurrentUser } from "@/backend/auth/session";
import { toggleSnapLike } from "@/backend/snap/service";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { snapId?: string } | null;
  const snapId = body?.snapId?.trim() || "";

  if (!snapId) {
    return NextResponse.json({ error: "Snap id is required." }, { status: 400 });
  }

  try {
    const snap = await toggleSnapLike(user, snapId);
    return NextResponse.json({ snap, success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update like.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}