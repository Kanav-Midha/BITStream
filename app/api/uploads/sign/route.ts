import { NextResponse } from "next/server";
import { getCurrentUser } from "@/backend/auth/session";
import { createSignedCloudinaryUpload } from "@/backend/storage/file-uploads";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { kind?: "video" | "thumbnail" } | null;

  if (body?.kind !== "video" && body?.kind !== "thumbnail") {
    return NextResponse.json({ error: "Invalid upload kind" }, { status: 400 });
  }

  try {
    const signedUpload = createSignedCloudinaryUpload(
      body.kind === "video"
        ? { folderName: "videos", resourceType: "video" }
        : { folderName: "thumbnails", resourceType: "image" },
    );

    return NextResponse.json(signedUpload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to sign upload.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
