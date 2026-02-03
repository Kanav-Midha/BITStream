export const DEFAULT_THUMBNAIL_URL = "/default-thumbnail.webp";

const LEGACY_PLACEHOLDERS = new Set(["", "/placeholder.jpg", "/placeholder.svg", DEFAULT_THUMBNAIL_URL]);

export function getYouTubeVideoId(videoUrl: string) {
  try {
    const parsed = new URL(videoUrl);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      return parsed.pathname.split("/").filter(Boolean)[0] || null;
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      return parsed.searchParams.get("v") || parsed.pathname.split("/").filter(Boolean).at(-1) || null;
    }
  } catch {
    return null;
  }

  return null;
}

export function getYouTubeThumbnailUrl(videoUrl: string) {
  const videoId = getYouTubeVideoId(videoUrl);
  return videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : null;
}

function normalizeSource(value: string | null | undefined) {
  return value?.trim() || "";
}

export function isMissingThumbnail(value: string | null | undefined) {
  return LEGACY_PLACEHOLDERS.has(normalizeSource(value));
}

export function getThumbnailCandidates({
  thumbnailUrl,
  videoUrl,
}: {
  thumbnailUrl?: string | null;
  videoUrl?: string | null;
}) {
  const candidates: string[] = [];
  const normalizedThumbnail = normalizeSource(thumbnailUrl);
  const normalizedVideo = normalizeSource(videoUrl);

  if (normalizedThumbnail && !isMissingThumbnail(normalizedThumbnail)) {
    candidates.push(normalizedThumbnail);
  }

  const youTubeThumbnail = normalizedVideo ? getYouTubeThumbnailUrl(normalizedVideo) : null;

  if (youTubeThumbnail) {
    candidates.push(youTubeThumbnail);
  }

  candidates.push(DEFAULT_THUMBNAIL_URL);

  return Array.from(new Set(candidates));
}

export function getPreferredThumbnailUrl({
  thumbnailUrl,
  videoUrl,
}: {
  thumbnailUrl?: string | null;
  videoUrl?: string | null;
}) {
  return getThumbnailCandidates({ thumbnailUrl, videoUrl })[0];
}
