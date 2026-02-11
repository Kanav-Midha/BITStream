import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/backend/auth/session";
import { createSubmission } from "@/backend/content/repository";
import { getPreferredThumbnailUrl } from "@/backend/content/thumbnail-utils";
import { CONTENT_CATEGORIES, type ContentCategory } from "@/backend/content/types";
import { parseTags } from "@/backend/content/utils";

function isCategory(value: string): value is ContentCategory {
  return CONTENT_CATEGORIES.includes(value as ContentCategory);
}

function isValidHttpUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        category?: string;
        description?: string;
        durationLabel?: string;
        externalThumbnailUrl?: string;
        externalVideoUrl?: string;
        tags?: string;
        thumbnailPublicId?: string;
        thumbnailUrl?: string;
        title?: string;
        videoPublicId?: string;
        videoUrl?: string;
      }
    | null;

  const title = body?.title?.trim() || "";
  const description = body?.description?.trim() || "";
  const category = body?.category?.trim() || "";
  const tags = parseTags(body?.tags || "");
  const durationLabel = body?.durationLabel?.trim() || "00:00";
  const externalVideoUrl = body?.externalVideoUrl?.trim() || "";
  const externalThumbnailUrl = body?.externalThumbnailUrl?.trim() || "";
  const uploadedVideoUrl = body?.videoUrl?.trim() || "";
  const uploadedVideoPublicId = body?.videoPublicId?.trim() || "";
  const uploadedThumbnailUrl = body?.thumbnailUrl?.trim() || "";
  const uploadedThumbnailPublicId = body?.thumbnailPublicId?.trim() || "";

  if (!title || !description) {
    return NextResponse.json({ error: "Title and description are required." }, { status: 400 });
  }

  if (!isCategory(category)) {
    return NextResponse.json({ error: "Choose a valid content category." }, { status: 400 });
  }

  if (externalVideoUrl && !isValidHttpUrl(externalVideoUrl)) {
    return NextResponse.json({ error: "Use a valid hosted video URL." }, { status: 400 });
  }

  if (externalThumbnailUrl && !isValidHttpUrl(externalThumbnailUrl)) {
    return NextResponse.json({ error: "Use a valid thumbnail URL." }, { status: 400 });
  }

  const videoUrl = uploadedVideoUrl || externalVideoUrl;
  const thumbnailUrl = getPreferredThumbnailUrl({
    thumbnailUrl: uploadedThumbnailUrl || externalThumbnailUrl,
    videoUrl,
  });

  if (!videoUrl) {
    return NextResponse.json(
      { error: "Upload a video file or provide a hosted video URL." },
      { status: 400 },
    );
  }

  try {
    await createSubmission({
      category,
      description,
      durationLabel,
      tags,
      thumbnailUrl,
      title,
      uploader: user,
      videoUrl,
      storage: {
        thumbnailPublicId: uploadedThumbnailPublicId || undefined,
        videoPublicId: uploadedVideoPublicId || undefined,
      },
    });

    revalidatePath("/");
    revalidatePath("/upload");
    revalidatePath("/my-uploads");
    revalidatePath("/admin");

    return NextResponse.json({
      redirectTo: "/upload?status=success&message=Submission+queued+for+admin+approval.",
      success: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save submission.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
