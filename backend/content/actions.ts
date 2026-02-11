"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { getPreferredThumbnailUrl } from "@/backend/content/thumbnail-utils";
import { CONTENT_CATEGORIES, type ContentCategory } from "@/backend/content/types";
import { createSubmission, reviewSubmission } from "@/backend/content/repository";
import { parseTags } from "@/backend/content/utils";
import { requireAdminUser, requireCampusUser } from "@/backend/auth/session";
import {
  cloudinaryUploadsEnabled,
  persistThumbnailUpload,
  persistVideoUpload,
} from "@/backend/storage/file-uploads";

function isCategory(value: string): value is ContentCategory {
  return CONTENT_CATEGORIES.includes(value as ContentCategory);
}

function getUploadMessageUrl(status: string, message: string) {
  const params = new URLSearchParams({ status, message });
  return `/upload?${params.toString()}`;
}

function isValidHttpUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export async function submitMediaAction(formData: FormData) {
  const user = await requireCampusUser("/upload");

  try {
    const title = formData.get("title")?.toString().trim() || "";
    const description = formData.get("description")?.toString().trim() || "";
    const category = formData.get("category")?.toString().trim() || "";
    const tags = parseTags(formData.get("tags")?.toString() || "");
    const durationLabel = formData.get("durationLabel")?.toString().trim() || "00:00";
    const externalVideoUrl = formData.get("externalVideoUrl")?.toString().trim() || "";
    const externalThumbnailUrl = formData.get("externalThumbnailUrl")?.toString().trim() || "";
    const uploadedVideoUrl = formData.get("uploadedVideoUrl")?.toString().trim() || "";
    const uploadedVideoPublicId = formData.get("uploadedVideoPublicId")?.toString().trim() || "";
    const uploadedThumbnailUrl = formData.get("uploadedThumbnailUrl")?.toString().trim() || "";
    const uploadedThumbnailPublicId = formData.get("uploadedThumbnailPublicId")?.toString().trim() || "";
    const videoFile = formData.get("videoFile");
    const thumbnailFile = formData.get("thumbnailFile");
    const isHostedRuntime = process.env.VERCEL === "1";

    if (!title || !description) {
      redirect(getUploadMessageUrl("error", "Title and description are required."));
    }

    if (!isCategory(category)) {
      redirect(getUploadMessageUrl("error", "Choose a valid content category."));
    }

    if (externalVideoUrl && !isValidHttpUrl(externalVideoUrl)) {
      redirect(getUploadMessageUrl("error", "Use a valid hosted video URL."));
    }

    if (externalThumbnailUrl && !isValidHttpUrl(externalThumbnailUrl)) {
      redirect(getUploadMessageUrl("error", "Use a valid thumbnail URL."));
    }

    if (
      isHostedRuntime &&
      !cloudinaryUploadsEnabled() &&
      videoFile instanceof File &&
      videoFile.size > 0
    ) {
      redirect(
        getUploadMessageUrl(
          "error",
          "Direct file upload is not enabled until Cloudinary is configured. Paste a hosted video URL instead.",
        ),
      );
    }

    if (
      isHostedRuntime &&
      !cloudinaryUploadsEnabled() &&
      thumbnailFile instanceof File &&
      thumbnailFile.size > 0
    ) {
      redirect(
        getUploadMessageUrl(
          "error",
          "Direct image upload is not enabled until Cloudinary is configured. Use a hosted thumbnail URL instead.",
        ),
      );
    }

    const savedVideoUrl =
      videoFile instanceof File && videoFile.size > 0 ? await persistVideoUpload(videoFile) : { url: "" };
    const savedThumbnailUrl =
      thumbnailFile instanceof File && thumbnailFile.size > 0
        ? await persistThumbnailUpload(thumbnailFile)
        : { url: "" };

    const videoUrl = uploadedVideoUrl || savedVideoUrl.url || externalVideoUrl;
    const thumbnailUrl = getPreferredThumbnailUrl({
      thumbnailUrl: uploadedThumbnailUrl || savedThumbnailUrl.url || externalThumbnailUrl,
      videoUrl,
    });

    if (!videoUrl) {
      redirect(getUploadMessageUrl("error", "Upload a video file or provide a hosted video URL."));
    }

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
        thumbnailPublicId: uploadedThumbnailPublicId || savedThumbnailUrl.publicId,
        videoPublicId: uploadedVideoPublicId || savedVideoUrl.publicId,
      },
    });

    revalidatePath("/");
    revalidatePath("/upload");
    revalidatePath("/my-uploads");
    revalidatePath("/admin");
    redirect(getUploadMessageUrl("success", "Submission queued for admin approval."));
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    const message = error instanceof Error ? error.message : "Unable to save submission.";
    redirect(getUploadMessageUrl("error", message));
  }
}

export async function reviewSubmissionAction(formData: FormData) {
  const admin = await requireAdminUser();
  const id = formData.get("id")?.toString() || "";
  const decision = formData.get("decision")?.toString() || "";
  const notes = formData.get("notes")?.toString() || "";

  if (!id || (decision !== "approved" && decision !== "rejected")) {
    redirect("/admin?status=error");
  }

  await reviewSubmission({
    id,
    notes,
    reviewerEmail: admin.email,
    status: decision,
  });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/my-uploads");
  redirect(`/admin?status=${decision}`);
}
