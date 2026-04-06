"use client";

import { useRef, useState } from "react";
import { Camera, ImagePlus, Link2, LoaderCircle, Send } from "lucide-react";

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

interface SnapComposerProps {
  canPost: boolean;
  directUploadEnabled: boolean;
  onCreate: (payload: { caption: string; imageUrl: string }) => Promise<void>;
}

async function getSignedUpload() {
  const response = await fetch("/api/uploads/sign", {
    body: JSON.stringify({ kind: "thumbnail" }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  const payload = (await response.json()) as SignedUploadPayload & { error?: string };

  if (!response.ok) {
    throw new Error(payload.error || "Unable to prepare upload.");
  }

  return payload;
}

function uploadImage(file: File, onProgress: (loaded: number, total: number) => void): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const signedUpload = await getSignedUpload();
      const formData = new FormData();

      formData.append("file", file);
      formData.append("api_key", signedUpload.apiKey);
      formData.append("timestamp", signedUpload.timestamp);
      formData.append("folder", signedUpload.folder);
      formData.append("public_id", signedUpload.publicId);
      formData.append("signature", signedUpload.signature);
      formData.append("tags", signedUpload.tags);

      const request = new XMLHttpRequest();
      request.open("POST", `https://api.cloudinary.com/v1_1/${signedUpload.cloudName}/image/upload`);

      request.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          onProgress(event.loaded, event.total);
        }
      };

      request.onerror = () => reject(new Error("Image upload failed."));

      request.onload = () => {
        try {
          const payload = JSON.parse(request.responseText) as {
            error?: { message?: string };
            secure_url?: string;
          };

          if (request.status < 200 || request.status >= 300 || !payload.secure_url) {
            reject(new Error(payload.error?.message || "Image upload failed."));
            return;
          }

          resolve(payload.secure_url);
        } catch {
          reject(new Error("Image upload failed."));
        }
      };

      request.send(formData);
    } catch (error) {
      reject(error instanceof Error ? error : new Error("Image upload failed."));
    }
  });
}

export function SnapComposer({ canPost, directUploadEnabled, onCreate }: SnapComposerProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [caption, setCaption] = useState("");
  const [externalImageUrl, setExternalImageUrl] = useState("");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    setProgress(0);

    const file = fileInputRef.current?.files?.[0] || null;

    try {
      let imageUrl = externalImageUrl.trim();

      if (file) {
        imageUrl = await uploadImage(file, (loaded, total) => {
          setProgress(total > 0 ? Math.round((loaded / total) * 100) : 0);
        });
      }

      if (!imageUrl) {
        throw new Error("Choose an image or paste a hosted image URL.");
      }

      await onCreate({
        caption,
        imageUrl,
      });

      setCaption("");
      setExternalImageUrl("");
      setProgress(0);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to post snap.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(12,20,34,0.96),rgba(20,34,54,0.92))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.22)] sm:p-6"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/12 bg-white/6 text-[#f0d6a8]">
          <Camera className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[#d8bc88]">Snap composer</p>
          <h2 className="mt-1 text-xl font-semibold text-white">Post a campus moment</h2>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <label className="space-y-2">
          <span className="text-sm font-medium text-white">Caption</span>
            <textarea
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              maxLength={220}
              rows={5}
              disabled={!canPost || isSubmitting}
              placeholder="Fest lights, coding night, cricket in the quad..."
              className="w-full rounded-[1.5rem] border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-[#8fa3bd] focus:border-[#f0d6a8]"
            />
          <p className="text-xs text-[#8fa3bd]">{caption.length}/220</p>
        </label>

        <div className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-white">Hosted image URL</span>
            <div className="relative">
              <Link2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8fa3bd]" />
              <input
                type="url"
                value={externalImageUrl}
                onChange={(event) => setExternalImageUrl(event.target.value)}
                disabled={!canPost || isSubmitting}
                placeholder="https://..."
                className="w-full rounded-2xl border border-white/10 bg-white/6 py-3 pl-11 pr-4 text-sm text-white outline-none transition-colors placeholder:text-[#8fa3bd] focus:border-[#f0d6a8]"
              />
            </div>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-white">
              {directUploadEnabled ? "Upload image" : "Local upload is not configured here"}
            </span>
            <div className="rounded-[1.4rem] border border-dashed border-white/12 bg-black/10 p-4">
              <div className="flex items-center gap-3 text-sm text-[#c7d2e2]">
                <ImagePlus className="h-4 w-4 text-[#f0d6a8]" />
                <span>PNG, JPG, WEBP, or a hosted image link</span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                disabled={!canPost || !directUploadEnabled || isSubmitting}
                className="mt-4 block w-full text-sm text-[#afc0d6] file:mr-4 file:rounded-full file:border-0 file:bg-[#f0d6a8] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#111827] hover:file:bg-[#f7dfb7]"
              />
            </div>
          </label>
        </div>
      </div>

      {!canPost && (
        <div className="mt-5 rounded-[1.35rem] border border-white/10 bg-white/6 px-4 py-3 text-sm text-[#d7e0ec]">
          Sign in from the top-right corner to post snaps. The page will stay open here.
        </div>
      )}

      {isSubmitting && (
        <div className="mt-5 rounded-[1.35rem] border border-white/10 bg-white/6 p-4">
          <div className="flex items-center justify-between text-sm text-[#dce6f5]">
            <span>{progress > 0 ? "Uploading image..." : "Posting snap..."}</span>
            <span>{progress}%</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-[#f0d6a8] transition-all duration-300" style={{ width: `${Math.min(progress, 100)}%` }} />
          </div>
        </div>
      )}

      {error && (
        <div className="mt-5 rounded-[1.35rem] border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      )}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-[#9bb0ca]">Each snap stays live for 24 hours and is visible to everyone signed in at BITS Goa.</p>
        <button
          type="submit"
          disabled={!canPost || isSubmitting}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f0d6a8] px-5 py-3 text-sm font-semibold text-[#111827] transition-colors hover:bg-[#f7dfb7] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Post snap
        </button>
      </div>
    </form>
  );
}
