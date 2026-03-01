"use client";

import { useEffect, useState, type ImgHTMLAttributes } from "react";
import { DEFAULT_THUMBNAIL_URL, getThumbnailCandidates } from "@/backend/content/thumbnail-utils";

interface MediaThumbnailProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src?: string | null;
  videoUrl?: string | null;
}

export function MediaThumbnail({ src, videoUrl, alt, ...props }: MediaThumbnailProps) {
  const candidates = getThumbnailCandidates({ thumbnailUrl: src, videoUrl });
  const [resolvedSrc, setResolvedSrc] = useState(DEFAULT_THUMBNAIL_URL);

  useEffect(() => {
    let cancelled = false;

    setResolvedSrc(DEFAULT_THUMBNAIL_URL);

    async function resolveThumbnail() {
      for (const candidate of candidates) {
        if (candidate === DEFAULT_THUMBNAIL_URL) {
          if (!cancelled) {
            setResolvedSrc(DEFAULT_THUMBNAIL_URL);
          }
          return;
        }

        const image = new Image();

        const result = await new Promise<boolean>((resolve) => {
          image.onload = () => resolve(true);
          image.onerror = () => resolve(false);
          image.src = candidate;
        });

        if (result) {
          if (!cancelled) {
            setResolvedSrc(candidate);
          }
          return;
        }
      }
    }

    void resolveThumbnail();

    return () => {
      cancelled = true;
    };
  }, [src, videoUrl]);

  return (
    <img
      {...props}
      alt={alt}
      src={resolvedSrc}
    />
  );
}
