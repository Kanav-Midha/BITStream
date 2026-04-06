import { NextResponse } from "next/server";
import { getCurrentUser } from "@/backend/auth/session";
import { createSnap, listActiveSnaps } from "@/backend/snap/service";

function isValidHttpUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const feed = await listActiveSnaps(user.email);
  return NextResponse.json(feed);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { caption?: string; imageUrl?: string } | null;
  const imageUrl = body?.imageUrl?.trim() || "";

  if (!imageUrl || !isValidHttpUrl(imageUrl)) {
    return NextResponse.json({ error: "Upload an image or use a valid hosted image URL." }, { status: 400 });
  }

  try {
    const snap = await createSnap(user, {
      caption: body?.caption || "",
      imageUrl,
    });

    return NextResponse.json({ snap, success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create snap.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}