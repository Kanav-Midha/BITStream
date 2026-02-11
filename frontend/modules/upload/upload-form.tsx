"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Clapperboard, ImagePlus, Link2 } from "lucide-react";
import { CONTENT_CATEGORIES } from "@/backend/content/types";

interface UploadFormProps {
  directUploadEnabled: boolean;
  message?: string;
  status?: string;
}

interface UploadedAssetState {
  publicId: string;
  url: string;
}

interface SignedUploadPayload {
  apiKey: string;
  cloudName: string;
  folder: string;
  publicId: string;
  resourceType: "video" | "image";
  signature: string;
  tags: string;
  timestamp: string;
}

interface SubmissionPayload {
  category: string;
  description: string;
  durationLabel: string;
  externalThumbnailUrl: string;
  externalVideoUrl: string;
  tags: string;
  thumbnailPublicId?: string;
  thumbnailUrl?: string;
  title: string;
  videoPublicId?: string;
  videoUrl?: string;
}

const SUPPORTED_VIDEO_EXTENSIONS = [
  ".mp4",
  ".webm",
  ".mov",
  ".m4v",
  ".ogv",
  ".ogg",
  ".mpeg",
  ".mpg",
  ".avi",
  ".mkv",
];

const SUPPORTED_VIDEO_ACCEPT = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-m4v",
  "video/ogg",
  "video/mpeg",
  "video/x-msvideo",
  "video/x-matroska",
  ...SUPPORTED_VIDEO_EXTENSIONS,
].join(",");

async function getSignedUpload(kind: "video" | "thumbnail") {
  const response = await fetch("/api/uploads/sign", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ kind }),
  });

  const payload = (await response.json()) as SignedUploadPayload & { error?: string };

  if (!response.ok) {
    throw new Error(payload.error || "Unable to prepare upload.");
  }

  return payload;
}

function uploadAsset(
  kind: "video" | "thumbnail",
  file: File,
  onProgress: (loaded: number, total: number) => void,
): Promise<UploadedAssetState> {
  return new Promise(async (resolve, reject) => {
    try {
      const signedUpload = await getSignedUpload(kind);
      const formData = new FormData();

      formData.append("file", file);
      formData.append("api_key", signedUpload.apiKey);
      formData.append("timestamp", signedUpload.timestamp);
      formData.append("folder", signedUpload.folder);
      formData.append("public_id", signedUpload.publicId);
      formData.append("signature", signedUpload.signature);
      formData.append("tags", signedUpload.tags);

      const request = new XMLHttpRequest();
      request.open(
        "POST",
        `https://api.cloudinary.com/v1_1/${signedUpload.cloudName}/${signedUpload.resourceType}/upload`,
      );

      request.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          onProgress(event.loaded, event.total);
        }
      };

      request.onerror = () => {
        reject(new Error("Upload failed."));
      };

      request.onload = () => {
        try {
          const payload = JSON.parse(request.responseText) as {
            error?: { message?: string };
            public_id?: string;
            secure_url?: string;
          };

          if (request.status < 200 || request.status >= 300 || !payload.secure_url || !payload.public_id) {
            reject(new Error(payload.error?.message || "Upload failed."));
            return;
          }

          resolve({
            publicId: payload.public_id,
            url: payload.secure_url,
          });
        } catch {
          reject(new Error("Upload failed."));
        }
      };

      request.send(formData);
    } catch (error) {
      reject(error instanceof Error ? error : new Error("Upload failed."));
    }
  });
}

async function submitSubmission(payload: SubmissionPayload) {
  const response = await fetch("/api/uploads/submit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const result = (await response.json()) as { error?: string; redirectTo?: string; success?: boolean };

  if (!response.ok || !result.success || !result.redirectTo) {
    throw new Error(result.error || "Unable to save submission.");
  }

  return result;
}

export function UploadForm({ directUploadEnabled, message, status }: UploadFormProps) {
  const [uploadError, setUploadError] = useState("");
  const [uploadState, setUploadState] = useState("");
  const [uploadPercent, setUploadPercent] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedVideo, setUploadedVideo] = useState<UploadedAssetState | null>(null);
  const [uploadedThumbnail, setUploadedThumbnail] = useState<UploadedAssetState | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUploadError("");
    setIsSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const title = formData.get("title")?.toString().trim() || "";
    const description = formData.get("description")?.toString().trim() || "";
    const category = formData.get("category")?.toString().trim() || "";
    const tags = formData.get("tags")?.toString() || "";
    const durationLabel = formData.get("durationLabel")?.toString().trim() || "00:00";
    const externalVideoUrl = formData.get("externalVideoUrl")?.toString().trim() || "";
    const externalThumbnailUrl = formData.get("externalThumbnailUrl")?.toString().trim() || "";
    const videoFile = formData.get("videoFile");
    const thumbnailFile = formData.get("thumbnailFile");
    const selectedVideoFile = videoFile instanceof File && videoFile.size > 0 ? videoFile : null;
    const selectedThumbnailFile = thumbnailFile instanceof File && thumbnailFile.size > 0 ? thumbnailFile : null;
    const totalBytes = [selectedVideoFile?.size || 0, selectedThumbnailFile?.size || 0].reduce(
      (sum, size) => sum + size,
      0,
    );
    let completedBytes = 0;

    try {
      let nextVideo = uploadedVideo;
      let nextThumbnail = uploadedThumbnail;

      if (selectedVideoFile && !uploadedVideo) {
        setUploadState("Uploading video...");
        nextVideo = await uploadAsset("video", selectedVideoFile, (loaded, total) => {
          const overall = totalBytes > 0 ? Math.round(((completedBytes + loaded) / totalBytes) * 100) : Math.round((loaded / total) * 100);
          setUploadPercent(Math.min(overall, 95));
        });
        completedBytes += selectedVideoFile.size;
        setUploadedVideo(nextVideo);
      }

      if (selectedThumbnailFile && !uploadedThumbnail) {
        setUploadState("Uploading thumbnail...");
        nextThumbnail = await uploadAsset("thumbnail", selectedThumbnailFile, (loaded, total) => {
          const overall = totalBytes > 0 ? Math.round(((completedBytes + loaded) / totalBytes) * 100) : Math.round((loaded / total) * 100);
          setUploadPercent(Math.min(overall, 95));
        });
        completedBytes += selectedThumbnailFile.size;
        setUploadedThumbnail(nextThumbnail);
      }

      setUploadState("Saving submission...");
      setUploadPercent(totalBytes > 0 ? 98 : 92);

      const result = await submitSubmission({
        category,
        description,
        durationLabel,
        externalThumbnailUrl,
        externalVideoUrl,
        tags,
        thumbnailPublicId: nextThumbnail?.publicId,
        thumbnailUrl: nextThumbnail?.url,
        title,
        videoPublicId: nextVideo?.publicId,
        videoUrl: nextVideo?.url,
      });

      setUploadPercent(100);
      setUploadState("Submission saved. Redirecting...");
      window.location.href = result.redirectTo || "/upload";
    } catch (error) {
      setUploadState("");
      setUploadPercent(0);
      setIsSubmitting(false);
      setUploadError(error instanceof Error ? error.message : "Upload failed.");
      return;
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-7">
      {status && message && (
        <div
          className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${
            status === "success"
              ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
              : "border-red-400/30 bg-red-500/10 text-red-100"
          }`}
        >
          {status === "success" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4" />
          )}
          <span>{message}</span>
        </div>
      )}

      {uploadError && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          <AlertCircle className="mt-0.5 h-4 w-4" />
          <span>{uploadError}</span>
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2 sm:gap-6">
        <label className="space-y-2">
          <span className="text-sm font-medium text-white">Title</span>
          <input
            name="title"
            required
            placeholder="Campus documentary, movie cut, tutorial..."
            className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-[#8fa3bd] focus:border-[#f0d6a8]"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-white">Category</span>
          <select
            name="category"
            required
            defaultValue={CONTENT_CATEGORIES[0]}
            className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-[#f0d6a8]"
          >
            {CONTENT_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="space-y-2">
        <span className="text-sm font-medium text-white">Description</span>
        <textarea
          name="description"
          required
          rows={5}
          placeholder="What is it, what vibe does it carry, and why should it be featured?"
          className="w-full rounded-[1.75rem] border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-[#8fa3bd] focus:border-[#f0d6a8]"
        />
      </label>

      <div className="grid gap-5 md:grid-cols-2 sm:gap-6">
        <label className="space-y-2">
          <span className="text-sm font-medium text-white">Tags</span>
          <input
            name="tags"
            placeholder="hostel, fest, monsoon, tutorial"
            className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-[#8fa3bd] focus:border-[#f0d6a8]"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-white">Duration</span>
          <input
            name="durationLabel"
            placeholder="08:45"
            className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-[#8fa3bd] focus:border-[#f0d6a8]"
          />
        </label>
      </div>

      <div className="grid gap-5 xl:grid-cols-2 sm:gap-6">
        <div className="rounded-[1.5rem] border border-white/10 bg-white/4 p-4 sm:rounded-[1.75rem] sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <Clapperboard className="h-4 w-4 text-[#f0d6a8]" />
            <h2 className="font-semibold text-white">Video</h2>
          </div>
          <div className="space-y-4">
            <label className="block space-y-2">
              <span className="text-sm text-[#afc0d6]">Hosted video or YouTube/Vimeo URL</span>
              <div className="relative">
                <Link2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8fa3bd]" />
                <input
                  type="url"
                  name="externalVideoUrl"
                  placeholder="https://..."
                  className="w-full rounded-2xl border border-white/10 bg-white/6 py-3 pl-11 pr-4 text-sm text-white outline-none transition-colors placeholder:text-[#8fa3bd] focus:border-[#f0d6a8]"
                />
              </div>
            </label>

            <label className="block space-y-2">
              <span className="text-sm text-[#afc0d6]">
                {directUploadEnabled ? "Upload a local video file" : "Local file upload is not live yet"}
              </span>
              <input
                type="file"
                name="videoFile"
                accept={SUPPORTED_VIDEO_ACCEPT}
                className="block w-full rounded-2xl border border-dashed border-white/10 bg-white/6 px-4 py-3 text-sm text-[#afc0d6] file:mr-4 file:rounded-full file:border-0 file:bg-[#f0d6a8] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#101827]"
              />
            </label>
            <p className="text-xs leading-6 text-[#93a8c3]">
              Supported video uploads and links: {SUPPORTED_VIDEO_EXTENSIONS.join(", ")}. Best browser playback is usually
              `.mp4`, `.webm`, `.mov`, and `.m4v`. Provider links from YouTube and Vimeo are supported too.
            </p>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-white/10 bg-white/4 p-4 sm:rounded-[1.75rem] sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <ImagePlus className="h-4 w-4 text-[#f0d6a8]" />
            <h2 className="font-semibold text-white">Thumbnail</h2>
          </div>
          <div className="space-y-4">
            <label className="block space-y-2">
              <span className="text-sm text-[#afc0d6]">Hosted image URL</span>
              <div className="relative">
                <Link2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8fa3bd]" />
                <input
                  type="url"
                  name="externalThumbnailUrl"
                  placeholder="https://..."
                  className="w-full rounded-2xl border border-white/10 bg-white/6 py-3 pl-11 pr-4 text-sm text-white outline-none transition-colors placeholder:text-[#8fa3bd] focus:border-[#f0d6a8]"
                />
              </div>
            </label>

            <label className="block space-y-2">
              <span className="text-sm text-[#afc0d6]">
                {directUploadEnabled ? "Upload a local thumbnail image" : "Local image upload is not live yet"}
              </span>
              <input
                type="file"
                name="thumbnailFile"
                accept="image/png,image/jpeg,image/webp"
                className="block w-full rounded-2xl border border-dashed border-white/10 bg-white/6 px-4 py-3 text-sm text-[#afc0d6] file:mr-4 file:rounded-full file:border-0 file:bg-[#f0d6a8] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#101827]"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-[#f0d6a8]/20 bg-[#f0d6a8]/8 p-4 text-sm leading-6 text-[#d9e3f0] sm:rounded-[1.75rem] sm:p-5 sm:leading-7">
        {uploadState ||
          (directUploadEnabled
            ? "Local files upload directly to Cloudinary before the submission is saved."
            : "Direct uploads become available on the live site after Cloudinary env vars are added in Vercel. Until then, use hosted URLs.")}

        {isSubmitting && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.24em] text-[#f4e3c1]">
              <span>{uploadState || "Uploading..."}</span>
              <span>{uploadPercent}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[#f0d6a8] transition-[width] duration-300 ease-out"
                style={{ width: `${uploadPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex w-full items-center justify-center rounded-full bg-[#f0d6a8] px-6 py-3 text-sm font-semibold text-[#111827] transition-colors hover:bg-[#f7dfb7] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? `${uploadState || "Submitting..."} ${uploadPercent}%` : "Send for review"}
      </button>
    </form>
  );
}
