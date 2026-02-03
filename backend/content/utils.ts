export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function formatCompactNumber(value: number) {
  if (value < 1000) {
    return `${value}`;
  }

  if (value < 1000000) {
    return `${(value / 1000).toFixed(1)}K`;
  }

  return `${(value / 1000000).toFixed(1)}M`;
}

export function parseTags(rawValue: string) {
  return rawValue
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 8);
}

export function encodeMetadataValue(value: string) {
  return encodeURIComponent(value);
}

export function decodeMetadataValue(value?: string | null) {
  if (!value) {
    return "";
  }

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function formatDurationLabelFromSeconds(totalSeconds?: number) {
  if (!totalSeconds || Number.isNaN(totalSeconds)) {
    return "00:00";
  }

  const rounded = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const seconds = rounded % 60;

  if (hours > 0) {
    return [hours, minutes, seconds].map((value) => `${value}`.padStart(2, "0")).join(":");
  }

  return [minutes, seconds].map((value) => `${value}`.padStart(2, "0")).join(":");
}
